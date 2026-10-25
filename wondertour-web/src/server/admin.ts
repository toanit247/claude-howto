// Tài khoản quản trị web: một tài khoản đặt trong biến môi trường (ADMIN_USERNAME, ADMIN_PASSWORD_HASH).
// Mật khẩu băm bằng scrypt; tạo bằng `node scripts/hash-password.mjs`. Phiên là cookie ký, HttpOnly, 8 giờ.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import express, { type CookieOptions, type Request, type RequestHandler, type Response } from "express";
import { z } from "zod";
import { SiteSettings } from "../shared/settings";
import { ah, HttpError } from "./api-routes";
import type { AppConfig } from "./config";
import { log } from "./logger";
import { RateLimiter } from "./rate-limit";
import type { SettingsStore } from "./settings-store";

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

/** Phiên quản trị hợp lệ: cookie ký đúng, chưa hết hạn, đúng tên đăng nhập đang cấu hình. */
export function readAdmin(req: Request, config: AppConfig): string | null {
  const raw: unknown = req.signedCookies?.[ADMIN_COOKIE];
  if (typeof raw !== "string" || !config.admin) return null;
  const [user, exp] = raw.split("|");
  if (!user || !exp || Number(exp) < Date.now() || user !== config.admin.username) return null;
  return user;
}

const LoginInput = z.object({ username: z.string().trim().min(1).max(64), password: z.string().min(1).max(256) });

export function adminRouter(deps: { config: AppConfig; store: SettingsStore; onSettingsChange: () => void }): express.Router {
  const { config, store } = deps;
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

  r.post(
    "/login",
    ah(async (req, res) => {
      if (!config.admin) throw new HttpError(503, "Web chưa cấu hình tài khoản quản trị (ADMIN_USERNAME, ADMIN_PASSWORD_HASH).");
      const wait = loginLimit.take(`ip:${req.ip}`);
      if (wait > 0) throw new HttpError(429, "Sai quá nhiều lần, vui lòng thử lại sau ít phút.", wait);
      const input = LoginInput.safeParse(req.body);
      const ok = input.success && input.data.username === config.admin.username && verifyPassword(input.data.password, config.admin.passwordHash);
      if (!ok) {
        log.warn("đăng nhập quản trị thất bại", { ip: req.ip ?? "" });
        throw new HttpError(401, "Sai tên đăng nhập hoặc mật khẩu.");
      }
      res.cookie(ADMIN_COOKIE, `${config.admin.username}|${Date.now() + SESSION_HOURS * 3600_000}`, cookieOptions(config.cookieSecure));
      res.json({ ok: true, username: config.admin.username });
    }),
  );

  r.post("/logout", (_req, res: Response) => {
    res.clearCookie(ADMIN_COOKIE, { ...cookieOptions(config.cookieSecure), maxAge: undefined });
    res.status(204).end();
  });

  r.get("/me", (req, res) => {
    res.json({ username: readAdmin(req, config) });
  });

  r.get("/settings", requireAdmin, (_req, res) => {
    res.json(store.get());
  });

  r.put(
    "/settings",
    requireAdmin,
    ah(async (req, res) => {
      const parsed = SiteSettings.safeParse(req.body);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        throw new HttpError(422, `Cấu hình chưa đúng ở ${first?.path.join(".") || "dữ liệu"}: ${first?.message ?? ""}`);
      }
      const saved = store.save(parsed.data);
      deps.onSettingsChange();
      log.info("đã lưu cấu hình web", { by: readAdmin(req, config) ?? "" });
      res.json(saved);
    }),
  );

  return r;
}
