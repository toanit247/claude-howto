// Cấu hình web do quản trị viên bật tắt trong trang /quan-tri. Không phải dữ liệu nghiệp vụ:
// sản phẩm, giá, đơn vẫn chỉ ở xTravelOS. Lưu thành một tệp JSON trên máy chủ web.
import { z } from "zod";

const label = z.string().trim().min(1).max(40);
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

/** Các khối trên trang có thể ẩn hiện. */
export const FEATURE_KEYS = [
  "sentenceSearch",
  "serviceGrid",
  "deals",
  "departureBoard",
  "destinations",
  "proof",
  "articles",
  "recentTours",
  "tickets",
  "groupTours",
  "chatbot",
  "cityPicker",
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const FEATURE_LABEL: Record<FeatureKey, string> = {
  sentenceSearch: "Câu tìm tour ở đầu trang chủ",
  serviceGrid: "Lưới dịch vụ (tour trong nước, nước ngoài, tour đoàn, vé tham quan…)",
  deals: "Mục Ưu đãi hôm nay",
  departureBoard: "Bảng Sắp khởi hành",
  destinations: "Dải Khám phá điểm đến",
  proof: "Mục Đoàn doanh nghiệp đã đi cùng",
  articles: "Mục Cẩm nang ở trang chủ",
  recentTours: "Tour bạn đã xem (lưu trong trình duyệt khách)",
  tickets: "Vé tham quan khu vui chơi",
  groupTours: "Trang Tour đoàn (doanh nghiệp, MICE, teambuilding, học sinh)",
  chatbot: "Trợ lý AI tư vấn tour",
  cityPicker: "Chọn nơi khởi hành ở đầu trang",
};

export const ServiceItem = z.object({
  label,
  icon: z.string().max(32),
  href: z.string().max(300),
  enabled: z.boolean().default(true),
});
export type ServiceItem = z.infer<typeof ServiceItem>;

/** Lựa chọn trong trang Tour đoàn. */
export const GroupOption = z.object({
  key: z.string().regex(/^[a-z0-9-]{2,32}$/),
  label,
  description: z.string().max(200),
  icon: z.string().max(32),
  // Tour có sẵn thì dẫn tới /tour?category=…; cần báo giá riêng thì dẫn tới /lien-he?nhu-cau=…
  href: z.string().max(300),
  enabled: z.boolean().default(true),
});
export type GroupOption = z.infer<typeof GroupOption>;

export const ChatbotSettings = z.object({
  name: label.default("Wonder"),
  greeting: z.string().max(300).default("Xin chào anh/chị! Em là trợ lý tư vấn của WonderTour. Anh/chị muốn đi đâu, khi nào, cùng ai? Em gợi ý theo lịch khởi hành và chỗ còn thật."),
  suggestions: z.array(z.string().max(80)).max(6).default([
    "Tour Nhật Bản tháng 12 cho 2 người",
    "Gia đình 4 người đi biển dịp Tết",
    "Teambuilding 120 người gần Hà Nội",
    "Tour nào còn chỗ cuối tuần này?",
  ]),
  // Giọng nói thêm cho tổ máy: ví dụ "xưng mình, gọi khách là bạn"
  toneNote: z.string().max(500).default(""),
});

export const SiteSettings = z.object({
  version: z.literal(1).default(1),
  features: z.partialRecord(z.enum(FEATURE_KEYS), z.boolean()).default({}),
  services: z.array(ServiceItem).max(12).default([]),
  groupOptions: z.array(GroupOption).max(8).default([]),
  contact: z.object({
    hotline: z.string().max(30).optional(),
    email: z.email().optional(),
    zalo: z.url().optional(),
  }).prefault({}),
  colors: z.object({ primary: hex, accent: hex, soft: hex }).partial().prefault({}),
  chatbot: ChatbotSettings.prefault({}),
  updatedAt: z.iso.datetime({ offset: true }).optional(),
});
export type SiteSettings = z.infer<typeof SiteSettings>;

/** Giá trị khi quản trị viên chưa sửa gì. Mọi khối bật, dịch vụ theo brand, tour đoàn có 5 lựa chọn. */
export function defaultSettings(services: ServiceItem[]): SiteSettings {
  return SiteSettings.parse({
    features: Object.fromEntries(FEATURE_KEYS.map((k) => [k, true])),
    services,
    groupOptions: [
      { key: "doanh-nghiep", label: "Đoàn doanh nghiệp", description: "Du lịch công ty, nghỉ mát, tri ân nhân viên", icon: "case", href: "/tour?category=doanh-nghiep" },
      { key: "mice", label: "Hội nghị, hội thảo, MICE", description: "Hội nghị khách hàng, incentive, khảo sát thị trường", icon: "building", href: "/lien-he?nhu-cau=Hội nghị, MICE" },
      { key: "teambuilding", label: "Teambuilding, gala dinner", description: "Trò chơi tập thể, gala có MC, âm thanh ánh sáng", icon: "confetti", href: "/lien-he?nhu-cau=Teambuilding, gala dinner" },
      { key: "hoc-sinh", label: "Học sinh, sinh viên", description: "Dã ngoại, trải nghiệm, bảo hiểm và quy trình kiểm soát đoàn", icon: "cap", href: "/lien-he?nhu-cau=Tour học sinh, sinh viên" },
      { key: "gia-dinh", label: "Gia đình, nhóm bạn riêng", description: "Lịch trình thiết kế riêng, xe riêng, hướng dẫn viên riêng", icon: "users", href: "/lien-he?nhu-cau=Tour thiết kế riêng cho gia đình, nhóm bạn" },
    ],
  });
}

/** Phần cấu hình trang công khai được thấy (không có gì bí mật, nhưng tách riêng để rõ ràng). */
export type PublicSettings = Pick<SiteSettings, "features" | "services" | "groupOptions" | "contact" | "chatbot">;
export function publicSettings(s: SiteSettings): PublicSettings {
  return { features: s.features, services: s.services, groupOptions: s.groupOptions, contact: s.contact, chatbot: s.chatbot };
}

export function featureOn(s: Pick<SiteSettings, "features">, key: FeatureKey): boolean {
  return s.features[key] ?? true;
}
