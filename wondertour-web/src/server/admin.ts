// Quản trị web: đăng nhập bằng tài khoản nhân viên xTravelOS (POST /public/v1/staff/login), chỉ vai trò
// được phép mới vào. Tài khoản trong biến môi trường (ADMIN_USERNAME, ADMIN_PASSWORD_HASH) là lối dự phòng
// khi xTravelOS chưa có đầu API này hoặc đang tắt. Phiên là cookie ký, HttpOnly, SameSite=Strict, 8 giờ.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import express, { type CookieOptions, type Request, type RequestHandler, type Response } from "express";
import { z } from "zod";
import { StaffLoginResult } from "../shared/schemas";
import { SiteSettings } from "../shared/settings";
import { ah, HttpError } from "./api-routes";
import type { AppConfig } from "./config";
import { log } from "./logger";
import { RateLimiter } from "./rate-limit";
import type { SettingsStore } from "./settings-store";
import { UpstreamError, UpstreamUnavailable, type XTravelClient } from "./xtravel";

export const ADMIN_COOKIE = "wt_admin";
const SESSION_HOURS = 8;

/** Băm mật khẩu dạng "scrypt$<salt hex>$<hash hex>". */
export function hashPassword(password: string, salt = randomBytes(16).toString("hex")): string {
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const given = scryptSync(password, salt, expected.length);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

function cookieOptions(secure: boolean): CookieOptions {
  return { httpOnly: true, secure, sameSite: "strict", path: "/", signed: true, maxAge: SESSION_HOURS * 3600_000 };
}

/** Phiên quản trị: ai, vai trò gì, từ đâu (xTravelOS hay dự phòng), và mã phiên xTravelOS nếu có. */
export interface AdminSession {
  username: string;
  name: string;
  role: string;
  source: "xtravelos" | "env";
  token: string | null;
}

const CookiePayload = z.object({
  u: z.string().min(1).max(64),
  n: z.string().max(100),
  r: z.string().max(32),
  s: z.enum(["xtravelos", "env"]),
  t: z.string().max(512).nullable(),
  exp: z.number(),
});

export function readAdmin(req: Request, config: AppConfig): AdminSession | null {
  const raw: unknown = req.signedCookies?.[ADMIN_COOKIE];
  if (typeof raw !== "string") return null;
  try {
    const p = CookiePayload.safeParse(JSON.parse(raw));
    if (!p.success || p.data.exp < Date.now()) return null;
    // Lối dự phòng chỉ còn hiệu lực khi tài khoản dự phòng vẫn đang cấu hình đúng tên đó.
    if (p.data.s === "env" && p.data.u !== config.admin?.username) return null;
    return { username: p.data.u, name: p.data.n, role: p.data.r, source: p.data.s, token: p.data.t };
  } catch {
    return null;
  }
}

const LoginInput = z.object({ username: z.string().trim().min(1).max(64), password: z.string().min(1).max(256) });

export function adminRouter(deps: {
  config: AppConfig;
  api: XTravelClient;
  store: SettingsStore;
  onSettingsChange: () => void;
}): express.Router {
  const { config, api, store } = deps;
  const r = express.Router();
  const loginLimit = new RateLimiter(5, 15 * 60_000);
  const allowedOrigin = new URL(config.publicBaseUrl).origin;

  r.use((req, res, next) => {
    res.set("Cache-Control", "private, no-store");
    if (req.method !== "GET") {
      const origin = req.get("origin");
      if (origin && origin !== allowedOrigin) return next(new HttpError(403, "Yêu cầu không hợp lệ."));
      if (!req.is("application/json")) return next(new HttpError(415, "Yêu cầu phải gửi dạng JSON."));
    }
    next();
  });

  const requireAdmin: RequestHandler = (req, _res, next) => {
    if (!readAdmin(req, config)) return next(new HttpError(401, "Vui lòng đăng nhập quản trị."));
    next();
  };

  /** Đăng nhập qua xTravelOS; trả null nếu xTravelOS chưa có đầu API này (404) để thử lối dự phòng. */
  async function loginAtXTravel(username: string, password: string): Promise<AdminSession | null> {
    try {
      const result = await api.call("/staff/login", StaffLoginResult, { method: "POST", body: { username, password }, idempotencyKey: randomBytes(16).toString("hex") });
      if (!config.adminRoles.includes(result.staff.role)) {
        log.warn("đăng nhập quản trị: vai trò không được phép", { role: result.staff.role });
        throw new HttpError(403, "Tài khoản của bạn chưa được phân quyền sửa web. Nhờ quản trị xTravelOS cấp quyền.");
      }
      return { username, name: result.staff.name, role: result.staff.role, source: "xtravelos", token: result.sessionToken };
    } catch (err) {
      if (err instanceof UpstreamError && err.status === 404) return null;
      if (err instanceof UpstreamError && err.status === 401) throw new HttpError(401, "Sai tên đăng nhập hoặc mật khẩu.");
      throw err;
    }
  }

  function loginFallback(username: string, password: string): AdminSession | null {
    if (!config.admin || username !== config.admin.username || !verifyPassword(password, config.admin.passwordHash)) return null;
    return { username, name: username, role: "admin", source: "env", token: null };
  }

  r.post(
    "/login",
    ah(async (req, res) => {
      const wait = loginLimit.take(`ip:${req.ip}`);
      if (wait > 0) throw new HttpError(429, "Sai quá nhiều lần, vui lòng thử lại sau ít phút.", wait);
      const input = LoginInput.safeParse(req.body);
      if (!input.success) throw new HttpError(422, "Thiếu tên đăng nhập hoặc mật khẩu.");

      let session: AdminSession | null = null;
      let xtravelDown = false;
      try {
        session = await loginAtXTravel(input.data.username, input.data.password);
        if (session === null) {
          // xTravelOS chưa có /staff/login: dùng tài khoản dự phòng nếu có.
          session = loginFallback(input.data.username, input.data.password);
          if (!session && !config.admin) throw new HttpError(503, "xTravelOS chưa mở đăng nhập cho web và web chưa cấu hình tài khoản dự phòng.");
        }
      } catch (err) {
        if (!(err instanceof UpstreamUnavailable)) throw err;
        xtravelDown = true;
        session = loginFallback(input.data.username, input.data.password);
      }
      if (!session) {
        log.warn("đăng nhập quản trị thất bại", { ip: req.ip ?? "", xtravelDown });
        throw new HttpError(401, xtravelDown ? "xTravelOS đang tắt; chỉ tài khoản dự phòng đăng nhập được lúc này." : "Sai tên đăng nhập hoặc mật khẩu.");
      }
      const exp = Date.now() + SESSION_HOURS * 3600_000;
      const payload = JSON.stringify({ u: session.username, n: session.name, r: session.role, s: session.source, t: session.token, exp });
      res.cookie(ADMIN_COOKIE, payload, cookieOptions(config.cookieSecure));
      log.info("đăng nhập quản trị", { source: session.source, role: session.role });
      res.json({ ok: true, username: session.username, name: session.name, role: session.role, source: session.source });
    }),
  );

  r.post("/logout", (_req, res: Response) => {
    res.clearCookie(ADMIN_COOKIE, { ...cookieOptions(config.cookieSecure), maxAge: undefined });
    res.status(204).end();
  });

  r.get("/me", (req, res) => {
    const s = readAdmin(req, config);
    res.json({ username: s?.username ?? null, name: s?.name ?? null, role: s?.role ?? null, source: s?.source ?? null });
  });

  r.get(
    "/settings",
    requireAdmin,
    ah(async (_req, res) => {
      res.json(await store.get());
    }),
  );

  r.put(
    "/settings",
    requireAdmin,
    ah(async (req, res) => {
      const parsed = SiteSettings.safeParse(req.body);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        throw new HttpError(422, `Cấu hình chưa đúng ở ${first?.path.join(".") || "dữ liệu"}: ${first?.message ?? ""}`);
      }
      const who = readAdmin(req, config);
      try {
        const saved = await store.save(parsed.data, who?.token ?? null);
        deps.onSettingsChange();
        log.info("đã lưu cấu hình web", { by: who?.username ?? "", source: store.source });
        res.json(saved);
      } catch (err) {
        if (err instanceof UpstreamError && (err.status === 401 || err.status === 403)) {
          throw new HttpError(401, "Phiên xTravelOS đã hết hoặc không còn quyền, vui lòng đăng nhập lại.");
        }
        throw err;
      }
    }),
  );

  return r;
}
