// Kiểm bộ câu hỏi thử ở chế độ cơ bản (không có khóa Claude). Mỗi câu khớp với dòng có "Tự động = có"
// trong ai/qa/cau-hoi-khach.md. Chế độ có khóa được anh chấm bằng tay theo cùng bộ câu hỏi.
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createMockXTravel } from "../../mock-xtravelos/server";
import { render } from "../../src/client/entry-server";
import { createApp } from "../../src/server/app";
import { loadConfig } from "../../src/server/config";

process.env.LOG_SILENT = "1";
const API_KEY = "test-service-key-0123456789abcdef";
const TEMPLATE = `<!doctype html><html><head><!--app-head--></head><body><div id="app"><!--app-html--></div><!--app-data--></body></html>`;

let mockServer: Server;
let mockUrl: string;
let app: ReturnType<typeof makeApp>;

beforeAll(async () => {
  const mock = createMockXTravel({ apiKey: API_KEY });
  mockServer = createServer(mock.app);
  await new Promise<void>((r) => mockServer.listen(0, "127.0.0.1", r));
  mockUrl = `http://127.0.0.1:${(mockServer.address() as AddressInfo).port}`;
  app = makeApp();
});
afterAll(() => new Promise<void>((r) => mockServer.close(() => r())));

function makeApp() {
  const config = loadConfig({
    NODE_ENV: "test",
    PUBLIC_BASE_URL: "https://web.test",
    XTRAVEL_API_URL: mockUrl,
    XTRAVEL_API_KEY: API_KEY,
    XTRAVEL_WEBHOOK_SECRET: "test-webhook-secret-0123456789abc",
    COOKIE_SECRET: "test-cookie-secret-0123456789",
    COOKIE_SECURE: "false",
    XTRAVEL_TIMEOUT_MS: "2000",
    SETTINGS_FILE: "test-results/chatbot-qa-settings.json",
  });
  return createApp({ config, renderer: { template: async () => TEMPLATE, render: async (d) => render(d) } }).app;
}

async function ask(text: string): Promise<string> {
  const res = await request(app).post("/api/chat").send({ messages: [{ role: "user", content: text }] }).expect(200);
  const events = res.text.trim().split("\n").map((l) => JSON.parse(l) as { type: string; text?: string });
  expect(events.at(-1)?.type).toBe("done");
  return events.filter((e) => e.type === "delta").map((e) => e.text).join("");
}

describe("bộ câu hỏi thử: chế độ cơ bản", () => {
  it("1. tour Nhật Bản cho 2 người: có link tour Nhật Bản", async () => {
    const t = await ask("Tour Nhật Bản tháng 12 cho 2 người");
    expect(t).toContain("/tour/nhat-ban-6n5d-tokyo-phu-si-osaka");
    expect(t).toMatch(/đ mỗi khách/);
  });

  it("2. gia đình 4 người: gợi ý tour, nêu nhóm gia đình có trẻ nhỏ", async () => {
    const t = await ask("Gia đình 4 người đi biển dịp Tết");
    expect(t).toContain("gia đình có trẻ nhỏ");
    expect(t).toContain("](/tour/");
  });

  it("3. công ty 120 người: dẫn sang tour đoàn và form, không bán tour lẻ", async () => {
    const t = await ask("Công ty em 120 người muốn teambuilding tháng 5");
    expect(t).toContain("/tour-doan");
    expect(t).toContain("/lien-he");
    expect(t).not.toContain("/tour/");
  });

  it("4. vé Bà Nà: nêu vé và link trang vé", async () => {
    const t = await ask("Có vé Bà Nà không");
    expect(t).toContain("/ve-tham-quan/ve-sun-world-ba-na-hills");
    expect(t).toContain("người lớn");
  });

  it("5. chào: chào lại và hỏi đi đâu", async () => {
    const t = await ask("Chào em");
    expect(t).toContain("muốn đi đâu");
  });

  it("6. Hàn Quốc tháng 11: gợi ý tour Hàn Quốc", async () => {
    const t = await ask("Đi Hàn Quốc tháng 11");
    expect(t).toContain("/tour/han-quoc-5n4d-seoul-nami");
  });

  it("7. dưới 5 triệu: chỉ gợi ý tour có giá dưới ngưỡng", async () => {
    const t = await ask("Có tour nào dưới 5 triệu không");
    expect(t).toContain("](/tour/");
    expect(t).not.toContain("Trung Quốc");
  });
});
