// Kiểu chuyến đi trong nước (biển, núi, thành phố) gắn theo tên điểm đến, để khách chọn "đi biển" hay "đi núi"
// rồi mới chọn tỉnh. Đây là cách phân loại để hiển thị và lọc; điểm đến không khớp tên nào thì không thuộc kiểu nào.
export const TRIP_KINDS = ["bien", "nui", "thanh-pho"] as const;
export type TripKind = (typeof TRIP_KINDS)[number];

export const TRIP_KIND_LABEL: Record<TripKind, string> = {
  bien: "biển",
  nui: "núi và cao nguyên",
  "thanh-pho": "thành phố",
};

// Tên đã bỏ dấu, viết thường (xem fold).
const KIND_PLACES: Record<TripKind, string[]> = {
  bien: ["phu quoc", "nha trang", "da nang", "ha long", "cat ba", "vung tau", "con dao", "quy nhon", "mui ne", "phan thiet", "hoi an"],
  nui: ["sapa", "sa pa", "ha giang", "da lat", "tay bac", "dien bien", "lai chau", "moc chau", "tam dao", "bach ma", "lao cai", "kon tum", "mai chau"],
  "thanh-pho": ["ha noi", "sai gon", "ho chi minh", "hue", "can tho", "hai phong"],
};

export function isTripKind(value: string): value is TripKind {
  return (TRIP_KINDS as readonly string[]).includes(value);
}

function fold(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d").toLowerCase();
}

/** Kiểu chuyến đi của một điểm đến theo tên; không khớp thì null. */
export function tripKindOf(name: string): TripKind | null {
  const n = fold(name);
  for (const kind of TRIP_KINDS) {
    if (KIND_PLACES[kind].some((p) => n.includes(p))) return kind;
  }
  return null;
}
