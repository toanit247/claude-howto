// Đọc sản phẩm, lịch khởi hành, bài viết từ xTravelOS qua bản tạm có hạn.
import {
  ArticleDetail,
  ArticleList,
  DepartureList,
  ProductDetail,
  ProductList,
  TicketDetail,
  TicketList,
  type ProductFilter,
} from "../shared/schemas";
import type { TtlCache } from "./cache";
import type { XTravelClient } from "./xtravel";

/** Nội dung: tối đa 60 giây (xTravelOS báo đổi thì xóa ngay). Chỗ còn: hỏi lại sau 15 giây. */
export const CONTENT_TTL_MS = 60_000;
export const SEATS_TTL_MS = 15_000;

export class Catalog {
  constructor(
    private readonly api: XTravelClient,
    private readonly cache: TtlCache,
  ) {}

  listProducts(f: Partial<ProductFilter> & { pageSize?: number }) {
    const query = {
      q: f.q,
      destination: f.destination,
      season: f.season,
      month: f.month,
      from: f.from,
      category: f.category,
      party: f.party,
      promo: f.promo,
      sort: f.sort,
      minPrice: f.minPrice,
      maxPrice: f.maxPrice,
      page: f.page ?? 1,
      pageSize: f.pageSize ?? 12,
    };
    const key = `products:${JSON.stringify(query)}`;
    return this.cache.wrap(key, CONTENT_TTL_MS, ["products"], () =>
      this.api.call("/products", ProductList, { query }),
    );
  }

  getProduct(slug: string) {
    return this.cache.wrap(`product:${slug}`, CONTENT_TTL_MS, [`product:${slug}`], () =>
      this.api.call(`/products/${slug}`, ProductDetail),
    );
  }

  /** Giá theo luồng của người xem: có phiên đại lý/liên minh thì không bao giờ dùng bản tạm chung. */
  departures(slug: string, session: string | undefined) {
    const load = () => this.api.call(`/products/${slug}/departures`, DepartureList, { session });
    if (session) return load();
    return this.cache.wrap(`departures:${slug}`, SEATS_TTL_MS, ["departures", `departures:${slug}`, `product:${slug}`], load);
  }

  listTickets(page = 1, pageSize = 24, destination?: string) {
    return this.cache.wrap(`tickets:${page}:${pageSize}:${destination ?? ""}`, CONTENT_TTL_MS, ["tickets"], () =>
      this.api.call("/tickets", TicketList, { query: { page, pageSize, destination } }),
    );
  }

  getTicket(slug: string) {
    return this.cache.wrap(`ticket:${slug}`, CONTENT_TTL_MS, [`ticket:${slug}`, "tickets"], () =>
      this.api.call(`/tickets/${slug}`, TicketDetail),
    );
  }

  listArticles(page = 1, pageSize = 12) {
    return this.cache.wrap(`articles:${page}:${pageSize}`, CONTENT_TTL_MS, ["articles"], () =>
      this.api.call("/articles", ArticleList, { query: { page, pageSize } }),
    );
  }

  getArticle(slug: string) {
    return this.cache.wrap(`article:${slug}`, CONTENT_TTL_MS, [`article:${slug}`], () =>
      this.api.call(`/articles/${slug}`, ArticleDetail),
    );
  }

  /** Toàn bộ đường dẫn cho sitemap.xml. */
  async sitemapEntries(): Promise<{ path: string; lastmod: string | null }[]> {
    return this.cache.wrap("sitemap", CONTENT_TTL_MS, ["sitemap", "products", "articles"], async () => {
      const out: { path: string; lastmod: string | null }[] = [];
      const destinations = new Set<string>();
      for (let page = 1; page <= 50; page++) {
        const list = await this.listProducts({ page, pageSize: 100 });
        for (const p of list.items) {
          out.push({ path: `/tour/${p.slug}`, lastmod: null });
          for (const d of p.destinations) destinations.add(d.slug);
        }
        if (page * list.pageSize >= list.total) break;
      }
      for (const d of destinations) out.push({ path: `/diem-den/${d}`, lastmod: null });
      const tickets = await this.listTickets(1, 100);
      for (const t of tickets.items) out.push({ path: `/ve-tham-quan/${t.slug}`, lastmod: null });
      for (let page = 1; page <= 50; page++) {
        const list = await this.listArticles(page, 100);
        for (const a of list.items) out.push({ path: `/bai-viet/${a.slug}`, lastmod: a.publishedAt.slice(0, 10) });
        if (page * list.pageSize >= list.total) break;
      }
      return out;
    });
  }
}
