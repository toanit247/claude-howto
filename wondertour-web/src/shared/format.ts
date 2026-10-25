// Quy ước hiển thị chung với xTravelOS: tiền đủ số có dấu chấm nghìn, ngày dd/mm/yyyy theo giờ Việt Nam.

const VN_TZ = "Asia/Ho_Chi_Minh";
const NBSP = " ";

/** 12500000 → "12.500.000 đ". Không bao giờ rút gọn thành "tr", "k", "tỷ". */
export function formatMoney(amount: number): string {
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError(`Số tiền phải là số nguyên đồng: ${amount}`);
  }
  const sign = amount < 0 ? "-" : "";
  const digits = Math.abs(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${digits}${NBSP}đ`;
}

/** "2026-11-02" → "02/11/2026". Ngày lịch không đổi theo múi giờ. */
export function formatDate(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) throw new RangeError(`Ngày phải có dạng YYYY-MM-DD: ${isoDate}`);
  return `${m[3]}/${m[2]}/${m[1]}`;
}

const dateTimeParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: VN_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Thời điểm ISO 8601 → "14:05 02/11/2026" theo giờ Việt Nam. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new RangeError(`Thời điểm không hợp lệ: ${iso}`);
  const p = Object.fromEntries(dateTimeParts.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.hour}:${p.minute} ${p.day}/${p.month}/${p.year}`;
}

/** Thời điểm ISO 8601 → "02/11/2026" theo giờ Việt Nam. */
export function formatDateOfInstant(iso: string): string {
  return formatDateTime(iso).split(" ")[1] ?? "";
}

/** Số giây còn lại → "14:59". */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/** "2027-03" → "tháng 3/2027". */
export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  return `tháng ${Number(m)}/${y}`;
}

export function formatDuration(days: number, nights: number): string {
  return nights > 0 ? `${days} ngày ${nights} đêm` : `${days} ngày`;
}
