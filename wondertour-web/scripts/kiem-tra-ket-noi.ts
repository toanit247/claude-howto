// Kiểm tra kết nối giữa web và một máy xTravelOS theo docs/giao-thuc-ket-noi.md.
// Chạy trên máy thử hoặc máy thật, chỉ đọc (trừ bước thử webhook, nó chỉ gửi sự kiện "site-settings.updated"):
//   XTRAVEL_URL=https://<máy xTravelOS> XTRAVEL_KEY=<khóa dịch vụ> \
//   WEB_URL=https://<web> WEBHOOK_SECRET=<khóa ký> npm run kiem-tra-ket-noi
// Thiếu WEB_URL hoặc WEBHOOK_SECRET thì bỏ qua phần webhook. Thoát mã 1 nếu có mục không đạt.
import { createHmac } from "node:crypto";
import type { z } from "zod";
import * as S from "../src/shared/schemas";

const base = process.env.XTRAVEL_URL?.replace(/\/+$/, "");
const key = process.env.XTRAVEL_KEY;
const webUrl = process.env.WEB_URL?.replace(/\/+$/, "");
const secret = process.env.WEBHOOK_SECRET;

if (!base || !key) {
  console.error("Thiếu XTRAVEL_URL hoặc XTRAVEL_KEY.");
  process.exit(2);
}

interface Result {
  name: string;
  ok: boolean;
  note: string;
}
const results: Result[] = [];

function record(name: string, ok: boolean, note = "") {
  results.push({ name, ok, note });
  console.log(`${ok ? "ĐẠT " : "LỖI "} ${name}${note ? `: ${note}` : ""}`);
}

async function get(path: string, auth = true) {
  const res = await fetch(`${base}/public/v1${path}`, {
    headers: { accept: "application/json", ...(auth ? { authorization: `Bearer ${key}` } : {}) },
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

function check<T extends z.ZodType>(name: string, status: number, body: { status: number; json: unknown }, schema: T, want = 200) {
  if (body.status !== want) return record(name, false, `HTTP ${body.status}, cần ${want}`);
  const parsed = schema.safeParse(body.json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return record(name, false, `sai schema tại ${first?.path.join(".") || "gốc"}: ${first?.message ?? ""}`);
  }
  record(name, true, status ? `HTTP ${status}` : "");
  return parsed.data;
}

async function main() {
  console.log(`Kiểm tra ${base}/public/v1\n`);

  const noAuth = await get("/products", false);
  record("từ chối khi thiếu khóa (401)", noAuth.status === 401, `HTTP ${noAuth.status}`);

  const list = await get("/products?page=1&pageSize=20");
  const products = check("GET /products đúng schema", list.status, list, S.ProductList);
  if (!products) return finish();

  const first = products.items[0];
  if (first) {
    check("GET /products/{slug} đúng schema", 200, await get(`/products/${first.slug}`), S.ProductDetail);
    const deps = await get(`/products/${first.slug}/departures`);
    const parsedDeps = check("GET /products/{slug}/departures đúng schema", deps.status, deps, S.DepartureList);
    if (parsedDeps) {
      const leaked = parsedDeps.items.some((d) => d.agent !== undefined || d.alliance !== undefined);
      record("khách lẻ không thấy phần đại lý, liên minh", !leaked);
    }
  } else {
    record("có ít nhất một tour để kiểm tra chi tiết", false, "danh sách tour đang trống");
  }

  const missing = await get("/products/khong-co-tour-nay-xyz");
  record("slug lạ trả 404 kèm detail", missing.status === 404 && S.ApiErrorBody.safeParse(missing.json).success, `HTTP ${missing.status}`);

  check("GET /articles đúng schema", 200, await get("/articles?page=1&pageSize=5"), S.ArticleList);
  check("GET /tickets đúng schema", 200, await get("/tickets?page=1&pageSize=5"), S.TicketList);

  // ERP trả /public/v1/openapi.json; máy mô phỏng trong repo trả ở gốc. Chấp nhận cả hai, không cần khóa.
  const openapi = await get("/openapi.json", false);
  const openapiAtRoot = openapi.status === 200 ? 200 : (await fetch(`${base}/openapi.json`)).status;
  const openapiOk = openapi.status === 200 || openapiAtRoot === 200;
  record("GET openapi.json có mặt (không cần khóa)", openapiOk, `/public/v1: HTTP ${openapi.status}, gốc: HTTP ${openapiAtRoot}`);

  if (webUrl && secret) await checkWebhook(webUrl, secret);
  else console.log("\nBỏ qua webhook: thiếu WEB_URL hoặc WEBHOOK_SECRET.");

  finish();
}

/** Ký đúng như docs/giao-thuc-ket-noi.md mục 5 và gửi tới web. */
async function checkWebhook(url: string, secretKey: string) {
  const body = JSON.stringify({ event: "site-settings.updated", slug: "web" });
  const sign = (ts: string) => "sha256=" + createHmac("sha256", secretKey).update(`${ts}.`).update(body).digest("hex");
  const ts = String(Math.floor(Date.now() / 1000));
  const post = (headers: Record<string, string>) =>
    fetch(`${url}/hooks/xtravelos`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body });

  const good = await post({ "x-xtravel-timestamp": ts, "x-xtravel-signature": sign(ts) });
  record("webhook có chữ ký đúng được nhận (204)", good.status === 204, `HTTP ${good.status}`);

  const bad = await post({ "x-xtravel-timestamp": ts, "x-xtravel-signature": "sha256=" + "0".repeat(64) });
  record("webhook sai chữ ký bị từ chối (401)", bad.status === 401, `HTTP ${bad.status}`);

  const stale = String(Math.floor(Date.now() / 1000) - 3600);
  const old = await post({ "x-xtravel-timestamp": stale, "x-xtravel-signature": sign(stale) });
  record("webhook quá 300 giây bị từ chối (401)", old.status === 401, `HTTP ${old.status}`);
}

function finish() {
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} mục đạt.`);
  process.exit(failed ? 1 : 0);
}

main().catch((err: unknown) => {
  console.error("Lỗi không kiểm tra được:", err instanceof Error ? err.message : err);
  process.exit(2);
});
