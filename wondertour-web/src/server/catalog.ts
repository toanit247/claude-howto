// Đọc sản phẩm, lịch khởi hành, bài viết từ xTravelOS qua bản tạm có hạn.
import { tripKindOf } from "../shared/geo";
import { isMonthOfYear, salesMonthsFor } from "../shared/months";
import {
  ArticleDetail,
  ArticleList,
  DepartureList,
  ProductDetail,
  ProductList,
  TicketDetail,
  TicketList,
  type ProductFilter,
  type ProductSummary,
} from "../shared/schemas";
import type { TtlCache } from "./cache";
import type { XTravelClient } from "./xtravel";

/** Nội dung: tối đa 60 giây (xTravelOS báo đổi thì xóa ngay). Chỗ còn: hỏi lại sau 15 giây. */
export const CONTENT_TTL_MS = 60_000;
export const SEATS_TTL_MS = 15_000;
/** Lọc theo tháng trong năm hay kiểu chuyến đi: lấy tối đa 10 trang x 100 tour của mỗi tháng khớp rồi gộp. */
const LOCAL_FILTER_PAGE_SIZE = 100;
const LOCAL_FILTER_MAX_PAGES = 10;

export class Catalog {
  constructor(
    private readonly api: XTravelClient,
    private readonly cache: TtlCache,
  ) {}

  listProducts(f: Partial<ProductFilter> & { pageSize?: number }) {
    if (f.kind || (f.month && isMonthOfYear(f.month))) return this.listLocallyFiltered(f);
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

  /**
   * Tháng trong năm và kiểu chuyến đi không có tham số tương ứng trên xTravelOS: gọi từng tháng YYYY-MM khớp
   * trong tầm bán, gộp, lọc theo tên điểm đến rồi cắt trang tại đây. Thứ tự: theo ngày khởi hành gần nhất khi
   * gộp nhiều tháng; một tháng thì giữ thứ tự của xTravelOS.
   */
  private listLocallyFiltered(f: Partial<ProductFilter> & { pageSize?: number }) {
    const page = f.page ?? 1;
    const pageSize = f.pageSize ?? 12;
    const key = `products-local:${JSON.stringify({ ...f, page, pageSize })}`;
    return this.cache.wrap(key, CONTENT_TTL_MS, ["products"], async () => {
      const months: (string | undefined)[] = f.month && isMonthOfYear(f.month) ? salesMonthsFor(f.month) : [f.month];
      const batches = await Promise.all(months.map((m) => this.allPages({ ...f, kind: undefined, month: m })));

      const bySlug = new Map<string, ProductSummary>();
      for (const b of batches) for (const p of b.items) if (!bySlug.has(p.slug)) bySlug.set(p.slug, p);
      let items = [...bySlug.values()];
      if (f.kind) items = items.filter((p) => p.destinations.some((d) => tripKindOf(d.name) === f.kind));
      if (batches.length > 1) {
        const firstDate = (p: ProductSummary) => p.nextDepartures[0]?.date ?? "9999-12-31";
        items.sort((a, b) => firstDate(a).localeCompare(firstDate(b)));
      }
      return {
        facets: batches[0]?.facets ?? { destinations: [], departFrom: [], seasons: [] },
        page,
        pageSize,
        total: items.length,
        items: items.slice((page - 1) * pageSize, page * pageSize),
      };
    });
  }

  /** Mọi trang của một bộ lọc (tháng YYYY-MM hoặc không tháng), giới hạn để không gọi xTravelOS vô hạn. */
  private async allPages(f: Partial<ProductFilter>): Promise<ProductList> {
    const first = await this.listProducts({ ...f, page: 1, pageSize: LOCAL_FILTER_PAGE_SIZE });
    const items = [...first.items];
    const pages = Math.min(LOCAL_FILTER_MAX_PAGES, Math.ceil(first.total / LOCAL_FILTER_PAGE_SIZE));
    for (let page = 2; page <= pages; page++) {
      items.push(...(await this.listProducts({ ...f, page, pageSize: LOCAL_FILTER_PAGE_SIZE })).items);
    }
    return { ...first, items };
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
