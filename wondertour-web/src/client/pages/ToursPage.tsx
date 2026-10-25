import type { AppData, PageData } from "../../shared/routes";
import type { ProductList } from "../../shared/schemas";
import { PRODUCT_SORTS } from "../../shared/sorts";
import { SentenceSearch } from "../components/SentenceSearch";
import { TourCard } from "../components/TourCard";
import { Breadcrumbs } from "../components/ui";
import { Icon } from "../icons";

const SORT_LABEL: Record<(typeof PRODUCT_SORTS)[number], string> = {
  departure: "Khởi hành gần nhất",
  "price-asc": "Giá thấp đến cao",
  "price-desc": "Giá cao đến thấp",
};

const CATEGORY_LABEL: Record<string, string> = {
  "trong-nuoc": "Tour trong nước",
  "nuoc-ngoai": "Tour nước ngoài",
  "doanh-nghiep": "Tour đoàn doanh nghiệp",
  "hoc-sinh": "Tour học sinh",
};

export function Pagination({ list, basePath, query }: { list: Pick<ProductList, "page" | "pageSize" | "total">; basePath: string; query: Record<string, string> }) {
  const pages = Math.ceil(list.total / list.pageSize);
  if (pages <= 1) return null;
  const href = (p: number) => `${basePath}?${new URLSearchParams({ ...query, page: String(p) }).toString()}`;
  return (
    <nav aria-label="Phân trang" className="mt-8 flex justify-center gap-2">
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <a
          key={p}
          href={href(p)}
          aria-current={p === list.page ? "page" : undefined}
          className="tabular inline-flex size-11 items-center justify-center rounded-lg border border-line hover:border-primary aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:text-white"
        >
          {p}
        </a>
      ))}
    </nav>
  );
}

export function ToursPage({ page }: { data: AppData; page: Extract<PageData, { page: "tours" }> }) {
  const { filter, list } = page;
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(filter)) if (v !== undefined && k !== "page") query[k] = String(v);
  return (
    <div className="wrap py-8">
      <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Tour" }]} />
      {filter.promo || (filter.category && CATEGORY_LABEL[filter.category]) ? (
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-mist px-3 py-1 text-sm font-semibold text-primary">
          {filter.promo ? "Đang ưu đãi" : CATEGORY_LABEL[filter.category ?? ""]}
          <a href="/tour" className="text-muted hover:text-ink" aria-label="Bỏ lọc này">
            <Icon name="close" className="size-4" />
          </a>
        </p>
      ) : null}
      <div className="mt-4">
        <SentenceSearch facets={list.facets} months={page.months} filter={filter} tone="light" />
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        <p className="text-muted" role="status">
          {list.total ? `Tìm thấy ${list.total} tour` : "Chưa có tour khớp. Thử bỏ bớt điều kiện, hoặc để lại yêu cầu để được thiết kế tour riêng."}
        </p>
        <nav aria-label="Sắp xếp" className="-mx-4 flex gap-2 overflow-x-auto px-4 text-sm whitespace-nowrap sm:mx-0 sm:px-0">
          {PRODUCT_SORTS.map((s) => (
            <a
              key={s}
              href={`/tour?${new URLSearchParams({ ...query, sort: s }).toString()}`}
              aria-current={filter.sort === s ? "true" : undefined}
              className="inline-flex min-h-10 items-center rounded-full border border-line px-3 hover:border-primary aria-[current=true]:border-primary aria-[current=true]:bg-mist aria-[current=true]:text-primary"
            >
              {SORT_LABEL[s]}
            </a>
          ))}
        </nav>
      </div>
      {list.total === 0 ? (
        <a href="/lien-he" className="btn-primary mt-4">Gửi yêu cầu tour riêng</a>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.items.map((p, i) => (
            <TourCard key={p.slug} p={p} priority={i === 0} />
          ))}
        </div>
      )}
      <Pagination list={list} basePath="/tour" query={query} />
    </div>
  );
}

export function DestinationPage({ page }: { data: AppData; page: Extract<PageData, { page: "destination" }> }) {
  return (
    <div className="wrap py-8">
      <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Tour", href: "/tour" }, { label: page.destination.name }]} />
      <h1 className="mt-3 text-3xl sm:text-4xl">Tour {page.destination.name}</h1>
      <p className="mt-2 text-muted">{page.list.total} tour đang mở bán</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {page.list.items.map((p, i) => (
          <TourCard key={p.slug} p={p} priority={i === 0} />
        ))}
      </div>
      <Pagination list={page.list} basePath={`/diem-den/${page.destination.slug}`} query={{}} />
    </div>
  );
}
