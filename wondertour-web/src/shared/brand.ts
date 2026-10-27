import { z } from "zod";

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

// Mọi thứ khác nhau giữa các doanh nghiệp nằm ở đây (tệp brand/*.json), không nằm trong mã.
export const BrandConfig = z.object({
  name: z.string().min(1),
  slogan: z.string(),
  description: z.string(),
  logo: z.string().startsWith("/"),
  colors: z.object({ primary: hex, accent: hex, soft: hex }),
  hero: z.object({ title: z.string(), subtitle: z.string() }),
  // Lưới dịch vụ ở trang chủ. icon là tên trong src/client/icons.tsx; href có thể là đường dẫn ngoài (simdulich.vn).
  services: z
    .array(z.object({ label: z.string().max(40), icon: z.string(), href: z.string() }))
    .max(12)
    .default([]),
  // Nơi khởi hành người xem chọn ở đầu trang.
  departureCities: z.array(z.string()).default([]),
  // Đoàn thật đã tổ chức, hiện ở trang chủ làm bằng chứng năng lực.
  proof: z.array(z.object({ client: z.string(), trip: z.string(), pax: z.int().positive() })).default([]),
  contact: z.object({
    address: z.string(),
    hotline: z.string().optional(),
    email: z.email().optional(),
    // Đường dẫn Zalo OA hoặc số Zalo (https://zalo.me/...), hiện ở nút liên hệ nổi.
    zalo: z.url().optional(),
    branches: z.array(z.string()).default([]),
  }),
});
export type BrandConfig = z.infer<typeof BrandConfig>;

export type SiteKind = "company" | "alliance";
