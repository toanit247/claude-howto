import { describe, expect, it } from "vitest";
import { formatCountdown, formatDate, formatDateTime, formatMoney } from "../../src/shared/format";

describe("định dạng tiền", () => {
  it("đủ số, dấu chấm nghìn, không rút gọn", () => {
    expect(formatMoney(900_000_000)).toBe("900.000.000 đ");
    expect(formatMoney(12_500_000)).toBe("12.500.000 đ");
    expect(formatMoney(0)).toBe("0 đ");
    expect(formatMoney(-5000)).toBe("-5.000 đ");
  });
  it("từ chối số thập phân", () => {
    expect(() => formatMoney(1.5)).toThrow(RangeError);
  });
});

describe("định dạng ngày", () => {
  it("YYYY-MM-DD thành dd/mm/yyyy", () => {
    expect(formatDate("2026-11-02")).toBe("02/11/2026");
  });
  it("thời điểm theo giờ Việt Nam", () => {
    expect(formatDateTime("2026-11-01T18:30:00Z")).toBe("01:30 02/11/2026");
    expect(formatDateTime("2026-11-02T08:05:00+07:00")).toBe("08:05 02/11/2026");
  });
  it("đếm ngược", () => {
    expect(formatCountdown(899)).toBe("14:59");
    expect(formatCountdown(-3)).toBe("00:00");
  });
});
