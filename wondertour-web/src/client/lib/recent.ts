// "Tour đã xem": chỉ lưu đường dẫn tour trong trình duyệt của chính người xem, không gửi đi đâu.
const KEY = "wt_recent_tours";
const MAX = 6;

export interface RecentTour {
  slug: string;
  name: string;
}

export function readRecent(): RecentTour[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((x): x is RecentTour => typeof x?.slug === "string" && typeof x?.name === "string")
      .slice(0, MAX);
  } catch {
    return [];
  }
}

export function pushRecent(t: RecentTour): void {
  try {
    const next = [t, ...readRecent().filter((x) => x.slug !== t.slug)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Trình duyệt chặn lưu trữ: bỏ qua, tính năng này chỉ để tiện.
  }
}
