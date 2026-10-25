// Kiểm thử web nối với xTravelOS giả lập, theo bảng kiểm nghiệm thu trong tài liệu tiêu chuẩn.
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createMockXTravel } from "../../mock-xtravelos/server";
import { render } from "../../src/client/entry-server";
import { createApp } from "../../src/server/app";
import { loadConfig } from "../../src/server/config";
import { sign } from "../../src/server/hmac";

process.env.LOG_SILENT = "1";
const API_KEY = "test-service-key-0123456789abcdef";
const WEBHOOK = "test-webhook-secret-0123456789abc";
const TEMPLATE = `<!doctype html><html><head><!--app-head--></head><body><div id="app"><!--app-html--></div><!--app-data--></body></html>`;

let mockServer: Server;
let mockUrl: string;

function makeApp(apiUrl = mockUrl, extra: Record<string, string> = {}) {
  const config = loadConfig({
    NODE_ENV: "test",
    PUBLIC_BASE_URL: "https://web.test",
    XTRAVEL_API_URL: apiUrl,
    XTRAVEL_API_KEY: API_KEY,
    XTRAVEL_WEBHOOK_SECRET: WEBHOOK,
    COOKIE_SECRET: "test-cookie-secret-0123456789",
    COOKIE_SECURE: "false",
    XTRAVEL_TIMEOUT_MS: "2000",
    ...extra,
  });
  return createApp({ config, renderer: { template: async () => TEMPLATE, render: async (d) => render(d) } });
}

const SLUG = "ha-giang-4n3d-mua-tam-giac-mach";
let key = 0;
const idem = () => `test-key-${Date.now()}-${++key}-abcdef`;

beforeAll(async () => {
  const mock = createMockXTravel({ apiKey: API_KEY });
  mockServer = createServer(mock.app);
  await new Promise<void>((r) => mockServer.listen(0, "127.0.0.1", r));
  mockUrl = `http://127.0.0.1:${(mockServer.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((r) => mockServer.close(() => r())));

describe("trang công khai", () => {
  it("dựng phía máy chủ đủ nội dung, có schema.org và canonical", async () => {
    const { app } = makeApp(mockUrl, { APP_ENV: "production", COOKIE_SECURE: "true" });
    const res = await request(app).get(`/tour/${SLUG}`).expect(200);
    expect(res.text).toContain("Hà Giang 4 ngày 3 đêm");
    expect(res.text).toContain('"@type":"TouristTrip"');
    expect(res.text).toContain('"@type":"BreadcrumbList"');
    expect(res.text).toContain(`<link rel="canonical" href="https://web.test/tour/${SLUG}">`);
    expect(res.text).toContain("3.890.000 đ");
    expect(res.headers["cache-control"]).toBe("public, max-age=0, must-revalidate");
  });

  it("không chứa khóa dịch vụ, giá cost hay phần hưởng đại lý", async () => {
    const { app } = makeApp();
    for (const path of ["/", "/tour", `/tour/${SLUG}`, "/bai-viet/chuan-bi-visa-nhat-ban"]) {
      const res = await request(app).get(path).expect(200);
      expect(res.text).not.toContain(API_KEY);
      expect(res.text).not.toMatch(/costPerAdult|commissionPerAdult|"alliance":|"agent":\{/);
    }
  });

  it("có sitemap, robots, đường dẫn cũ chuyển 301, trang lạ 404", async () => {
    const { app } = makeApp();
    const sm = await request(app).get("/sitemap.xml").expect(200);
    expect(sm.text).toContain(`<loc>https://web.test/tour/${SLUG}</loc>`);
    expect(sm.text).toContain("<loc>https://web.test/diem-den/nhat-ban</loc>");
    // Web thử không cho Google đọc.
    const robots = await request(app).get("/robots.txt").expect(200);
    expect(robots.text).toBe("User-agent: *\nDisallow: /\n");
    await request(app).get("/tour-nhat-ban").expect(301).expect("location", "/diem-den/nhat-ban");
    await request(app).get("/khong-co-trang-nay").expect(404);
    await request(app).get("/tour/khong-co-tour").expect(404);
  });

  it("đặt các header bảo mật", async () => {
    const { app } = makeApp();
    const res = await request(app).get("/").expect(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("màu thương hiệu lấy từ cấu hình", async () => {
    const { app } = makeApp();
    const res = await request(app).get("/brand.css").expect(200);
    expect(res.text).toContain("--brand-primary:#05788C");
  });
});

describe("giữ chỗ và đặt chỗ", () => {
  async function departures(app: Parameters<typeof request>[0]) {
    const res = await request(app).get(`/api/products/${SLUG}/departures`).expect(200);
    expect(res.headers["cache-control"]).toBe("private, no-store");
    return res.body.items as { id: string; seatsAvailable: number }[];
  }

  it("hai người cùng giữ chỗ cuối: một người được, người kia nhận 409", async () => {
    const { app } = makeApp();
    const dep = (await departures(app))[0]!;
    expect(dep.seatsAvailable).toBe(3);
    const body = { departureId: dep.id, pax: { adult: 3, child: 0, infant: 0 } };
    const [a, b] = await Promise.all([
      request(app).post("/api/holds").set("Idempotency-Key", idem()).send(body),
      request(app).post("/api/holds").set("Idempotency-Key", idem()).send(body),
    ]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    const lost = a.status === 409 ? a : b;
    expect(lost.body.detail).toMatch(/hết chỗ|chỉ còn/);
    const won = a.status === 201 ? a : b;
    await request(app).post(`/api/holds/${won.body.holdId}/release`).set("Content-Type", "application/json").send({}).expect(204);
  });

  it("bấm đặt hai lần khi mạng chập chờn chỉ tạo một đơn, trả mã VietQR", async () => {
    const { app } = makeApp();
    const dep = (await departures(app))[1]!;
    const hold = await request(app)
      .post("/api/holds")
      .set("Idempotency-Key", idem())
      .send({ departureId: dep.id, pax: { adult: 1, child: 0, infant: 0 } })
      .expect(201);
    const k = idem();
    const booking = {
      holdId: hold.body.holdId,
      contact: { fullName: "Nguyễn Văn An", phone: "0912 345 678" },
      passengers: [{ fullName: "Nguyễn Văn An", type: "adult" }],
      consentPurpose: true,
      marketingOptIn: false,
    };
    const [a, b] = await Promise.all([
      request(app).post("/api/bookings").set("Idempotency-Key", k).send(booking),
      request(app).post("/api/bookings").set("Idempotency-Key", k).send(booking),
    ]);
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(a.body.code).toBe(b.body.code);
    expect(a.body.status).toBe("awaiting_payment");
    expect(a.body.payment.qrImage).toMatch(/^data:image\/png;base64,/);

    // Web không tự báo đã thanh toán: trạng thái chỉ đổi khi xTravelOS nhận tiền từ ngân hàng.
    const lookup = await request(app).post("/api/bookings/lookup").send({ code: a.body.code, phone: "0912345678" }).expect(200);
    expect(lookup.body.paidAmount).toBe(0);
    await fetch(`${mockUrl}/__mock/payments/${a.body.code}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: a.body.total }),
    });
    const paid = await request(app).post("/api/bookings/lookup").send({ code: a.body.code, phone: "0912345678" }).expect(200);
    expect(paid.body.status).toBe("paid");
    await request(app).post("/api/bookings/lookup").send({ code: a.body.code, phone: "0987654321" }).expect(404);
  });

  it("thiếu mã chống trùng, sai dữ liệu, gửi chéo trang đều bị chặn", async () => {
    const { app } = makeApp();
    await request(app).post("/api/holds").send({ departureId: "x", pax: { adult: 1, child: 0, infant: 0 } }).expect(422);
    await request(app).post("/api/leads").set("Idempotency-Key", idem()).send({ fullName: "A", phone: "123" }).expect(422);
    await request(app).post("/api/leads").set("Origin", "https://evil.example").set("Idempotency-Key", idem()).send({}).expect(403);
    await request(app).post("/api/leads").set("Content-Type", "text/plain").send("x").expect(415);
  });

  it("để lại liên hệ bị giới hạn theo số điện thoại", async () => {
    const { app } = makeApp();
    const lead = { fullName: "Trần Thị Bình", phone: "0901234567", consentPurpose: true, marketingOptIn: false };
    for (let i = 0; i < 3; i++) await request(app).post("/api/leads").set("Idempotency-Key", idem()).send(lead).expect(201);
    const res = await request(app).post("/api/leads").set("Idempotency-Key", idem()).send(lead).expect(429);
    expect(res.headers["retry-after"]).toBeDefined();
  });
});

describe("đại lý và liên minh", () => {
  it("đại lý thấy phần hưởng sau đăng nhập, đăng xuất thì hết; cookie HttpOnly", async () => {
    const { app } = makeApp();
    const agent = request.agent(app);
    const login = await agent.post("/api/agents/login").send({ username: "daily01", password: "matkhau123" }).expect(200);
    const cookies = ([] as string[]).concat(login.headers["set-cookie"] ?? []);
    expect(cookies.some((c) => c.startsWith("wt_session=") && /HttpOnly/i.test(c) && /SameSite=Lax/i.test(c))).toBe(true);
    expect(JSON.stringify(login.body)).not.toMatch(/sessionToken/);

    const priv = await agent.get(`/api/products/${SLUG}/departures`).expect(200);
    expect(priv.headers["cache-control"]).toBe("private, no-store");
    expect(priv.body.items[0].agent.commissionPerAdult).toBeGreaterThan(0);
    expect(priv.body.items[0].alliance).toBeUndefined();

    // Trang dựng phía máy chủ vẫn chỉ có dữ liệu công khai dù đang đăng nhập.
    const page = await agent.get(`/tour/${SLUG}`).expect(200);
    expect(page.text).not.toMatch(/commissionPerAdult/);

    const st = await agent.get("/api/agents/me/statement").expect(200);
    expect(st.body.agent.flow).toBe("agent");

    await agent.post("/api/agents/logout").send({}).expect(204);
    const after = await agent.get(`/api/products/${SLUG}/departures`).expect(200);
    expect(after.body.items[0].agent).toBeUndefined();
    await agent.get("/api/agents/me/statement").expect(401);
  });

  it("tài khoản liên minh không đăng nhập được web công ty", async () => {
    const { app } = makeApp();
    await request(app).post("/api/agents/login").send({ username: "lienminh01", password: "matkhau123" }).expect(403);
  });

  it("cổng liên minh: bắt đăng nhập, thấy giá cost, không cho Google đọc", async () => {
    const { app } = makeApp(mockUrl, { SITE_KIND: "alliance" });
    await request(app).get("/tour").expect(302).expect("location", "/dai-ly/dang-nhap?next=%2Ftour");
    await request(app).get(`/api/products/${SLUG}/departures`).expect(401);
    await request(app).get("/sitemap.xml").expect(404);
    const agent = request.agent(app);
    await agent.post("/api/agents/login").send({ username: "lienminh01", password: "matkhau123" }).expect(200);
    const page = await agent.get("/tour").expect(200);
    expect(page.headers["cache-control"]).toBe("private, no-store");
    expect(page.headers["x-robots-tag"]).toContain("noindex");
    const deps = await agent.get(`/api/products/${SLUG}/departures`).expect(200);
    expect(deps.body.items[0].alliance.costPerAdult).toBeGreaterThan(0);
  });
});

describe("báo đổi nội dung và bảo trì", () => {
  it("chữ ký đúng thì xóa bản tạm, sai thì 401", async () => {
    const { app, cache } = makeApp();
    await request(app).get(`/tour/${SLUG}`).expect(200);
    expect(cache.get(`product:${SLUG}`)).toBeDefined();
    const body = JSON.stringify({ event: "product.updated", slug: SLUG });
    const ts = String(Math.floor(Date.now() / 1000));
    await request(app).post("/hooks/xtravelos").set("Content-Type", "application/json").set("X-XTravel-Timestamp", ts).set("X-XTravel-Signature", "sha256=00").send(body).expect(401);
    await request(app)
      .post("/hooks/xtravelos")
      .set("Content-Type", "application/json")
      .set("X-XTravel-Timestamp", ts)
      .set("X-XTravel-Signature", sign(WEBHOOK, ts, body))
      .send(body)
      .expect(204);
    expect(cache.get(`product:${SLUG}`)).toBeUndefined();
  });

  it("tắt xTravelOS thì web báo bảo trì 503, không bán bằng dữ liệu cũ", async () => {
    const { app } = makeApp("http://127.0.0.1:9");
    const page = await request(app).get(`/tour/${SLUG}`).expect(503);
    expect(page.text).toContain("đang bảo trì");
    expect(page.headers["retry-after"]).toBe("60");
    const api = await request(app).post("/api/holds").set("Idempotency-Key", idem()).send({ departureId: "x", pax: { adult: 1, child: 0, infant: 0 } });
    expect(api.status).toBe(503);
    expect(api.body.detail).toMatch(/bảo trì/);
  });
});

describe("cấu hình", () => {
  it("web thử không được trỏ vào xTravelOS thật", () => {
    expect(() => makeApp("https://api.xtravelos.vn", { XTRAVEL_PRODUCTION_API_HOST: "api.xtravelos.vn" })).toThrow(/không được trỏ/);
  });
  it("lỗi cấu hình không in giá trị khóa", () => {
    try {
      loadConfig({ PUBLIC_BASE_URL: "https://a.b", XTRAVEL_API_URL: "https://x.y", XTRAVEL_API_KEY: "short-secret", XTRAVEL_WEBHOOK_SECRET: "x", COOKIE_SECRET: "y" });
      expect.unreachable();
    } catch (e) {
      expect(String(e)).not.toContain("short-secret");
    }
  });
});
