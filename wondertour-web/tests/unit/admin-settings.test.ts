import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../../src/server/admin";
import { SettingsStore } from "../../src/server/settings-store";
import { BrandConfig } from "../../src/shared/brand";
import { defaultSettings, featureOn, SiteSettings } from "../../src/shared/settings";
import { detectIntent } from "../../src/server/chat";

process.env.LOG_SILENT = "1";
const dir = mkdtempSync(join(tmpdir(), "wt-settings-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("mật khẩu quản trị", () => {
  it("băm scrypt, đúng thì nhận, sai thì từ chối", () => {
    const h = hashPassword("mat-khau-rat-dai-123");
    expect(h).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    expect(verifyPassword("mat-khau-rat-dai-123", h)).toBe(true);
    expect(verifyPassword("mat-khau-rat-dai-124", h)).toBe(false);
    expect(verifyPassword("x", "khong-phai-hash")).toBe(false);
  });
});

describe("cấu hình web", () => {
  const brand = BrandConfig.parse(JSON.parse(readFileSync("brand/wondertour.json", "utf8")));
  it("mặc định bật mọi khối, dịch vụ theo thương hiệu, có 5 lựa chọn tour đoàn", () => {
    const s = defaultSettings(brand.services.map((x) => ({ ...x, enabled: true })));
    expect(featureOn(s, "chatbot")).toBe(true);
    expect(s.services.map((x) => x.label)).toContain("Tour đoàn");
    expect(s.groupOptions).toHaveLength(5);
    expect(s.chatbot.greeting).toContain("WonderTour");
  });
  it("lưu rồi đọc lại; khối mới chưa có trong tệp cũ thì bật", () => {
    const file = join(dir, "a", "site.json");
    const store = new SettingsStore(file, brand);
    const saved = store.save({ ...store.get(), features: { tickets: false } });
    expect(saved.updatedAt).toBeDefined();
    const again = new SettingsStore(file, brand);
    expect(featureOn(again.get(), "tickets")).toBe(false);
    expect(featureOn(again.get(), "chatbot")).toBe(true);
  });
  it("tệp hỏng thì về mặc định, không ném lỗi", () => {
    const file = join(dir, "b.json");
    writeFileSync(file, "{khong phai json");
    expect(featureOn(new SettingsStore(file, brand).get(), "deals")).toBe(true);
    expect(() => SiteSettings.parse({ services: [{ label: "", icon: "x", href: "/" }] })).toThrow();
  });
});

describe("trợ lý: nhận ý khách ở chế độ cơ bản", () => {
  const dests = [{ slug: "nhat-ban", name: "Nhật Bản" }, { slug: "phu-quoc", name: "Phú Quốc" }];
  it("bắt điểm đến, đi cùng ai, tháng, ngân sách, vé", () => {
    const i = detectIntent("Gia đình 4 người muốn đi Phú Quốc tháng 7, tầm 8 triệu", dests);
    expect(i.destination).toBe("phu-quoc");
    expect(i.party).toBe("family");
    expect(i.month).toMatch(/-07$/);
    expect(i.maxPrice).toBe(8_000_000);
    expect(detectIntent("Công ty em 120 người teambuilding", dests).party).toBe("company");
    expect(detectIntent("mua vé Sun World Bà Nà", dests).wantsTickets).toBe(true);
    expect(detectIntent("Nhat Ban cho 2 nguoi", dests).destination).toBe("nhat-ban");
  });
});
