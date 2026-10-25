// Trang Tour đoàn và Vé tham quan.
import { useRef, useState, type FormEvent } from "react";
import { formatDate, formatMoney } from "../../shared/format";
import type { AppData, PageData } from "../../shared/routes";
import { paths } from "../../shared/routes";
import type { Booking, TicketDetail } from "../../shared/schemas";
import { BookingResult } from "../components/BookingPanel";
import { Alert, Breadcrumbs, Consent, Picture } from "../components/ui";
import { Icon, isIconName } from "../icons";
import { api, ApiError, newIdempotencyKey } from "../lib/api";

export function GroupToursPage({ data }: { data: AppData }) {
  const options = data.settings.groupOptions.filter((o) => o.enabled);
  const { brand } = data;
  return (
    <div className="wrap py-8">
      <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Tour đoàn" }]} />
      <h1 className="mt-3 text-3xl sm:text-4xl">Tour đoàn</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Doanh nghiệp, hội nghị, teambuilding, trường học hay nhóm riêng: mỗi đoàn một đề xuất, không bán lịch trình có sẵn. Chọn đúng nhu cầu để chúng tôi hỏi đúng câu và gửi đề xuất trong ngày làm việc.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((o) => (
          <li key={o.key}>
            <a href={o.href} className="flex h-full gap-4 rounded-2xl border border-line p-5 transition-colors hover:border-primary">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-mist text-primary">
                <Icon name={isIconName(o.icon) ? o.icon : "users"} className="size-6" />
              </span>
              <span>
                <span className="block text-lg font-extrabold">{o.label}</span>
                <span className="mt-1 block text-sm text-muted">{o.description}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      {brand.proof.length ? (
        <section aria-labelledby="g-proof" className="mt-12 rounded-2xl bg-mist p-6">
          <h2 id="g-proof" className="text-xl">Đoàn lớn đã tổ chức</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {brand.proof.map((g) => (
              <li key={`${g.client}-${g.trip}`} className="flex justify-between gap-3 border-b border-line py-2 text-sm">
                <span><b>{g.client}</b> đi {g.trip}</span>
                <span className="tabular font-semibold text-primary">{g.pax} khách</span>
              </li>
            ))}
          </ul>
          <a href="/lien-he?nhu-cau=Tour đoàn" className="btn-primary mt-5 w-full sm:w-auto">Để lại số, nhận đề xuất</a>
        </section>
      ) : null}
    </div>
  );
}

export function TicketsPage({ page }: { data: AppData; page: Extract<PageData, { page: "tickets" }> }) {
  return (
    <div className="wrap py-8">
      <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Vé tham quan" }]} />
      <h1 className="mt-3 text-3xl sm:text-4xl">Vé tham quan khu vui chơi</h1>
      <p className="mt-2 max-w-2xl text-muted">Vé điện tử, chọn ngày, thanh toán VietQR, nhận mã ngay khi tiền về. Giá hiện đủ số, ghi rõ vé người lớn và trẻ em.</p>
      {page.list.items.length === 0 ? (
        <p className="mt-8 text-muted">Chưa có vé đang bán. <a href="/lien-he?nhu-cau=Vé tham quan" className="text-primary underline">Để lại yêu cầu</a>, chúng tôi báo khi có.</p>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {page.list.items.map((t, i) => (
            <li key={t.slug} className="relative flex flex-col overflow-hidden rounded-xl border border-line">
              <div className="aspect-[4/3] bg-mist">
                {t.image ? <Picture media={t.image} sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" className="size-full object-cover" priority={i === 0} /> : null}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="inline-flex items-center gap-1 text-sm text-muted"><Icon name="pin" className="size-4" />{t.place}</p>
                <h2 className="text-lg">
                  <a href={paths.ticket(t.slug)} className="after:absolute after:inset-0 hover:text-primary">{t.name}</a>
                </h2>
                <p className="text-sm text-muted">{t.validityNote}</p>
                <p className="tabular mt-auto pt-2">
                  <span className="text-xl font-extrabold text-primary">{formatMoney(t.price.adult)}</span>
                  <span className="text-xs text-muted"> người lớn{t.price.child !== null ? `, trẻ em ${formatMoney(t.price.child)}` : ""}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TicketPage({ data, page }: { data: AppData; page: Extract<PageData, { page: "ticket" }> }) {
  const t = page.ticket;
  return (
    <div className="wrap py-8">
      <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Vé tham quan", href: "/ve-tham-quan" }, { label: t.name }]} />
      <h1 className="mt-3 text-3xl sm:text-4xl">{t.name}</h1>
      <p className="mt-2 inline-flex items-center gap-1 text-muted"><Icon name="pin" className="size-4" />{t.place}</p>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div>
          {t.image ? <Picture media={t.image} sizes="(min-width: 1152px) 720px, 100vw" className="aspect-[16/9] w-full rounded-xl object-cover" priority /> : null}
          <p className="mt-6 max-w-[68ch] text-lg">{t.summary}</p>
          <h2 className="mt-8 text-xl">Có gì trong vé</h2>
          <ul className="mt-2 space-y-2">
            {t.highlights.map((h) => (
              <li key={h} className="flex gap-2"><Icon name="check" className="mt-0.5 size-5 shrink-0 text-primary" />{h}</li>
            ))}
          </ul>
          <h2 className="mt-8 text-xl">Giờ mở cửa và điều kiện</h2>
          <p className="mt-2">{t.openHours}</p>
          <p className="mt-2 max-w-[68ch] whitespace-pre-line">{t.terms}</p>
        </div>
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <TicketOrderPanel ticket={t} brandName={data.brand.name} />
        </aside>
      </div>
    </div>
  );
}

function TicketOrderPanel({ ticket, brandName }: { ticket: TicketDetail; brandName: string }) {
  const [visitDate, setVisitDate] = useState(ticket.earliestDate);
  const [qty, setQty] = useState({ adult: 2, child: 0 });
  const [contact, setContact] = useState({ fullName: "", phone: "", email: "" });
  const [consent, setConsent] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Booking | null>(null);
  const key = useRef<string | null>(null);
  const total = ticket.price.adult * qty.adult + (ticket.price.child ?? ticket.price.adult) * qty.child;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    key.current ??= newIdempotencyKey();
    try {
      const booking = await api<Booking>("/ticket-orders", {
        method: "POST",
        idempotencyKey: key.current,
        body: {
          ticketSlug: ticket.slug,
          visitDate,
          qty,
          contact: { fullName: contact.fullName, phone: contact.phone, ...(contact.email ? { email: contact.email } : {}) },
          consentPurpose: consent,
          marketingOptIn: marketing,
        },
      });
      setDone(booking);
    } catch (err) {
      if (err instanceof ApiError && err.status !== 0 && err.status !== 422) key.current = null;
      setError(err instanceof Error ? err.message : "Không đặt được vé.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <section className="rounded-xl border border-line p-4 sm:p-5" aria-labelledby="ve-title">
        <h2 id="ve-title" className="text-xl">Đặt vé</h2>
        <BookingResult initial={done} phone={contact.phone} />
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-line p-4 sm:p-5" aria-labelledby="ve-title">
      <h2 id="ve-title" className="text-xl">Đặt vé</h2>
      <div>
        <label htmlFor="v-date" className="label">Ngày sử dụng</label>
        <input id="v-date" type="date" required min={ticket.earliestDate} value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="field" />
        <p className="mt-1 text-xs text-muted">Sớm nhất {formatDate(ticket.earliestDate)}. {ticket.validityNote}.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="v-adult" className="text-xs text-muted">Người lớn</label>
          <input id="v-adult" type="number" inputMode="numeric" min={1} max={50} value={qty.adult} onChange={(e) => setQty({ ...qty, adult: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })} className="field tabular" />
        </div>
        <div>
          <label htmlFor="v-child" className="text-xs text-muted">Trẻ em</label>
          <input id="v-child" type="number" inputMode="numeric" min={0} max={50} value={qty.child} onChange={(e) => setQty({ ...qty, child: Math.max(0, Math.min(50, Number(e.target.value) || 0)) })} className="field tabular" disabled={ticket.price.child === null} />
        </div>
      </div>
      <p className="tabular rounded-lg bg-mist p-3 text-sm">
        Tạm tính <b>{formatMoney(total)}</b>, {ticket.vatIncluded ? "đã gồm" : "chưa gồm"} thuế GTGT. Số tiền chính thức do hệ thống tính khi đặt.
      </p>
      <div>
        <label htmlFor="v-name" className="text-sm">Họ tên</label>
        <input id="v-name" required autoComplete="name" className="field" value={contact.fullName} onChange={(e) => setContact({ ...contact, fullName: e.target.value })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="v-phone" className="text-sm">Số điện thoại</label>
          <input id="v-phone" required type="tel" inputMode="tel" autoComplete="tel" className="field" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
        </div>
        <div>
          <label htmlFor="v-email" className="text-sm">Email nhận vé (không bắt buộc)</label>
          <input id="v-email" type="email" autoComplete="email" className="field" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
        </div>
      </div>
      <Consent brand={brandName} purpose="để xuất vé điện tử và liên hệ khi cần" consent={consent} marketing={marketing} onConsent={setConsent} onMarketing={setMarketing} />
      {error ? <Alert tone="error">{error}</Alert> : null}
      <button type="submit" className="btn-primary w-full" disabled={busy || !consent}>{busy ? "Đang đặt…" : "Đặt vé và nhận mã thanh toán"}</button>
    </form>
  );
}
