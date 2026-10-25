import { useState } from "react";
import { formatMoney } from "../../shared/format";
import { BUDGETS } from "../../shared/routes";
import type { ProductFilter, ProductList } from "../../shared/schemas";
import { Icon } from "../icons";
import { useCity } from "../lib/hooks";

export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  return `Tháng ${Number(m)}/${y}`;
}

function budgetLabel(b: (typeof BUDGETS)[number]): string {
  if (b.max === null) return `Từ ${formatMoney(b.min)}`;
  if (b.min === 0) return `Dưới ${formatMoney(b.max)}`;
  return `${formatMoney(b.min)} đến ${formatMoney(b.max)}`;
}

/**
 * Ô tìm tour: một dòng "Bạn muốn đi đâu?" luôn hiện; tháng, nơi khởi hành, ngân sách hiện sẵn trên máy tính,
 * gấp sau nút "Bộ lọc" trên điện thoại. Gửi bằng GET để trang kết quả có đường dẫn riêng.
 */
export function SearchBar({
  facets,
  months,
  filter,
}: {
  facets: ProductList["facets"];
  months: string[];
  filter?: Partial<ProductFilter>;
}) {
  const city = useCity();
  const [open, setOpen] = useState(false);
  const budget = BUDGETS.find((b) => b.min === (filter?.minPrice ?? -1) && b.max === (filter?.maxPrice ?? null));
  const from = filter?.from ?? (facets.departFrom.includes(city) ? city : "");
  const activeFilters = [filter?.month, filter?.from, budget].filter(Boolean).length;
  return (
    <form action="/tour" method="get" role="search" aria-label="Tìm tour">
      {filter?.category ? <input type="hidden" name="category" value={filter.category} /> : null}
      <div className="flex items-center gap-2 rounded-full border border-line bg-white p-1.5 pl-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
        <Icon name="search" className="size-5 shrink-0 text-muted" />
        <label htmlFor="s-q" className="sr-only">Bạn muốn đi đâu?</label>
        <input
          id="s-q"
          name="q"
          type="search"
          enterKeyHint="search"
          defaultValue={filter?.q ?? ""}
          className="min-h-11 min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-muted focus:outline-none"
          placeholder="Bạn muốn đi đâu?"
          list="s-dest-list"
          autoComplete="off"
        />
        <datalist id="s-dest-list">
          {facets.destinations.map((d) => (
            <option key={d.slug} value={d.name} />
          ))}
        </datalist>
        <button type="submit" className="btn-primary shrink-0 rounded-full px-4 sm:px-6">
          <span className="sr-only sm:not-sr-only">Tìm kiếm</span>
          <Icon name="arrow" className="size-5 sm:hidden" />
        </button>
      </div>

      <button
        type="button"
        className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary lg:hidden"
        aria-expanded={open}
        aria-controls="s-filters"
        onClick={() => setOpen(!open)}
      >
        <Icon name="filter" className="size-5" />
        Bộ lọc{activeFilters ? ` (${activeFilters})` : ""}
        <Icon name="down" className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div id="s-filters" className={`${open ? "grid" : "hidden"} mt-2 gap-3 sm:grid-cols-3 lg:mt-3 lg:grid`}>
        <div>
          <label htmlFor="s-month" className="label">Tháng khởi hành</label>
          <select id="s-month" name="month" defaultValue={filter?.month ?? ""} className="field">
            <option value="">Tháng nào cũng được</option>
            {months.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="s-from" className="label">Khởi hành từ</label>
          <select key={from} id="s-from" name="from" defaultValue={from} className="field">
            <option value="">Mọi nơi</option>
            {facets.departFrom.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="s-budget" className="label">Ngân sách mỗi khách</label>
          <select id="s-budget" name="budget" defaultValue={budget?.value ?? ""} className="field">
            <option value="">Mọi mức giá</option>
            {BUDGETS.map((b) => (
              <option key={b.value} value={b.value}>{budgetLabel(b)}</option>
            ))}
          </select>
        </div>
      </div>
    </form>
  );
}
