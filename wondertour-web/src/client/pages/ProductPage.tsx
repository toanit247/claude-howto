import { useEffect } from "react";
import { formatDuration, formatMoney } from "../../shared/format";
import type { AppData, PageData } from "../../shared/routes";
import { paths } from "../../shared/routes";
import { BookingPanel } from "../components/BookingPanel";
import { RecentTours } from "../components/RecentTours";
import { TourCard } from "../components/TourCard";
import { Breadcrumbs, Picture, Price } from "../components/ui";
import { Icon } from "../icons";
import { pushRecent } from "../lib/recent";

export function ProductPage({ data, page }: { data: AppData; page: Extract<PageData, { page: "product" }> }) {
  const p = page.product;
  useEffect(() => pushRecent({ slug: p.slug, name: p.name }), [p.slug, p.name]);
  const depositText = p.deposit.kind === "percent" ? `${p.deposit.value}% giá tour` : `${formatMoney(p.deposit.value)} mỗi khách`;
  return (
    <>
      <div className="wrap pt-6">
        <Breadcrumbs
          items={[
            { label: "Trang chủ", href: "/" },
            ...(p.destinations[0] ? [{ label: p.destinations[0].name, href: paths.destination(p.destinations[0].slug) }] : [{ label: "Tour", href: "/tour" }]),
            { label: p.name },
          ]}
        />
        <h1 className="mt-3 max-w-4xl text-3xl sm:text-4xl">{p.name}</h1>
        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-muted">
          <span className="inline-flex items-center gap-1"><Icon name="clock" className="size-4" />{formatDuration(p.durationDays, p.durationNights)}</span>
          <span className="inline-flex items-center gap-1"><Icon name="flag" className="size-4" />Khởi hành từ {p.departFrom}</span>
          <span className="inline-flex items-center gap-1"><Icon name="tag" className="size-4" />Mã tour {p.code}</span>
        </p>
      </div>

      <div className="wrap mt-6 grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
        {p.coverImage ? (
          <div className="overflow-hidden rounded-xl sm:col-span-3 sm:row-span-2">
            <Picture media={p.coverImage} sizes="(min-width: 1152px) 860px, (min-width: 640px) 75vw, 100vw" className="aspect-[16/9] size-full object-cover" priority />
          </div>
        ) : null}
        {p.gallery.slice(0, 2).map((m) => (
          <div key={m.id} className="hidden overflow-hidden rounded-xl sm:block">
            <Picture media={m} sizes="280px" className="size-full object-cover" />
          </div>
        ))}
      </div>

      <div className="wrap mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="min-w-0">
          <nav aria-label="Mục trong trang" className="sticky top-16 z-10 -mx-4 overflow-x-auto border-b border-line bg-white px-4 lg:top-16">
            <ul className="flex gap-6 py-3 text-sm font-semibold whitespace-nowrap">
              <li><a href="#lich-trinh" className="hover:text-primary">Lịch trình</a></li>
              <li><a href="#bao-gom" className="hover:text-primary">Giá bao gồm</a></li>
              <li><a href="#dieu-kien" className="hover:text-primary">Điều kiện hủy</a></li>
              <li className="lg:hidden"><a href="#dat-cho" className="text-primary">Đặt chỗ</a></li>
            </ul>
          </nav>

          <p className="mt-6 max-w-[68ch] text-lg">{p.summary}</p>

          <section id="lich-trinh" aria-labelledby="lt-title" className="mt-10">
            <h2 id="lt-title" className="text-2xl">Lịch trình</h2>
            <ol className="mt-4 border-l-2 border-line">
              {p.itinerary.map((d) => (
                <li key={d.day} className="relative pb-6 pl-6 last:pb-0">
                  <span className="absolute top-0 -left-[13px] flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{d.day}</span>
                  <h3 className="text-lg">Ngày {d.day}: {d.title}</h3>
                  <p className="mt-1 max-w-[68ch] whitespace-pre-line text-ink/85">{d.description}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="bao-gom" aria-labelledby="bg-title" className="mt-10 grid gap-6 sm:grid-cols-2">
            <h2 id="bg-title" className="sr-only">Giá bao gồm và không bao gồm</h2>
            <div>
              <h3 className="text-lg">Giá bao gồm</h3>
              <ul className="mt-2 space-y-2">
                {p.includes.map((x) => (
                  <li key={x} className="flex gap-2"><Icon name="check" className="mt-0.5 size-5 shrink-0 text-primary" />{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg">Không bao gồm</h3>
              <ul className="mt-2 space-y-2">
                {p.excludes.map((x) => (
                  <li key={x} className="flex gap-2"><Icon name="close" className="mt-0.5 size-5 shrink-0 text-muted" />{x}</li>
                ))}
              </ul>
            </div>
          </section>

          <section id="dieu-kien" aria-labelledby="dk-title" className="mt-10">
            <h2 id="dk-title" className="text-2xl">Đặt cọc và điều kiện hủy</h2>
            <p className="mt-3">Đặt cọc {depositText} khi xác nhận đặt chỗ.</p>
            <p className="mt-2 max-w-[68ch] whitespace-pre-line">{p.cancellationPolicy}</p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <BookingPanel product={p} brandName={data.brand.name} />
          <a href={`/lien-he?tour=${p.slug}`} className="btn-ghost mt-3 w-full">
            <Icon name="users" /> Đi theo đoàn riêng? Nhận báo giá
          </a>
        </aside>
      </div>

      {page.related.length ? (
        <section aria-labelledby="rel-title" className="wrap mt-16">
          <h2 id="rel-title" className="text-2xl">Tour cùng điểm đến</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {page.related.map((r) => <TourCard key={r.slug} p={r} />)}
          </div>
        </section>
      ) : null}
      <RecentTours exclude={p.slug} />

      {/* Thanh đặt chỗ dưới màn hình điện thoại: nút luôn trong tầm ngón cái. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          {p.fromPrice !== null ? <Price amount={p.fromPrice} vatIncluded={p.vatIncluded} compareAt={p.promotion?.compareAtPrice} prefix="Từ" /> : <span className="font-semibold">Báo giá theo đoàn</span>}
          <a href="#dat-cho" className="btn-primary shrink-0">Chọn ngày</a>
        </div>
      </div>
      <div className="h-24 lg:hidden" aria-hidden="true" />
    </>
  );
}
