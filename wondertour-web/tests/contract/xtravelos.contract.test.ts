// Kiểm thử hợp đồng: gọi thẳng máy thử xTravelOS, kiểm từng đầu API đúng tài liệu và schema của web.
// Chỉ chạy khi có biến môi trường, và chỉ được trỏ vào máy THỬ:
//   XTRAVEL_CONTRACT_URL=https://<máy thử xtravelos> XTRAVEL_CONTRACT_KEY=<khóa dịch vụ thử> npm run test:contract
// Có giữ chỗ rồi nhả ngay; đặt XTRAVEL_CONTRACT_BOOKING=1 nếu muốn thử cả tạo đơn (tạo đơn thật trên máy thử).
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { z } from "zod";
import * as S from "../../src/shared/schemas";

const BASE = process.env.XTRAVEL_CONTRACT_URL?.replace(/\/+$/, "");
const KEY = process.env.XTRAVEL_CONTRACT_KEY;
const run = Boolean(BASE && KEY);

async function call(path: string, init: { method?: string; body?: unknown; key?: string; headers?: Record<string, string> } = {}) {
  const res = await fetch(`${BASE}/public/v1${path}`, {
    method: init.method ?? "GET",
    headers: {
      authorization: `Bearer ${KEY}`,
      accept: "application/json",
      ...(init.body !== undefined ? { "content-type": "application/json" } : {}),
      ...(init.key ? { "idempotency-key": init.key } : {}),
      ...init.headers,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json, headers: res.headers };
}

function expectSchema<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const r = schema.safeParse(data);
  if (!r.success) throw new Error(`Sai hợp đồng: ${r.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  return r.data;
}

describe.runIf(run)("hợp đồng xTravelOS /public/v1", () => {
  let product: S.ProductSummary;
  let departure: S.Departure;

  it("từ chối khi thiếu hoặc sai khóa dịch vụ (401)", async () => {
    const r = await fetch(`${BASE}/public/v1/products`);
    expect(r.status).toBe(401);
    const r2 = await call("/products", { headers: { authorization: "Bearer sai-khoa" } });
    expect(r2.status).toBe(401);
  });

  it("GET /products đúng schema, có lọc theo điểm đến", async () => {
    const r = await call("/products?page=1&pageSize=20");
    expect(r.status).toBe(200);
    const list = expectSchema(S.ProductList, r.json);
    expect(list.items.length).toBeGreaterThan(0);
    product = list.items.find((p) => p.nextDepartures.some((d) => d.seatsAvailable > 0)) ?? list.items[0]!;
    const dest = product.destinations[0];
    if (dest) {
      const f = expectSchema(S.ProductList, (await call(`/products?destination=${dest.slug}`)).json);
      expect(f.items.every((p) => p.destinations.some((d) => d.slug === dest.slug))).toBe(true);
    }
  });

  it("GET /products/{slug} đúng schema; slug lạ trả 404 kèm detail", async () => {
    const r = await call(`/products/${product.slug}`);
    expect(r.status).toBe(200);
    expectSchema(S.ProductDetail, r.json);
    const nf = await call("/products/khong-co-tour-nay-xyz");
    expect(nf.status).toBe(404);
    expectSchema(S.ApiErrorBody, nf.json);
  });

  it("GET /products/{slug}/departures đúng schema, khách lẻ không thấy giá cost hay phần hưởng", async () => {
    const r = await call(`/products/${product.slug}/departures`);
    expect(r.status).toBe(200);
    const deps = expectSchema(S.DepartureList, r.json);
    for (const d of deps.items) {
      expect(d.agent).toBeUndefined();
      expect(d.alliance).toBeUndefined();
    }
    const open = deps.items.find((d) => d.seatsAvailable >= 1 && d.status !== "closed");
    expect(open, "cần ít nhất một ngày khởi hành còn chỗ trên máy thử").toBeDefined();
    departure = open!;
  });

  it("POST /holds: cùng Idempotency-Key gửi hai lần cùng lúc chỉ tạo một giữ chỗ; nhả được", async () => {
    const key = randomUUID();
    const body = { departureId: departure.id, pax: { adult: 1, child: 0, infant: 0 } };
    const [a, b] = await Promise.all([call("/holds", { method: "POST", body, key }), call("/holds", { method: "POST", body, key })]);
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    const ha = expectSchema(S.Hold, a.json);
    const hb = expectSchema(S.Hold, b.json);
    expect(hb.holdId).toBe(ha.holdId);
    expect(Date.parse(ha.expiresAt)).toBeGreaterThan(Date.now());

    if (process.env.XTRAVEL_CONTRACT_BOOKING === "1") {
      const bk = randomUUID();
      const booking = {
        holdId: ha.holdId,
        contact: { fullName: "Kiểm Thử Hợp Đồng", phone: "0900000000" },
        passengers: [{ fullName: "Kiểm Thử Hợp Đồng", type: "adult", idNumber: "B0000000" }],
        consentPurpose: true,
        marketingOptIn: false,
      };
      const [x, y] = await Promise.all([
        call("/bookings", { method: "POST", body: booking, key: bk }),
        call("/bookings", { method: "POST", body: booking, key: bk }),
      ]);
      expect(x.status).toBe(201);
      const bx = expectSchema(S.Booking, x.json);
      expect(expectSchema(S.Booking, y.json).code).toBe(bx.code);
      expect(bx.paidAmount).toBe(0);
      const look = await call(`/bookings/${bx.code}`, { headers: { "x-lookup-phone": "0900000000" } });
      expect(look.status).toBe(200);
      const wrong = await call(`/bookings/${bx.code}`, { headers: { "x-lookup-phone": "0911111111" } });
      expect(wrong.status).toBe(404);
    } else {
      const rel = await call(`/holds/${ha.holdId}/release`, { method: "POST", body: {}, key: randomUUID() });
      expect(rel.status).toBe(204);
    }
  });

  it("POST /holds quá số chỗ còn trả 409 kèm detail tiếng Việt", async () => {
    const r = await call("/holds", { method: "POST", body: { departureId: departure.id, pax: { adult: 50, child: 50, infant: 0 } }, key: randomUUID() });
    expect([409, 422]).toContain(r.status);
    expectSchema(S.ApiErrorBody, r.json);
  });

  it("GET /articles và /articles/{slug} đúng schema", async () => {
    const list = expectSchema(S.ArticleList, (await call("/articles?page=1&pageSize=5")).json);
    if (list.items[0]) {
      const r = await call(`/articles/${list.items[0].slug}`);
      expect(r.status).toBe(200);
      expectSchema(S.ArticleDetail, r.json);
    }
  });

  it("GET /media/{id} trả ảnh", async () => {
    const id = product.coverImage?.id;
    if (!id) return;
    const r = await fetch(`${BASE}/public/v1/media/${id}?w=480&format=webp`, { headers: { authorization: `Bearer ${KEY}` } });
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type") ?? "").toMatch(/^image\//);
  });

  it("POST /leads nhận liên hệ, thiếu Idempotency-Key thì 422", async () => {
    const lead = { fullName: "Kiểm Thử Hợp Đồng", phone: "0900000000", consentPurpose: true, marketingOptIn: false };
    expect((await call("/leads", { method: "POST", body: lead, key: randomUUID() })).status).toBe(201);
    expect((await call("/leads", { method: "POST", body: lead })).status).toBe(422);
  });

  it("GET /openapi.json có mặt", async () => {
    const r = await fetch(`${BASE}/openapi.json`);
    expect(r.status).toBe(200);
  });
});

describe.skipIf(run)("hợp đồng xTravelOS", () => {
  it.skip("bỏ qua: chưa đặt XTRAVEL_CONTRACT_URL và XTRAVEL_CONTRACT_KEY", () => {});
});
