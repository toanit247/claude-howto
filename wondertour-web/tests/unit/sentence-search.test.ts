import { describe, expect, it } from "vitest";
import { tripKindOf } from "../../src/shared/geo";
import { isMonthOfYear, monthOfYear, monthOfYearLabel, monthsOfYear, salesMonthsFor, upcomingMonths } from "../../src/shared/months";

describe("kiểu chuyến đi theo tên điểm đến", () => {
  it("phân loại biển, núi, thành phố kể cả khi gõ không dấu", () => {
    expect(tripKindOf("Phú Quốc")).toBe("bien");
    expect(tripKindOf("Côn Đảo")).toBe("bien");
    expect(tripKindOf("Sa Pa")).toBe("nui");
    expect(tripKindOf("Đà Lạt")).toBe("nui");
    expect(tripKindOf("Hà Nội")).toBe("thanh-pho");
    expect(tripKindOf("Hue")).toBe("thanh-pho");
  });

  it("điểm đến không khớp thì không thuộc kiểu nào", () => {
    expect(tripKindOf("Nhật Bản")).toBeNull();
    expect(tripKindOf("Hàn Quốc")).toBeNull();
  });
});

describe("tháng trong năm", () => {
  it("bỏ năm khi hiển thị và khi đọc đường dẫn cũ", () => {
    expect(monthOfYear("2027-03")).toBe("3");
    expect(monthOfYear("11")).toBe("11");
    expect(monthOfYearLabel("3")).toBe("tháng 3");
    expect(isMonthOfYear("12")).toBe(true);
    expect(isMonthOfYear("13")).toBe(false);
    expect(isMonthOfYear("2027-03")).toBe(false);
  });

  it("mỗi tháng trong năm chỉ hiện một lần dù tầm bán dài hai năm", () => {
    const months = upcomingMonths(new Date("2026-10-25T03:00:00Z"));
    expect(months).toHaveLength(24);
    expect(monthsOfYear(months)).toHaveLength(12);
    expect(monthsOfYear(months)[0]).toBe("10");
  });

  it("một tháng trong năm khớp cả năm nay lẫn năm sau trong tầm bán", () => {
    expect(salesMonthsFor("11", new Date("2026-10-25T03:00:00Z"))).toEqual(["2026-11", "2027-11"]);
  });
});
