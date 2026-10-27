import { describe, expect, it } from "vitest";
import { TtlCache } from "../../src/server/cache";
import { sign, verify } from "../../src/server/hmac";
import { redact } from "../../src/server/logger";
import { RateLimiter } from "../../src/server/rate-limit";
import { safeJson } from "../../src/server/seo";

describe("HMAC báo đổi nội dung", () => {
  const secret = "s".repeat(32);
  const body = Buffer.from('{"event":"product.updated","slug":"a"}');
  const now = 1_800_000_000;
  const ts = String(now);
  it("chữ ký đúng thì nhận", () => {
    expect(verify(secret, ts, sign(secret, ts, body), body, now)).toBe(true);
  });
  it("sai khóa, sửa thân, quá hạn thì từ chối", () => {
    expect(verify(secret, ts, sign("x".repeat(32), ts, body), body, now)).toBe(false);
    expect(verify(secret, ts, sign(secret, ts, body), Buffer.from("{}"), now)).toBe(false);
    expect(verify(secret, ts, sign(secret, ts, body), body, now + 301)).toBe(false);
    expect(verify(secret, undefined, undefined, body, now)).toBe(false);
  });
});

describe("bản tạm", () => {
  it("hết hạn và xóa theo nhãn", async () => {
    let t = 0;
    const c = new TtlCache(10, () => t);
    c.set("a", 1, 1000, ["product:x"]);
    c.set("b", 2, 1000, ["product:y"]);
    expect(c.purgeTag("product:x")).toBe(1);
    expect(c.get("a")).toBeUndefined();
    t = 1001;
    expect(c.get("b")).toBeUndefined();
  });
  it("gộp các lần gọi đồng thời cùng khóa", async () => {
    const c = new TtlCache();
    let calls = 0;
    const load = async () => ++calls;
    await Promise.all([c.wrap("k", 1000, [], load), c.wrap("k", 1000, [], load)]);
    expect(calls).toBe(1);
  });
});

describe("giới hạn lượt", () => {
  it("vượt giới hạn trả số giây chờ, sang cửa sổ mới thì cho lại", () => {
    let t = 0;
    const r = new RateLimiter(2, 60_000, () => t);
    expect(r.take("ip")).toBe(0);
    expect(r.take("ip")).toBe(0);
    expect(r.take("ip")).toBe(60);
    t = 60_000;
    expect(r.take("ip")).toBe(0);
  });
});

describe("nhật ký không chứa dữ liệu khách", () => {
  it("che số điện thoại, email, số giấy tờ", () => {
    expect(redact("gọi 0912345678 hoặc a.b@x.vn, CCCD 001091012345")).toBe("gọi [sđt] hoặc [email], CCCD [số]");
  });
});

describe("JSON nhúng vào trang", () => {
  it("không đóng được thẻ script", () => {
    expect(safeJson({ a: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });
});
