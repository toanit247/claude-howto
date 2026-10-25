import type { ReactNode } from "react";
import type { BrandConfig } from "../../shared/brand";
import { paths } from "../../shared/routes";
import type { ProductList, ProductSummary } from "../../shared/schemas";
import { Icon, isIconName } from "../icons";
import { TourCard } from "./TourCard";
import { Picture } from "./ui";

/** Lưới dịch vụ: 4 cột trên điện thoại, một hàng trên máy tính. */
export function ServiceGrid({ services }: { services: BrandConfig["services"] }) {
  if (!services.length) return null;
  return (
    <nav aria-label="Dịch vụ">
      <ul className="grid grid-cols-4 gap-x-1 gap-y-4 lg:grid-cols-8">
        {services.map((s) => {
          const external = /^https?:\/\//.test(s.href);
          return (
            <li key={s.label}>
              <a
                href={s.href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group flex min-h-11 flex-col items-center gap-1.5 rounded-lg p-1 text-center text-xs leading-tight font-semibold text-ink sm:text-sm"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-mist text-primary transition-colors group-hover:bg-primary group-hover:text-white sm:size-14">
                  <Icon name={isIconName(s.icon) ? s.icon : "flag"} className="size-6 sm:size-7" />
                </span>
                {s.label}
                {external ? <span className="sr-only"> (mở trang mới)</span> : null}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Dải cuộn ngang trên điện thoại (bám từng thẻ), thành lưới trên máy tính. */
export function Rail({ children, cols = "lg:grid-cols-4" }: { children: ReactNode; cols?: string }) {
  return (
    <div className={`-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 ${cols}`}>
      {children}
    </div>
  );
}

export function DealsSection({ deals }: { deals: ProductSummary[] }) {
  if (!deals.length) return null;
  return (
    <section aria-labelledby="deal-title" className="wrap mt-12">
      <div className="flex items-center justify-between gap-4">
        <h2 id="deal-title" className="flex items-center gap-2 text-2xl sm:text-3xl">
          <span className="flex size-9 items-center justify-center rounded-full bg-soft text-accent-ink"><Icon name="fire" /></span>
          Ưu đãi hôm nay
        </h2>
        <a href="/tour?promo=1" className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-primary hover:underline">Xem tất cả</a>
      </div>
      <div className="mt-5">
        <Rail>
          {deals.map((p) => (
            <div key={p.slug} className="w-[82%] shrink-0 snap-start sm:w-auto">
              <TourCard p={p} />
            </div>
          ))}
        </Rail>
      </div>
    </section>
  );
}

export function DestinationStrip({ destinations }: { destinations: ProductList["facets"]["destinations"] }) {
  if (!destinations.length) return null;
  return (
    <section aria-labelledby="dest-title" className="wrap mt-14">
      <div className="flex items-center justify-between gap-4">
        <h2 id="dest-title" className="text-2xl sm:text-3xl">Khám phá điểm đến</h2>
        <a href="/tour" className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-primary hover:underline">Tất cả tour</a>
      </div>
      <ul className="-mx-4 mt-5 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {destinations.map((d) => (
          <li key={d.slug} className="w-36 shrink-0 snap-start sm:w-44">
            <a href={paths.destination(d.slug)} className="relative block aspect-[3/4] overflow-hidden rounded-xl bg-mist">
              {d.cover ? <Picture media={d.cover} sizes="176px" className="size-full object-cover" /> : null}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10 font-semibold text-white">{d.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
