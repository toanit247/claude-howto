// Các đầu /api mà trình duyệt gọi. Máy chủ web kiểm dữ liệu, gắn khóa dịch vụ rồi chuyển về xTravelOS.
// Web không tự tính giá, không tự trừ chỗ, không lưu thông tin khách.
import { randomUUID } from "node:crypto";
import express, { type NextFunction, type Request, type RequestHandler, type Response } from "express";
import { z } from "zod";
import {
  AgentLoginInput,
  AgentLoginResult,
  AgentStatement,
  Booking,
  BookingInput,
  Hold,
  HoldInput,
  LeadInput,
  LookupInput,
} from "../shared/schemas";
import type { Catalog } from "./catalog";
import type { TtlCache } from "./cache";
import type { AppConfig } from "./config";
import { RateLimiter } from "./rate-limit";
import { clearSession, readSession, writeSession } from "./session";
import { UpstreamError, type XTravelClient } from "./xtravel";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
    readonly retryAfter?: number,
  ) {
    super(detail);
  }
}

export const ah =
  (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch(next);
  };

function parse<S extends z.ZodType>(schema: S, data: unknown): z.infer<S> {
  const r = schema.safeParse(data);
  if (!r.success) {
    const first = r.error.issues[0];
    const msg = first && !first.message.startsWith("Invalid") ? first.message : "Thông tin gửi lên chưa đúng.";
    throw new HttpError(422, msg);
  }
  return r.data;
}

const SLUG = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const HOLD_ID = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);
const IDEMPOTENCY = /^[A-Za-z0-9-]{16,128}$/;
function idempotencyKey(req: Request): string {
  const key = req.get("idempotency-key");
  if (!key || !IDEMPOTENCY.test(key)) throw new HttpError(422, "Thiếu mã chống gửi trùng, vui lòng tải lại trang.");
  return key;
}

function limit(limiter: RateLimiter, key: string): void {
  const wait = limiter.take(key);
  if (wait > 0) throw new HttpError(429, "Bạn thao tác quá nhiều lần, vui lòng thử lại sau ít phút.", wait);
}

export function apiRouter(deps: {
  config: AppConfig;
  api: XTravelClient;
  catalog: Catalog;
  cache: TtlCache;
}): express.Router {
  const { config, api, catalog, cache } = deps;
  const r = express.Router();
  const allowedOrigin = new URL(config.publicBaseUrl).origin;

  const limits = {
    hold: new RateLimiter(10, 10 * 60_000),
    booking: new RateLimiter(10, 10 * 60_000),
    leadIp: new RateLimiter(5, 10 * 60_000),
    leadPhone: new RateLimiter(3, 60 * 60_000),
    lookup: new RateLimiter(30, 10 * 60_000),
    login: new RateLimiter(10, 10 * 60_000),
  };

  // Dữ liệu /api có thể chứa giá riêng: không bao giờ lưu bản tạm dùng chung.
  r.use((req, res, next) => {
    res.set("Cache-Control", "private, no-store");
    if (req.method === "POST") {
      // Chống gửi chéo trang (CSRF): chỉ nhận JSON, và nếu có Origin thì phải là tên miền của mình.
      const origin = req.get("origin");
      if (origin && origin !== allowedOrigin) return next(new HttpError(403, "Yêu cầu không hợp lệ."));
      if (!req.is("application/json")) return next(new HttpError(415, "Yêu cầu phải gửi dạng JSON."));
    }
    next();
  });

  const requireSessionOnAlliance: RequestHandler = (req, _res, next) => {
    if (config.siteKind === "alliance" && !readSession(req)) {
      return next(new HttpError(401, "Vui lòng đăng nhập cổng liên minh."));
    }
    next();
  };

  r.get(
    "/session",
    ah(async (req, res) => {
      res.json({ agent: readSession(req)?.profile ?? null });
    }),
  );

  r.get(
    "/products/:slug/departures",
    requireSessionOnAlliance,
    ah(async (req, res) => {
      const slug = parse(SLUG, req.params.slug);
      res.json(await catalog.departures(slug, readSession(req)?.token));
    }),
  );

  r.post(
    "/holds",
    requireSessionOnAlliance,
    ah(async (req, res) => {
      limit(limits.hold, `ip:${req.ip}`);
      const key = idempotencyKey(req);
      const input = parse(HoldInput, req.body);
      const hold = await api.call("/holds", Hold, {
        method: "POST",
        body: input,
        session: readSession(req)?.token,
        idempotencyKey: key,
      });
      cache.purgeTag("departures");
      res.status(201).json(hold);
    }),
  );

  r.post(
    "/holds/:id/release",
    ah(async (req, res) => {
      const id = parse(HOLD_ID, req.params.id);
      await api.callNoContent(`/holds/${id}/release`, {
        method: "POST",
        body: {},
        session: readSession(req)?.token,
        idempotencyKey: req.get("idempotency-key") ?? randomUUID(),
      });
      cache.purgeTag("departures");
      res.status(204).end();
    }),
  );

  r.post(
    "/bookings",
    requireSessionOnAlliance,
    ah(async (req, res) => {
      limit(limits.booking, `ip:${req.ip}`);
      const key = idempotencyKey(req);
      const input = parse(BookingInput, req.body);
      const booking = await api.call("/bookings", Booking, {
        method: "POST",
        body: input,
        session: readSession(req)?.token,
        idempotencyKey: key,
      });
      cache.purgeTag("departures");
      res.status(201).json(booking);
    }),
  );

  r.post(
    "/bookings/lookup",
    ah(async (req, res) => {
      limit(limits.lookup, `ip:${req.ip}`);
      const { code, phone } = parse(LookupInput, req.body);
      // Số điện thoại đi trong header, không nằm trong đường dẫn để khỏi lọt vào nhật ký truy cập.
      const booking = await api.call(`/bookings/${encodeURIComponent(code)}`, Booking, {
        headers: { "x-lookup-phone": phone },
        session: readSession(req)?.token,
      });
      res.json(booking);
    }),
  );

  r.post(
    "/leads",
    ah(async (req, res) => {
      limit(limits.leadIp, `ip:${req.ip}`);
      const key = idempotencyKey(req);
      const input = parse(LeadInput, req.body);
      limit(limits.leadPhone, `phone:${input.phone}`);
      await api.callNoContent("/leads", { method: "POST", body: input, idempotencyKey: key });
      res.status(201).json({ ok: true });
    }),
  );

  r.post(
    "/agents/login",
    ah(async (req, res) => {
      limit(limits.login, `ip:${req.ip}`);
      const input = parse(AgentLoginInput, req.body);
      const result = await api.call("/agents/login", AgentLoginResult, {
        method: "POST",
        body: input,
        idempotencyKey: randomUUID(),
      });
      const expectedFlow = config.siteKind === "alliance" ? "alliance" : "agent";
      if (result.agent.flow !== expectedFlow) {
        throw new HttpError(
          403,
          expectedFlow === "alliance"
            ? "Tài khoản này là tài khoản đại lý, vui lòng đăng nhập ở web công ty."
            : "Tài khoản này thuộc cổng liên minh, vui lòng đăng nhập ở cổng liên minh.",
        );
      }
      writeSession(res, config.cookieSecure, result.sessionToken, result.agent, result.expiresAt);
      res.json({ agent: result.agent });
    }),
  );

  r.post(
    "/agents/logout",
    ah(async (_req, res) => {
      clearSession(res, config.cookieSecure);
      res.status(204).end();
    }),
  );

  r.get(
    "/agents/me/statement",
    ah(async (req, res) => {
      const session = readSession(req);
      if (!session) throw new HttpError(401, "Vui lòng đăng nhập.");
      try {
        res.json(await api.call("/agents/me/statement", AgentStatement, { session: session.token }));
      } catch (err) {
        if (err instanceof UpstreamError && err.status === 401) clearSession(res, config.cookieSecure);
        throw err;
      }
    }),
  );

  r.use((_req, _res, next: NextFunction) => next(new HttpError(404, "Không tìm thấy đầu API.")));
  return r;
}
