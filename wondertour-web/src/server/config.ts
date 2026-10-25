import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { BrandConfig, type SiteKind } from "../shared/brand";

const secret = z.string().min(16, "phải dài ít nhất 16 ký tự");

const Env = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_ENV: z.enum(["staging", "production"]).default("staging"),
  PORT: z.coerce.number().int().positive().default(3000),
  PUBLIC_BASE_URL: z.url().transform((u) => u.replace(/\/+$/, "")),
  SITE_KIND: z.enum(["company", "alliance"]).default("company"),
  BRAND_CONFIG: z.string().default("brand/wondertour.json"),
  REDIRECTS_FILE: z.string().default("redirects.json"),
  XTRAVEL_API_URL: z.url().transform((u) => u.replace(/\/+$/, "")),
  XTRAVEL_API_KEY: secret,
  XTRAVEL_WEBHOOK_SECRET: secret,
  XTRAVEL_PRODUCTION_API_HOST: z.string().optional(),
  XTRAVEL_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  COOKIE_SECRET: secret,
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  TRUST_PROXY: z.coerce.number().int().nonnegative().default(1),
  // Tài khoản quản trị web (trang /quan-tri). Băm mật khẩu: node scripts/hash-password.mjs
  ADMIN_USERNAME: z.string().trim().min(3).max(64).optional(),
  ADMIN_PASSWORD_HASH: z.string().regex(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/).optional(),
  // Cấu hình web cất ở đâu: "xtravelos" (GET/PUT /public/v1/site-settings) hoặc "file" (tệp JSON, Railway cần Volume)
  SETTINGS_SOURCE: z.enum(["file", "xtravelos"]).default("file"),
  SETTINGS_FILE: z.string().default("data/site-settings.json"),
  // Vai trò xTravelOS được vào trang quản trị web, viết đúng như trong xTravelOS, cách nhau bằng dấu phẩy
  ADMIN_ROLES: z.string().default("Quản trị,Quản lý,CEO,Marketing"),
  // Trợ lý AI: có ANTHROPIC_API_KEY thì gọi Claude; không có thì chạy chế độ gợi ý cơ bản.
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default("claude-opus-5-5"),
});

export interface AppConfig {
  nodeEnv: "development" | "production" | "test";
  appEnv: "staging" | "production";
  port: number;
  publicBaseUrl: string;
  siteKind: SiteKind;
  brand: BrandConfig;
  redirects: Map<string, string>;
  xtravel: { baseUrl: string; apiKey: string; timeoutMs: number };
  webhookSecret: string;
  cookieSecret: string;
  cookieSecure: boolean;
  trustProxy: number;
  admin: { username: string; passwordHash: string } | null;
  adminRoles: string[];
  settingsSource: "file" | "xtravelos";
  settingsFile: string;
  ai: { apiKey: string | null; model: string; skillFile: string };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env, root = process.cwd()): AppConfig {
  // Biến để trống trong .env (ví dụ ADMIN_USERNAME=) coi như chưa đặt, không phải chuỗi rỗng.
  const cleaned = Object.fromEntries(Object.entries(env).filter(([, v]) => v !== undefined && v !== ""));
  const parsed = Env.safeParse(cleaned);
  if (!parsed.success) {
    // Chỉ in tên biến sai, không in giá trị (có thể là khóa bí mật).
    const fields = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Cấu hình môi trường không hợp lệ — ${fields}`);
  }
  const e = parsed.data;

  const apiHost = new URL(e.XTRAVEL_API_URL).host;
  if (e.APP_ENV === "staging" && e.XTRAVEL_PRODUCTION_API_HOST && apiHost === e.XTRAVEL_PRODUCTION_API_HOST) {
    throw new Error("Web thử (APP_ENV=staging) không được trỏ vào xTravelOS thật.");
  }
  if (e.APP_ENV === "production" && !e.COOKIE_SECURE) {
    throw new Error("Web thật bắt buộc COOKIE_SECURE=true.");
  }

  const brand = BrandConfig.parse(JSON.parse(readFileSync(resolve(root, e.BRAND_CONFIG), "utf8")));
  const rawRedirects = JSON.parse(readFileSync(resolve(root, e.REDIRECTS_FILE), "utf8")) as unknown;
  const redirects = new Map(
    Object.entries(z.record(z.string(), z.string()).parse(rawRedirects)).filter(
      ([from, to]) => !from.startsWith("_") && from.startsWith("/") && to.startsWith("/"),
    ),
  );

  return {
    nodeEnv: e.NODE_ENV,
    appEnv: e.APP_ENV,
    port: e.PORT,
    publicBaseUrl: e.PUBLIC_BASE_URL,
    siteKind: e.SITE_KIND,
    brand,
    redirects,
    xtravel: { baseUrl: e.XTRAVEL_API_URL, apiKey: e.XTRAVEL_API_KEY, timeoutMs: e.XTRAVEL_TIMEOUT_MS },
    webhookSecret: e.XTRAVEL_WEBHOOK_SECRET,
    cookieSecret: e.COOKIE_SECRET,
    cookieSecure: e.COOKIE_SECURE,
    trustProxy: e.TRUST_PROXY,
    admin: e.ADMIN_USERNAME && e.ADMIN_PASSWORD_HASH ? { username: e.ADMIN_USERNAME, passwordHash: e.ADMIN_PASSWORD_HASH } : null,
    adminRoles: e.ADMIN_ROLES.split(",").map((r) => r.trim().toLowerCase()).filter(Boolean),
    settingsSource: e.SETTINGS_SOURCE,
    settingsFile: resolve(root, e.SETTINGS_FILE),
    ai: { apiKey: e.ANTHROPIC_API_KEY ?? null, model: e.AI_MODEL, skillFile: resolve(root, "ai/skills/tu-van-tour/SKILL.md") },
  };
}
