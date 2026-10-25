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
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env, root = process.cwd()): AppConfig {
  const parsed = Env.safeParse(env);
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
  };
}
