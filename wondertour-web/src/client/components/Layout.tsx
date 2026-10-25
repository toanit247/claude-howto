import { useState, type ReactNode } from "react";
import type { AppData } from "../../shared/routes";
import { Icon } from "../icons";
import { api } from "../lib/api";
import { setCity, useBrowserValue, useCity, useSession } from "../lib/hooks";

export function Layout({ data, children }: { data: AppData; children: ReactNode }) {
  const { brand, siteKind, path } = data;
  const alliance = siteKind === "alliance";
  const nav = alliance
    ? [
        { href: "/tour", label: "Sản phẩm" },
        { href: "/dai-ly", label: "Công nợ, quyết toán" },
      ]
    : [
        { href: "/tour", label: "Tour" },
        { href: "/bai-viet", label: "Cẩm nang" },
        { href: "/tra-cuu", label: "Tra cứu đơn" },
        { href: "/lien-he", label: "Liên hệ" },
      ];
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#noi-dung" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:p-2">
        Bỏ qua, đến nội dung chính
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="wrap flex h-16 items-center gap-6">
          <a href="/" className="shrink-0" aria-label={`${brand.name}, trang chủ`}>
            <img src={brand.logo} alt="" width={144} height={32} className="h-8 w-auto" />
          </a>
          {alliance ? <span className="hidden rounded-md bg-mist px-2 py-1 text-xs font-semibold text-primary sm:inline">Cổng liên minh</span> : null}
          <nav aria-label="Chính" className="ml-auto hidden md:block">
            <ul className="flex gap-6 text-sm font-semibold">
              {nav.map((n) => (
                <li key={n.href}>
                  <a
                    href={n.href}
                    aria-current={path.startsWith(n.href) ? "page" : undefined}
                    className="py-2 hover:text-primary aria-[current=page]:text-primary"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            {!alliance && brand.departureCities.length ? <CityPicker cities={brand.departureCities} /> : null}
            <AccountLink alliance={alliance} />
          </div>
        </div>
        <nav aria-label="Chính (điện thoại)" className="border-t border-line md:hidden">
          <ul className="wrap flex gap-5 overflow-x-auto text-sm font-semibold whitespace-nowrap">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} aria-current={path.startsWith(n.href) ? "page" : undefined} className="inline-flex min-h-11 items-center aria-[current=page]:text-primary">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="noi-dung" className="flex-1">
        {children}
      </main>

      <footer className="mt-16 bg-ink text-white/85">
        <div className="wrap grid gap-8 py-12 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="text-lg font-extrabold text-white">{brand.name}</p>
            <p className="mt-1">{brand.slogan}</p>
            <p className="mt-4 max-w-md">{brand.description}</p>
          </div>
          <div>
            <p className="font-semibold text-white">Văn phòng</p>
            <p className="mt-2 flex gap-2">
              <Icon name="pin" className="mt-0.5 size-4 shrink-0" />
              {brand.contact.address}
            </p>
            {brand.contact.branches.length ? <p className="mt-2">Chi nhánh: {brand.contact.branches.join(", ")}</p> : null}
            {brand.contact.hotline ? (
              <p className="mt-2 flex gap-2">
                <Icon name="phone" className="mt-0.5 size-4 shrink-0" />
                <a href={`tel:${brand.contact.hotline.replace(/\s/g, "")}`} className="hover:text-white">
                  {brand.contact.hotline}
                </a>
              </p>
            ) : null}
            {brand.contact.email ? (
              <p className="mt-2 flex gap-2">
                <Icon name="mail" className="mt-0.5 size-4 shrink-0" />
                <a href={`mailto:${brand.contact.email}`} className="hover:text-white">
                  {brand.contact.email}
                </a>
              </p>
            ) : null}
          </div>
          <div>
            <p className="font-semibold text-white">Thông tin</p>
            <ul className="mt-1">
              <li><a href="/chinh-sach-quyen-rieng-tu" className="inline-block py-2 hover:text-white">Chính sách quyền riêng tư</a></li>
              <li><a href="/tra-cuu" className="inline-block py-2 hover:text-white">Tra cứu đơn đặt chỗ</a></li>
              <li><a href="/dai-ly/dang-nhap" className="inline-block py-2 hover:text-white">{alliance ? "Đăng nhập cổng liên minh" : "Đại lý, cộng tác viên"}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/15">
          <p className="wrap py-4 text-xs text-white/70">
            © {brand.name}. Biểu tượng: Solar Icon Set của 480 Design, giấy phép CC BY 4.0.
          </p>
        </div>
      </footer>

      {alliance ? null : <FloatingContact data={data} />}
      <CookieBanner />
    </div>
  );
}

/** Chọn nơi khởi hành ở đầu trang; trang chủ và ô tìm kiếm ưu tiên tour đi từ đây. */
function CityPicker({ cities }: { cities: string[] }) {
  const city = useCity();
  return (
    <label className="flex min-h-11 items-center gap-1 text-sm font-semibold">
      <Icon name="pin" className="size-5 shrink-0 text-accent-ink" />
      <span className="sr-only">Nơi khởi hành</span>
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="min-h-11 max-w-28 cursor-pointer appearance-none bg-transparent pr-1 text-ink focus:outline-none sm:max-w-none"
      >
        <option value="">Mọi nơi</option>
        {cities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <Icon name="down" className="size-4 shrink-0 text-muted" />
    </label>
  );
}

function AccountLink({ alliance }: { alliance: boolean }) {
  const { agent, loaded } = useSession();
  if (!loaded) return <span className="w-11 shrink-0" />;
  if (!agent) {
    return (
      <a href="/dai-ly/dang-nhap" className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 text-sm font-semibold hover:text-primary">
        <Icon name="user" className="size-5" />
        <span className="hidden sm:inline">{alliance ? "Đăng nhập" : "Đại lý"}</span>
      </a>
    );
  }
  return (
    <div className="flex items-center gap-3 text-sm">
      <a href="/dai-ly" className="inline-flex items-center gap-1 font-semibold text-primary">
        <Icon name="user" className="size-5" />
        <span className="max-w-32 truncate">{agent.company}</span>
      </a>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-muted hover:text-ink"
        onClick={async () => {
          await api("/agents/logout", { method: "POST", body: {} }).catch(() => undefined);
          window.location.href = "/";
        }}
      >
        <Icon name="logout" className="size-5" />
        <span className="sr-only sm:not-sr-only">Thoát</span>
      </button>
    </div>
  );
}

/** Nút liên hệ nổi: gọi hotline, nhắn Zalo, hoặc để lại số để được gọi lại. */
function FloatingContact({ data }: { data: AppData }) {
  const { hotline, zalo } = data.brand.contact;
  if (data.page.page === "product") return null; // trang tour đã có thanh đặt chỗ dưới màn hình
  return (
    <div className="fixed right-4 bottom-4 z-20 flex flex-col gap-2">
      {zalo ? (
        <a href={zalo} target="_blank" rel="noopener noreferrer" className="btn-primary rounded-full shadow-lg" aria-label="Nhắn Zalo">
          <Icon name="chat" />
          <span className="hidden sm:inline">Zalo</span>
        </a>
      ) : null}
      {hotline ? (
        <a href={`tel:${hotline.replace(/\s/g, "")}`} className="btn-primary rounded-full shadow-lg" aria-label={`Gọi ${hotline}`}>
          <Icon name="phone" />
          <span className="hidden sm:inline">{hotline}</span>
        </a>
      ) : (
        <a href="/lien-he" className="btn-primary size-14 rounded-full p-0 shadow-lg sm:size-auto sm:px-5" aria-label="Nhận tư vấn">
          <Icon name="phone" className="size-6 sm:size-5" />
          <span className="hidden sm:inline">Nhận tư vấn</span>
        </a>
      )}
    </div>
  );
}

const CONSENT_COOKIE = "wt_consent";

/** Web chỉ dùng cookie cần thiết; cookie đo lường chỉ được bật khi người xem đồng ý. */
function CookieBanner() {
  const [dismissed, setDismissed] = useState(false);
  const chosen = useBrowserValue(() => String(document.cookie.split("; ").some((c) => c.startsWith(`${CONSENT_COOKIE}=`))), "true");
  if (dismissed || chosen === "true") return null;
  const choose = (value: "necessary" | "all") => {
    document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${180 * 86400}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    setDismissed(true);
  };
  return (
    <div role="dialog" aria-label="Lựa chọn cookie" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white p-4 shadow-[0_-8px_24px_rgb(0_0_0/0.08)]">
      <div className="wrap flex flex-col gap-3 text-sm sm:flex-row sm:items-center">
        <p className="flex-1">
          Web dùng cookie cần thiết để đăng nhập và ghi nhớ lựa chọn của bạn. Cookie đo lường chỉ bật khi bạn đồng ý.{" "}
          <a href="/chinh-sach-quyen-rieng-tu" className="text-primary underline">Xem chính sách</a>
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" onClick={() => choose("necessary")}>Chỉ cookie cần thiết</button>
          <button type="button" className="btn-primary" onClick={() => choose("all")}>Đồng ý tất cả</button>
        </div>
      </div>
    </div>
  );
}
