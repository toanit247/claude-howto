// Máy chủ web: giữ khóa, gọi xTravelOS, giới hạn theo IP, nén, dựng trang. Không có cơ sở dữ liệu nghiệp vụ.
import compression from "compression";
import cookieParser from "cookie-parser";
import express, { type ErrorRequestHandler, type RequestHandler } from "express";
import helmet from "helmet";
import { z } from "zod";
import { matchRoute, MEDIA_FORMATS, MEDIA_WIDTHS, type AppData, type PageData } from "../shared/routes";
import { WebhookEvent } from "../shared/schemas";
import { adminRouter, readAdmin } from "./admin";
import { ah, apiRouter, HttpError } from "./api-routes";
import { TtlCache } from "./cache";
import { Catalog } from "./catalog";
import type { AppConfig } from "./config";
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, verify } from "./hmac";
import { log } from "./logger";
import { loadPage } from "./pages";
import { htmlDocument, type Renderer } from "./render";
import { brandCss, buildHead, robotsTxt, sitemapXml } from "./seo";
import { readSession } from "./session";
import { SettingsStore } from "./settings-store";
import { featureOn, publicSettings, type FeatureKey } from "../shared/settings";
import { MAINTENANCE_DETAIL, UpstreamError, UpstreamUnavailable, XTravelClient } from "./xtravel";

export interface AppOptions {
  config: AppConfig;
  renderer: Renderer;
  /** Thư mục gói giao diện đã build (bản thật). */
  staticDir?: string;
  /** Middleware Vite (bản phát triển). */
  devMiddleware?: RequestHandler;
}

export function createApp({ config, renderer, staticDir, devMiddleware }: AppOptions) {
  const cache = new TtlCache();
  // Mất kết nối xTravelOS thì xóa sạch bản tạm: không bán bằng dữ liệu cũ.
  const api = new XTravelClient(config.xtravel, () => cache.clear());
  const catalog = new Catalog(api, cache);
  const settings = new SettingsStore(config.settingsSource, config.settingsFile, config.brand, api);
  const on = (k: FeatureKey) => featureOn(settings.peek(), k);
  const isProd = config.nodeEnv === "production";

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy);

  // Nhật ký: chỉ phương thức, đường dẫn (không chuỗi truy vấn), mã trả về, thời gian.
  app.use((req, res, next) => {
    const start = performance.now();
    res.on("finish", () => {
      if (req.path === "/healthz") return;
      log.info("http", { method: req.method, path: req.path, status: res.statusCode, ms: Math.round(performance.now() - start) });
    });
    next();
  });

  app.get("/healthz", (_req, res) => {
    res.set("Cache-Control", "no-store").json({ ok: true, upstream: api.isDown() ? "down" : "up" });
  });

  if (isProd) {
    app.use((req, res, next) => {
      if (req.secure) return next();
      res.redirect(301, `https://${req.hostname}${req.originalUrl}`);
    });
  }

  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            useDefaults: false,
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'"],
              imgSrc: ["'self'", "data:"],
              fontSrc: ["'self'"],
              connectSrc: ["'self'"],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              frameAncestors: ["'none'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
      strictTransportSecurity: isProd ? { maxAge: 63_072_000, includeSubDomains: true, preload: true } : false,
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    }),
  );
  app.use((_req, res, next) => {
    res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    if (config.appEnv === "staging" || config.siteKind === "alliance") res.set("X-Robots-Tag", "noindex, nofollow");
    next();
  });
  app.use(compression());

  // Đường dẫn cũ của web Laravel chuyển vĩnh viễn.
  app.use((req, res, next) => {
    const to = config.redirects.get(req.path);
    if (to && (req.method === "GET" || req.method === "HEAD")) return res.redirect(301, to);
    next();
  });

  // xTravelOS báo sản phẩm, giá, bài viết đổi: kiểm chữ ký HMAC rồi xóa bản tạm của trang đó.
  app.post("/hooks/xtravelos", express.raw({ type: "application/json", limit: "16kb" }), (req, res) => {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (!verify(config.webhookSecret, req.get(TIMESTAMP_HEADER), req.get(SIGNATURE_HEADER), raw)) {
      res.status(401).json({ detail: "Chữ ký không hợp lệ." });
      return;
    }
    let event: WebhookEvent;
    try {
      event = WebhookEvent.parse(JSON.parse(raw.toString("utf8")));
    } catch {
      res.status(422).json({ detail: "Sự kiện không hợp lệ." });
      return;
    }
    if (event.event === "site-settings.updated") {
      settings.invalidate();
      log.info("webhook", { event: event.event, slug: event.slug, purged: 0 });
      res.status(204).end();
      return;
    }
    if (event.event.startsWith("booking.")) {
      // Web không giữ đơn nên không có bản tạm nào để xóa; trạng thái đơn luôn đọc lại từ xTravelOS.
      log.info("webhook", { event: event.event, purged: 0 });
      res.status(204).end();
      return;
    }
    const tags = event.event.startsWith("article")
      ? [`article:${event.slug}`, "articles", "sitemap"]
      : event.event.startsWith("ticket")
        ? [`ticket:${event.slug}`, "tickets", "sitemap"]
      : event.event === "departures.updated"
        ? [`departures:${event.slug}`]
        : [`product:${event.slug}`, "products", "sitemap"];
    const purged = tags.reduce((n, t) => n + cache.purgeTag(t), 0);
    log.info("webhook", { event: event.event, slug: event.slug, purged });
    res.status(204).end();
  });

  if (staticDir) {
    app.use(
      "/assets",
      express.static(`${staticDir}/assets`, { immutable: true, maxAge: "1y", index: false, fallthrough: false }),
    );
    app.use(express.static(staticDir, { index: false, maxAge: "1d" }));
  }
  if (devMiddleware) app.use(devMiddleware);

  app.get("/brand.css", (_req, res) => {
    res.type("text/css").set("Cache-Control", "public, max-age=300").send(brandCss(config));
  });

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").set("Cache-Control", "public, max-age=3600").send(robotsTxt(config));
  });

  app.get(
    "/sitemap.xml",
    ah(async (_req, res) => {
      if (config.siteKind === "alliance") throw new HttpError(404, "Không có sitemap.");
      const entries = await catalog.sitemapEntries();
      res.type("application/xml").set("Cache-Control", "public, max-age=300").send(sitemapXml(config.publicBaseUrl, entries));
    }),
  );

  const MediaQuery = z.object({
    w: z.coerce.number().refine((w) => (MEDIA_WIDTHS as readonly number[]).includes(w)),
    f: z.enum(MEDIA_FORMATS),
  });
  app.get(
    "/media/:id",
    ah(async (req, res) => {
      const id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/).safeParse(req.params.id);
      const q = MediaQuery.safeParse(req.query);
      if (!id.success || !q.success) throw new HttpError(404, "Không tìm thấy ảnh.");
      const img = await api.media(id.data, q.data.w, q.data.f);
      if (!img) throw new HttpError(404, "Không tìm thấy ảnh.");
      res.set({ "Content-Type": img.type, "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" });
      img.body.on("error", () => res.destroy());
      img.body.pipe(res);
    }),
  );

  app.use(cookieParser(config.cookieSecret));
  app.use("/api/admin", express.json({ limit: "200kb" }), adminRouter({ config, api, store: settings, onSettingsChange: () => cache.purgeTag("sitemap") }));
  app.use(
    "/api",
    express.json({ limit: "100kb" }),
    apiRouter({
      config,
      api,
      catalog,
      cache,
      featureOn: on,
      chatDeps: { config, brand: config.brand, catalog, settings: () => settings.peek() },
    }),
  );

  const renderPage = async (url: string, status: number, page: PageData, path: string, priv: boolean) => {
    const data: AppData = { brand: config.brand, settings: publicSettings(settings.peek()), siteKind: config.siteKind, path, page };
    const [template, appHtml] = await Promise.all([renderer.template(url), renderer.render(data)]);
    return { status, html: htmlDocument(template, buildHead(data, config), appHtml, data), priv };
  };

  app.get(
    /.*/,
    ah(async (req, res) => {
      const route = matchRoute(req.path);
      const session = readSession(req);
      const isAlliance = config.siteKind === "alliance";

      // Cổng liên minh: mọi trang trừ đăng nhập và chính sách đều cần tài khoản.
      if (isAlliance && !session && route && !["agent-login", "privacy"].includes(route.name)) {
        res.redirect(302, `/dai-ly/dang-nhap?next=${encodeURIComponent(req.path)}`);
        return;
      }
      if (route?.name === "agent" && !session) {
        res.redirect(302, `/dai-ly/dang-nhap?next=/dai-ly`);
        return;
      }

      let out;
      if (api.isDown()) {
        out = await renderPage(req.originalUrl, 503, { page: "maintenance" }, req.path, false);
      } else if (!route || (!on("tickets") && (route.name === "tickets" || route.name === "ticket")) || (!on("groupTours") && route.name === "group")) {
        out = await renderPage(req.originalUrl, 404, { page: "not-found" }, req.path, false);
      } else {
        try {
          const { status, page } = await loadPage(route, new URLSearchParams(req.query as Record<string, string>), catalog, {
            // Trang quản trị luôn mở: đăng nhập bằng tài khoản xTravelOS; tài khoản dự phòng chỉ là thêm.
            adminConfigured: true,
          });
          const priv = isAlliance || ["agent", "agent-login", "lookup", "admin"].includes(route.name);
          out = await renderPage(req.originalUrl, status, page, req.path, priv);
        } catch (err) {
          if (!(err instanceof UpstreamUnavailable)) throw err;
          out = await renderPage(req.originalUrl, 503, { page: "maintenance" }, req.path, false);
        }
      }

      if (out.status === 503) res.set("Retry-After", "60");
      // Trang công khai không bao giờ chứa giá riêng; trang có phiên thì không cho lưu bản tạm dùng chung.
      res.set("Cache-Control", out.priv || out.status >= 500 ? "private, no-store" : "public, max-age=0, must-revalidate");
      res.status(out.status).type("html").send(out.html);
    }),
  );

  const onError: ErrorRequestHandler = (err: unknown, req, res, _next) => {
    void _next;
    let status = 500;
    let detail = "Có lỗi xảy ra, vui lòng thử lại.";
    if (err instanceof HttpError) {
      status = err.status;
      detail = err.detail;
      if (err.retryAfter) res.set("Retry-After", String(err.retryAfter));
    } else if (err instanceof UpstreamError) {
      status = err.status;
      detail = err.detail;
    } else if (err instanceof UpstreamUnavailable) {
      status = 503;
      detail = MAINTENANCE_DETAIL;
      res.set("Retry-After", "60");
    } else if (err instanceof SyntaxError || (err as { type?: string })?.type === "entity.parse.failed") {
      status = 400;
      detail = "Dữ liệu gửi lên không đọc được.";
    } else if ((err as { type?: string })?.type === "entity.too.large") {
      status = 413;
      detail = "Dữ liệu gửi lên quá lớn.";
    } else {
      log.error("lỗi không lường trước", { path: req.path, name: err instanceof Error ? err.name : "unknown" });
    }
    if (res.headersSent) return res.destroy();
    res.set("Cache-Control", "private, no-store").status(status).json({ detail });
  };
  app.use(onError);

  void readAdmin;
  // Với nguồn xTravelOS, tải cấu hình ngay khi khởi động (không chặn nếu xTravelOS chưa lên).
  if (config.settingsSource === "xtravelos") void settings.refresh();
  return { app, cache, api, settings };
}
