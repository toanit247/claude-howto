import { formatDateOfInstant } from "../../shared/format";
import type { AppData, PageData } from "../../shared/routes";
import { paths } from "../../shared/routes";
import { TourCard } from "../components/TourCard";
import { PageCover } from "../components/PageCover";
import { Breadcrumbs, Picture } from "../components/ui";
import { Pagination } from "./ToursPage";

export function ArticlesPage({ page }: { data: AppData; page: Extract<PageData, { page: "articles" }> }) {
  return (
    <>
    <PageCover eyebrow="Cẩm nang" title="Đi đâu, khi nào, và làm sao để chuyến đi trọn vẹn" lead="Kinh nghiệm từ những đoàn WonderTour đã đi: lịch trình, mùa đẹp, và những việc nên chuẩn bị trước." />
    <div className="wrap py-8">
      <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Cẩm nang" }]} />
      <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {page.list.items.map((a, i) => (
          <article key={a.slug} className="relative">
            {a.cover ? <Picture media={a.cover} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="aspect-[16/10] w-full rounded-lg object-cover" priority={i === 0} /> : null}
            <p className="mt-3 text-sm text-muted">{formatDateOfInstant(a.publishedAt)}</p>
            <h2 className="mt-1 text-xl">
              <a href={paths.article(a.slug)} className="after:absolute after:inset-0 hover:text-primary">{a.title}</a>
            </h2>
            <p className="mt-1 text-muted">{a.excerpt}</p>
          </article>
        ))}
      </div>
      <Pagination list={page.list} basePath="/bai-viet" query={{}} />
    </div>
    </>
  );
}

export function ArticlePage({ page }: { data: AppData; page: Extract<PageData, { page: "article" }> }) {
  const a = page.article;
  return (
    <article className="wrap py-8">
      <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Cẩm nang", href: "/bai-viet" }, { label: a.title }]} />
      <header className="mt-4 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl">{a.title}</h1>
        <p className="mt-3 text-muted">
          {a.author}, {formatDateOfInstant(a.publishedAt)}
        </p>
      </header>
      {a.cover ? <Picture media={a.cover} sizes="(min-width: 1152px) 1100px, 100vw" className="mt-6 aspect-[16/9] w-full rounded-xl object-cover" priority /> : null}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="prose-wt text-lg">
          {a.blocks.map((b, i) => {
            switch (b.type) {
              case "heading":
                return <h2 key={i}>{b.text}</h2>;
              case "paragraph":
                return <p key={i}>{b.text}</p>;
              case "list":
                return (
                  <ul key={i}>
                    {b.items.map((it) => <li key={it}>{it}</li>)}
                  </ul>
                );
              case "image":
                return (
                  <figure key={i} className="my-6">
                    <Picture media={b.media} sizes="(min-width: 1024px) 720px, 100vw" className="w-full rounded-lg" />
                    {b.caption ? <figcaption className="mt-2 text-sm text-muted">{b.caption}</figcaption> : null}
                  </figure>
                );
            }
          })}
        </div>
        {a.product ? (
          <aside aria-label="Đặt tour trong bài" className="lg:sticky lg:top-20 lg:self-start">
            <p className="mb-3 font-semibold">Đặt ngay tour trong bài</p>
            <TourCard p={a.product} />
            <a href={`${paths.product(a.product.slug)}#dat-cho`} className="btn-primary mt-3 w-full">Chọn ngày và đặt chỗ</a>
          </aside>
        ) : null}
      </div>
    </article>
  );
}

export function PrivacyPage({ data }: { data: AppData }) {
  const n = data.brand.name;
  return (
    <div className="wrap prose-wt py-8">
      <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Chính sách quyền riêng tư" }]} />
      <h1 className="mt-3 text-3xl sm:text-4xl">Chính sách quyền riêng tư</h1>
      <p>
        Chính sách này nói rõ {n} thu thập thông tin gì, để làm gì và bạn có quyền gì, theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân và
        Luật Bảo vệ dữ liệu cá nhân.
      </p>
      <h2>Thông tin chúng tôi nhận</h2>
      <ul>
        <li>Khi đặt chỗ: họ tên, số điện thoại, email của người liên hệ; họ tên, ngày sinh của từng khách.</li>
        <li>Khi tour cần vé máy bay hoặc visa: số hộ chiếu hoặc CCCD. Web không nhận ảnh giấy tờ.</li>
        <li>Khi để lại liên hệ: họ tên, số điện thoại, email, nội dung bạn viết.</li>
      </ul>
      <h2>Mục đích</h2>
      <p>
        Xử lý đặt chỗ, giữ chỗ, xuất vé, làm thủ tục, liên hệ trong chuyến đi và tư vấn theo yêu cầu của bạn. Tin ưu đãi chỉ gửi khi bạn tự chọn ô
        đồng ý nhận tin, và bạn có thể hủy bất kỳ lúc nào.
      </p>
      <h2>Nơi lưu</h2>
      <p>
        Thông tin chuyển thẳng về hệ thống điều hành của {n}. Máy chủ web không lưu thông tin khách vào ổ đĩa và không ghi vào nhật ký.
      </p>
      <h2>Cookie</h2>
      <p>
        Web dùng cookie cần thiết để giữ phiên đăng nhập của đại lý và ghi nhớ lựa chọn cookie của bạn. Cookie đo lường chỉ bật khi bạn đồng ý ở
        thông báo cookie. Danh sách tour đã xem chỉ nằm trong trình duyệt của bạn.
      </p>
      <h2>Quyền của bạn</h2>
      <p>
        Bạn có quyền xem, sửa, yêu cầu xóa thông tin, rút lại sự đồng ý và khiếu nại. Liên hệ {n} tại {data.brand.contact.address}
        {data.brand.contact.email ? ` hoặc ${data.brand.contact.email}` : ""}.
      </p>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="wrap py-20 text-center">
      <h1 className="text-3xl">Không tìm thấy trang này</h1>
      <p className="mt-3 text-muted">Đường dẫn có thể đã đổi hoặc tour đã ngừng bán.</p>
      <div className="mt-6 flex justify-center gap-3">
        <a href="/tour" className="btn-primary">Xem tour đang mở bán</a>
        <a href="/" className="btn-ghost">Về trang chủ</a>
      </div>
    </div>
  );
}

export function MaintenancePage() {
  return (
    <div className="wrap py-20 text-center">
      <h1 className="text-3xl">Hệ thống đặt chỗ đang bảo trì</h1>
      <p className="mx-auto mt-3 max-w-lg text-muted">
        Để bạn không đặt nhầm theo giá hoặc chỗ cũ, web tạm dừng bán cho đến khi hệ thống điều hành hoạt động lại. Vui lòng quay lại sau ít phút.
      </p>
    </div>
  );
}
