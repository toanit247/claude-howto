import type { BrandConfig, SiteKind } from "./brand";
import type {
  ArticleDetail,
  ArticleSummary,
  DestinationRef,
  ProductDetail,
  ProductFilter,
  ProductList,
  ProductSummary,
} from "./schemas";

export type RouteName =
  | "home"
  | "tours"
  | "product"
  | "destination"
  | "articles"
  | "article"
  | "lookup"
  | "contact"
  | "agent-login"
  | "agent"
  | "privacy";

const TABLE: { name: RouteName; pattern: RegExp }[] = [
  { name: "home", pattern: /^\/$/ },
  { name: "tours", pattern: /^\/tour\/?$/ },
  { name: "product", pattern: /^\/tour\/([a-z0-9-]+)\/?$/ },
  { name: "destination", pattern: /^\/diem-den\/([a-z0-9-]+)\/?$/ },
  { name: "articles", pattern: /^\/bai-viet\/?$/ },
  { name: "article", pattern: /^\/bai-viet\/([a-z0-9-]+)\/?$/ },
  { name: "lookup", pattern: /^\/tra-cuu\/?$/ },
  { name: "contact", pattern: /^\/lien-he\/?$/ },
  { name: "agent-login", pattern: /^\/dai-ly\/dang-nhap\/?$/ },
  { name: "agent", pattern: /^\/dai-ly\/?$/ },
  { name: "privacy", pattern: /^\/chinh-sach-quyen-rieng-tu\/?$/ },
];

export function matchRoute(pathname: string): { name: RouteName; slug: string | null } | null {
  for (const r of TABLE) {
    const m = r.pattern.exec(pathname);
    if (m) return { name: r.name, slug: m[1] ?? null };
  }
  return null;
}

/** Trang dựng phía máy chủ chỉ chứa dữ liệu công khai; giá riêng tải sau trên trình duyệt. */
export type PageData =
  | {
      page: "home";
      products: ProductSummary[];
      deals: ProductSummary[];
      articles: ArticleSummary[];
      facets: ProductList["facets"];
      months: string[];
    }
  | { page: "tours"; filter: ProductFilter; list: ProductList; months: string[] }
  | { page: "destination"; destination: DestinationRef; list: ProductList }
  | { page: "product"; product: ProductDetail; related: ProductSummary[] }
  | { page: "articles"; list: { items: ArticleSummary[]; page: number; pageSize: number; total: number } }
  | { page: "article"; article: ArticleDetail }
  | { page: "lookup" }
  | { page: "contact"; productSlug: string | null; need: string | null }
  | { page: "agent-login"; next: string | null }
  | { page: "agent" }
  | { page: "privacy" }
  | { page: "not-found" }
  | { page: "maintenance" };

export interface AppData {
  brand: BrandConfig;
  siteKind: SiteKind;
  path: string;
  page: PageData;
}

/** Ngân sách trong ô tìm kiếm: "min-max" (đồng), max để trống nghĩa là không giới hạn. */
export const BUDGETS: { value: string; min: number; max: number | null }[] = [
  { value: "0-5000000", min: 0, max: 5_000_000 },
  { value: "5000000-10000000", min: 5_000_000, max: 10_000_000 },
  { value: "10000000-20000000", min: 10_000_000, max: 20_000_000 },
  { value: "20000000-", min: 20_000_000, max: null },
];

export const paths = {
  product: (slug: string) => `/tour/${slug}`,
  article: (slug: string) => `/bai-viet/${slug}`,
  destination: (slug: string) => `/diem-den/${slug}`,
};

/** Ảnh luôn đi qua máy chủ web (/media/:id), không gọi thẳng xTravelOS từ trình duyệt. */
export const MEDIA_WIDTHS = [320, 480, 768, 1024, 1440] as const;
export const MEDIA_FORMATS = ["avif", "webp"] as const;
export function mediaUrl(id: string, width: number, format: (typeof MEDIA_FORMATS)[number]): string {
  return `/media/${encodeURIComponent(id)}?w=${width}&f=${format}`;
}
