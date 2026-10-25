import { formatDate, formatMoney } from "../../shared/format";
import { paths } from "../../shared/routes";
import type { ProductSummary } from "../../shared/schemas";

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
export function weekday(isoDate: string): string {
  return WEEKDAYS[new Date(`${isoDate}T00:00:00Z`).getUTCDay()] ?? "";
}

/** Bảng khởi hành: các chuyến sắp đi gần nhất, đọc như bảng giờ bay ở sân bay. */
export function DepartureBoard({ products }: { products: ProductSummary[] }) {
  const rows = products
    .flatMap((p) => p.nextDepartures.filter((d) => d.seatsAvailable > 0).map((d) => ({ p, d })))
    .sort((a, b) => a.d.date.localeCompare(b.d.date))
    .slice(0, 8);
  if (!rows.length) return null;
  return (
    <section aria-labelledby="board-title" className="wrap mt-16">
      <div className="flex items-end justify-between gap-4">
        <h2 id="board-title" className="text-2xl sm:text-3xl">Sắp khởi hành</h2>
        <a href="/tour?sort=departure" className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-primary hover:underline">Xem toàn bộ lịch</a>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl bg-ink text-white">
        <table className="tabular w-full text-left text-sm sm:text-base">
          <caption className="sr-only">Các chuyến sắp khởi hành, ngày, tour, nơi khởi hành, chỗ còn và giá</caption>
          <thead className="hidden text-xs text-white/60 sm:table-header-group">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Ngày đi</th>
              <th scope="col" className="px-4 py-3 font-semibold">Tour</th>
              <th scope="col" className="px-4 py-3 font-semibold">Từ</th>
              <th scope="col" className="px-4 py-3 font-semibold">Chỗ còn</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Giá từ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, d }) => (
              <tr key={`${p.slug}-${d.date}`} className="relative grid grid-cols-[auto_1fr] gap-x-3 border-t border-white/10 px-4 py-3 hover:bg-white/5 sm:table-row sm:p-0">
                <td className="row-span-2 font-extrabold sm:px-4 sm:py-3">
                  <span className="block text-xs font-semibold text-soft">{weekday(d.date)}</span>
                  {formatDate(d.date).slice(0, 5)}
                </td>
                <td className="sm:px-4 sm:py-3">
                  <a href={paths.product(p.slug)} className="font-semibold after:absolute after:inset-0 hover:underline">{p.name}</a>
                </td>
                <td className="hidden text-white/75 sm:table-cell sm:px-4 sm:py-3">{p.departFrom}</td>
                <td className="text-sm sm:px-4 sm:py-3 sm:text-base">
                  <span className={d.seatsAvailable <= 5 ? "font-semibold text-soft" : "text-white/75"}>
                    {d.seatsAvailable <= 5 ? `Còn ${d.seatsAvailable} chỗ` : `${d.seatsAvailable} chỗ`}
                  </span>
                  <span className="text-white/75 sm:hidden"> từ {p.departFrom}{p.fromPrice !== null ? `, ${formatMoney(p.fromPrice)}` : ""}</span>
                </td>
                <td className="hidden text-right font-semibold sm:table-cell sm:px-4 sm:py-3">
                  {p.fromPrice !== null ? formatMoney(p.fromPrice) : "Báo giá"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
