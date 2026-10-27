// Tháng khởi hành cho ô chọn và bộ lọc. Khách nghĩ theo "tháng 11", không theo năm: một tháng trong năm khớp
// tour đi tháng đó của mọi năm trong tầm bán, nên nhãn không ghi năm. Tháng YYYY-MM chỉ còn dùng với xTravelOS.

/** Tầm bán tính bằng tháng: tour đi xa hơn một năm vẫn được tìm thấy theo tháng trong năm. */
export const SALES_HORIZON_MONTHS = 24;

/** Các tháng YYYY-MM từ tháng hiện tại (giờ Việt Nam) trong tầm bán. */
export function upcomingMonths(now = new Date(), count = SALES_HORIZON_MONTHS): string[] {
  const vn = new Date(now.getTime() + 7 * 3600_000);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth() + i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

/** Tháng trong năm dạng "1" đến "12". Nhận cả "2027-03" và trả về "3". */
export function monthOfYear(value: string): string {
  return String(Number(value.length > 2 ? value.slice(5) : value));
}

export function isMonthOfYear(value: string): boolean {
  return /^(1[0-2]|[1-9])$/.test(value);
}

/** "3" → "tháng 3". Không có năm. */
export function monthOfYearLabel(mm: string): string {
  return `tháng ${Number(mm)}`;
}

/** Mỗi tháng trong năm đúng một lần, theo thứ tự từ tháng gần nhất. */
export function monthsOfYear(months: string[]): string[] {
  return [...new Set(months.map(monthOfYear))];
}

/** Các tháng YYYY-MM trong tầm bán khớp một tháng trong năm. */
export function salesMonthsFor(mm: string, now = new Date()): string[] {
  return upcomingMonths(now).filter((ym) => monthOfYear(ym) === monthOfYear(mm));
}
