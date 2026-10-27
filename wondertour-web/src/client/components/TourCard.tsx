import { formatDate, formatDateOfInstant, formatDuration } from "../../shared/format";
import { paths } from "../../shared/routes";
import type { ProductSummary } from "../../shared/schemas";
import { Icon } from "../icons";
import { Picture, Price } from "./ui";

const FEW_SEATS = 5;

export function TourCard({ p, priority = false }: { p: ProductSummary; priority?: boolean }) {
  const next = p.nextDepartures.filter((d) => d.seatsAvailable > 0).slice(0, 3);
  const scarce = next.find((d) => d.seatsAvailable <= FEW_SEATS);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-white">
      <div className="relative aspect-[4/3] overflow-hidden bg-mist">
        {p.coverImage ? (
          <Picture
            media={p.coverImage}
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            priority={priority}
          />
        ) : null}
        {p.promotion ? (
          <span className="absolute top-3 left-3 rounded-md bg-accent px-2 py-1 text-xs font-semibold text-ink">
            {p.promotion.label}
            {p.promotion.endsAt ? `, đến ${formatDateOfInstant(p.promotion.endsAt).slice(0, 5)}` : ""}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" className="size-4" />
            {formatDuration(p.durationDays, p.durationNights)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="flag" className="size-4" />
            Khởi hành {p.departFrom}
          </span>
        </p>
        <h3 className="text-lg">
          <a href={paths.product(p.slug)} className="after:absolute after:inset-0 hover:text-primary">
            {p.name}
          </a>
        </h3>
        {next.length ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Ngày khởi hành gần nhất">
            {next.map((d) => (
              <li key={d.date} className="tabular rounded-md bg-mist px-2 py-0.5 text-sm text-ink">
                {formatDate(d.date)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Liên hệ để có lịch khởi hành riêng cho đoàn</p>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          {p.fromPrice !== null ? (
            <Price amount={p.fromPrice} vatIncluded={p.vatIncluded} compareAt={p.promotion?.compareAtPrice} prefix="Từ" />
          ) : (
            <p className="font-semibold text-primary">Báo giá theo đoàn</p>
          )}
          {scarce ? (
            <p className="shrink-0 rounded-md bg-soft px-2 py-1 text-xs font-semibold text-accent-ink">
              Còn {scarce.seatsAvailable} chỗ
            </p>
          ) : null}
        </div>
        <p className="text-xs text-muted">Mã tour {p.code}</p>
      </div>
    </article>
  );
}
