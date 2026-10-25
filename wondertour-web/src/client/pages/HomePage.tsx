import type { AppData, PageData } from "../../shared/routes";
import { formatDateOfInstant } from "../../shared/format";
import { paths } from "../../shared/routes";
import { DepartureBoard } from "../components/DepartureBoard";
import { DealsSection, DestinationStrip, Rail, ServiceGrid } from "../components/HomeSections";
import { RecentTours } from "../components/RecentTours";
import { SentenceSearch } from "../components/SentenceSearch";
import { TourCard } from "../components/TourCard";
import { Picture } from "../components/ui";
import { setCity, useCity } from "../lib/hooks";

export function HomePage({ data, page }: { data: AppData; page: Extract<PageData, { page: "home" }> }) {
  const { brand } = data;
  const city = useCity();
  // Lọc theo nơi khởi hành ngay trên trình duyệt; HTML dựng sẵn vẫn là bản đầy đủ dùng chung cho mọi người.
  const byCity = city ? page.products.filter((p) => p.departFrom === city) : page.products;
  const products = byCity.length ? byCity : page.products;
  return (
    <>
      <section className="bg-primary text-white">
        <div className="wrap pt-8 pb-20 sm:pt-14 sm:pb-28">
          <p className="mb-5 text-sm font-semibold text-soft sm:text-base">{brand.name}, {brand.slogan.toLowerCase()}</p>
          <SentenceSearch
            facets={page.facets}
            months={page.months}
            tone="dark"
            subtitle={
              <p className="mt-5 max-w-xl text-white/80 sm:text-lg">
                <span className="hidden sm:inline">{brand.hero.title} </span>
                Bấm vào từng chỗ trống. Web tìm theo lịch khởi hành và chỗ còn thật.
              </p>
            }
          />
        </div>
      </section>

      <div className="wrap -mt-12 sm:-mt-16">
        <div className="rounded-2xl bg-white p-4 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.25)] sm:p-6">
          <ServiceGrid services={brand.services} />
        </div>
      </div>

      <DealsSection deals={page.deals} />

      <DepartureBoard products={products} />

      <DestinationStrip destinations={page.facets.destinations} />

      <section aria-labelledby="tour-title" className="wrap mt-14">
        <div className="flex items-end justify-between gap-4">
          <h2 id="tour-title" className="text-2xl sm:text-3xl">{city && byCity.length ? `Tour khởi hành từ ${city}` : "Tour đang mở bán"}</h2>
          <a href={city ? `/tour?from=${encodeURIComponent(city)}` : "/tour"} className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-primary hover:underline">Tất cả tour</a>
        </div>
        {city && !byCity.length ? (
          <p className="mt-2 text-sm text-muted">
            Chưa có tour khởi hành từ {city} trong mục này.{" "}
            <button type="button" className="font-semibold text-primary underline" onClick={() => setCity("")}>Xem tour mọi nơi</button>
          </p>
        ) : null}
        <div className="mt-6">
          <Rail cols="lg:grid-cols-3">
            {products.slice(0, 6).map((p) => (
              <div key={p.slug} className="w-[82%] shrink-0 snap-start sm:w-auto">
                <TourCard p={p} />
              </div>
            ))}
          </Rail>
        </div>
      </section>

      {brand.proof.length ? (
        <section aria-labelledby="proof-title" className="mt-16 bg-mist py-12 sm:py-14">
          <div className="wrap grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-10">
            <div>
              <h2 id="proof-title" className="text-2xl sm:text-3xl">Đoàn doanh nghiệp đã đi cùng chúng tôi</h2>
              <p className="mt-3 max-w-md text-muted">
                Hội nghị khách hàng, incentive, teambuilding, gala. Đoàn vài trăm người cần quy trình, người chịu trách nhiệm và cách xử lý khi có phát sinh.
              </p>
              <a href="/lien-he?nhu-cau=Đoàn doanh nghiệp" className="btn-primary mt-6 w-full sm:w-auto">Nhận đề xuất cho đoàn</a>
            </div>
            <ul className="divide-y divide-line border-y border-line">
              {brand.proof.map((g) => (
                <li key={`${g.client}-${g.trip}`} className="flex items-baseline justify-between gap-4 py-4">
                  <span className="text-lg font-extrabold sm:text-2xl">
                    {g.client} <span className="font-semibold text-muted">đi {g.trip}</span>
                  </span>
                  <span className="tabular shrink-0 text-lg font-extrabold text-primary sm:text-2xl">{g.pax} khách</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <RecentTours />

      {page.articles.length ? (
        <section aria-labelledby="art-title" className="wrap mt-16">
          <h2 id="art-title" className="text-2xl sm:text-3xl">Cẩm nang trước chuyến đi</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {page.articles.map((a) => (
              <article key={a.slug} className="relative grid grid-cols-[112px_1fr] gap-3 md:block">
                {a.cover ? (
                  <Picture media={a.cover} sizes="(min-width: 768px) 33vw, 112px" className="aspect-square w-full rounded-lg object-cover md:aspect-[16/10]" />
                ) : null}
                <div>
                  <p className="text-sm text-muted md:mt-3">{formatDateOfInstant(a.publishedAt)}</p>
                  <h3 className="mt-1 text-base md:text-lg">
                    <a href={paths.article(a.slug)} className="after:absolute after:inset-0 hover:text-primary">{a.title}</a>
                  </h3>
                  <p className="mt-1 hidden text-muted md:line-clamp-2">{a.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
