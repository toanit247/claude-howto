import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatDate, formatDateTime, formatMoney } from "../../shared/format";
import type { AppData, PageData } from "../../shared/routes";
import type { AgentStatement, Booking } from "../../shared/schemas";
import { BookingResult, STATUS_LABEL } from "../components/BookingPanel";
import { Alert, Breadcrumbs, Consent } from "../components/ui";
import { api, ApiError, newIdempotencyKey } from "../lib/api";

export function LookupPage() {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<{ booking: Booking; phone: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const booking = await api<Booking>("/bookings/lookup", { method: "POST", body: { code, phone } });
      setFound({ booking, phone });
    } catch (err) {
      setFound(null);
      setError(err instanceof ApiError && err.status === 404 ? "Không thấy đơn khớp mã và số điện thoại này." : err instanceof Error ? err.message : "Không tra cứu được.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap max-w-xl py-8">
      <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Tra cứu đơn" }]} />
      <h1 className="mt-3 text-3xl">Tra cứu đơn đặt chỗ</h1>
      <p className="mt-2 text-muted">Nhập mã đặt chỗ và số điện thoại đã dùng khi đặt.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="l-code" className="label">Mã đặt chỗ</label>
          <input id="l-code" required className="field tabular uppercase" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="l-phone" className="label">Số điện thoại</label>
          <input id="l-phone" required type="tel" inputMode="tel" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </div>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? "Đang tra cứu…" : "Tra cứu"}</button>
      </form>
      {found ? <BookingResult key={found.booking.code} initial={found.booking} phone={found.phone} /> : null}
    </div>
  );
}

export function ContactPage({ data, page }: { data: AppData; page: Extract<PageData, { page: "contact" }> }) {
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", message: page.need ? `Tôi cần tư vấn: ${page.need}. ` : "" });
  const [consent, setConsent] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const key = useRef<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    key.current ??= newIdempotencyKey();
    try {
      await api("/leads", {
        method: "POST",
        idempotencyKey: key.current,
        body: {
          fullName: form.fullName,
          phone: form.phone,
          ...(form.email ? { email: form.email } : {}),
          ...(form.message ? { message: form.message } : {}),
          ...(page.productSlug ? { productSlug: page.productSlug } : {}),
          consentPurpose: consent,
          marketingOptIn: marketing,
        },
      });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.status !== 0) key.current = null;
      setError(err instanceof Error ? err.message : "Không gửi được.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap grid gap-10 py-8 lg:grid-cols-[1fr_1fr]">
      <div>
        <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Liên hệ" }]} />
        <h1 className="mt-3 text-3xl sm:text-4xl">Để lại số, chúng tôi gọi lại tư vấn</h1>
        <p className="mt-3 max-w-md text-muted">
          Đoàn doanh nghiệp, hội nghị khách hàng, teambuilding, tour học sinh hay tour gia đình thiết kế riêng: cho chúng tôi biết số khách, thời gian dự kiến và ngân sách.
        </p>
        <p className="mt-6 text-sm">{data.brand.contact.address}</p>
        {data.brand.contact.hotline ? <p className="mt-1 text-sm font-semibold">{data.brand.contact.hotline}</p> : null}
      </div>
      {sent ? (
        <Alert tone="success">
          <p className="font-semibold">Đã nhận thông tin của bạn.</p>
          <p>Nhân viên tư vấn sẽ gọi lại trong giờ làm việc.</p>
        </Alert>
      ) : (
        <form onSubmit={submit} className="space-y-4 rounded-xl border border-line p-5">
          {page.productSlug ? <p className="text-sm text-muted">Tư vấn cho tour: {page.productSlug}</p> : null}
          <div>
            <label htmlFor="f-name" className="label">Họ tên</label>
            <input id="f-name" required autoComplete="name" className="field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="f-phone" className="label">Số điện thoại</label>
              <input id="f-phone" required type="tel" inputMode="tel" autoComplete="tel" className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label htmlFor="f-email" className="label">Email (không bắt buộc)</label>
              <input id="f-email" type="email" autoComplete="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div>
            <label htmlFor="f-msg" className="label">Bạn cần tư vấn gì?</label>
            <textarea id="f-msg" rows={4} className="field py-2" placeholder="Ví dụ: đoàn 120 khách, đi Đà Nẵng 3 ngày cuối tháng 5, có gala dinner" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <Consent brand={data.brand.name} purpose="để liên hệ tư vấn theo yêu cầu này" consent={consent} marketing={marketing} onConsent={setConsent} onMarketing={setMarketing} />
          {error ? <Alert tone="error">{error}</Alert> : null}
          <button type="submit" className="btn-primary w-full" disabled={busy || !consent}>{busy ? "Đang gửi…" : "Gửi yêu cầu tư vấn"}</button>
        </form>
      )}
    </div>
  );
}

export function AgentLoginPage({ data, page }: { data: AppData; page: Extract<PageData, { page: "agent-login" }> }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alliance = data.siteKind === "alliance";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/agents/login", { method: "POST", body: { username, password } });
      window.location.href = page.next ?? "/dai-ly";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đăng nhập được.");
      setBusy(false);
    }
  }

  return (
    <div className="wrap max-w-md py-12">
      <h1 className="text-3xl">{alliance ? "Đăng nhập cổng liên minh" : "Đăng nhập đại lý, cộng tác viên"}</h1>
      <p className="mt-2 text-muted">
        {alliance
          ? "Tài khoản riêng cho từng doanh nghiệp trong liên minh, do chủ tour cấp."
          : "Tài khoản do hệ thống cấp. Đăng nhập để thấy phần hưởng theo cấp, giữ và chốt chỗ cho khách."}
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="a-user" className="label">Tên đăng nhập</label>
          <input id="a-user" required autoComplete="username" className="field" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label htmlFor="a-pass" className="label">Mật khẩu</label>
          <input id="a-pass" required type="password" autoComplete="current-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? "Đang đăng nhập…" : "Đăng nhập"}</button>
      </form>
    </div>
  );
}

export function AgentPage({ data }: { data: AppData }) {
  const [s, setS] = useState<AgentStatement | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<AgentStatement>("/agents/me/statement")
      .then(setS)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) window.location.href = "/dai-ly/dang-nhap?next=/dai-ly";
        else setError(err instanceof Error ? err.message : "Không tải được dữ liệu.");
      });
  }, []);
  const alliance = data.siteKind === "alliance";
  if (error) return <div className="wrap py-8"><Alert tone="error">{error}</Alert></div>;
  if (!s) return <div className="wrap py-8 text-muted">Đang tải…</div>;
  return (
    <div className="wrap py-8">
      <h1 className="text-3xl">{s.agent.company}</h1>
      <p className="mt-1 text-muted">
        {s.agent.name}
        {s.agent.tier ? `, cấp ${s.agent.tier}` : ""}
      </p>
      <dl className="tabular mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line p-4">
          <dt className="text-sm text-muted">Công nợ</dt>
          <dd className="mt-1 text-2xl font-extrabold">{formatMoney(s.debt)}</dd>
        </div>
        {alliance ? null : (
          <>
            <div className="rounded-xl border border-line p-4">
              <dt className="text-sm text-muted">Hoa hồng chờ trả (sau khi tour kết thúc)</dt>
              <dd className="mt-1 text-2xl font-extrabold text-primary">{formatMoney(s.commissionPending)}</dd>
            </div>
            <div className="rounded-xl border border-line p-4">
              <dt className="text-sm text-muted">Hoa hồng đã nhận</dt>
              <dd className="mt-1 text-2xl font-extrabold">{formatMoney(s.commissionPaid)}</dd>
            </div>
          </>
        )}
      </dl>

      <h2 className="mt-10 text-xl">Chỗ đang giữ</h2>
      {s.holds.length ? (
        <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
          {s.holds.map((h) => (
            <li key={h.holdId} className="tabular flex flex-wrap justify-between gap-2 p-3 text-sm">
              <span className="font-semibold">{h.productName}</span>
              <span>{formatDate(h.departureDate)}, {h.pax.adult + h.pax.child + h.pax.infant} khách</span>
              <span className="text-muted">Hết hạn {formatDateTime(h.expiresAt)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-muted">Chưa giữ chỗ nào. <a href="/tour" className="text-primary underline">Chọn tour để giữ chỗ</a>.</p>
      )}

      <h2 className="mt-10 text-xl">Đơn đã chốt</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-line">
        <table className="tabular w-full min-w-[640px] text-left text-sm">
          <thead className="bg-mist text-xs text-muted">
            <tr>
              <th scope="col" className="p-3">Mã</th>
              <th scope="col" className="p-3">Tour</th>
              <th scope="col" className="p-3">Ngày đi</th>
              <th scope="col" className="p-3">Trạng thái</th>
              <th scope="col" className="p-3 text-right">Tổng bán</th>
              <th scope="col" className="p-3 text-right">{alliance ? "Giá cost" : "Hoa hồng"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {s.bookings.map((b) => (
              <tr key={b.code}>
                <td className="p-3 font-semibold">{b.code}</td>
                <td className="p-3">{b.productName}</td>
                <td className="p-3">{formatDate(b.departureDate)}</td>
                <td className="p-3">
                  {STATUS_LABEL[b.status]}
                  {b.rejectionReason ? <span className="block text-xs text-accent-ink">Lý do: {b.rejectionReason}</span> : null}
                </td>
                <td className="p-3 text-right">{formatMoney(b.total)}</td>
                <td className="p-3 text-right">
                  {alliance ? (b.costTotal !== null ? formatMoney(b.costTotal) : "Chưa chốt") : b.commission !== null ? formatMoney(b.commission) : "Chưa tính"}
                </td>
              </tr>
            ))}
            {s.bookings.length === 0 ? (
              <tr><td colSpan={6} className="p-3 text-muted">Chưa có đơn.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {s.documents.length ? (
        <>
          <h2 className="mt-10 text-xl">Tư liệu bán hàng</h2>
          <ul className="mt-3 space-y-2">
            {s.documents.map((d) => (
              <li key={d.mediaId}>
                <a href={`/media/${d.mediaId}?w=1440&f=webp`} download className="text-primary underline">{d.title}</a>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
