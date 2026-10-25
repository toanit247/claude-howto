// Đặt chỗ chạy trên trình duyệt: chọn ngày → giữ chỗ có hạn → danh sách khách → mã VietQR.
// Giá, chỗ còn, hạn giữ, mức cọc, trạng thái tiền đều do xTravelOS trả; web không tự tính, không tự báo đã thanh toán.
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { formatCountdown, formatDate, formatMoney, monthLabel } from "../../shared/format";
import { PARTIES, type PartyKey } from "../../shared/party";
import type { Booking, BookingStatus, Departure, Hold, Pax, ProductDetail } from "../../shared/schemas";
import { Icon } from "../icons";
import { api, ApiError, newIdempotencyKey } from "../lib/api";
import { useBrowserValue, useNow } from "../lib/hooks";
import { weekday } from "./DepartureBoard";
import { PARTY_KEY } from "./SentenceSearch";
import { Alert, Consent } from "./ui";

export const STATUS_LABEL: Record<BookingStatus, string> = {
  awaiting_payment: "Chờ thanh toán",
  deposit_paid: "Đã nhận tiền cọc",
  paid: "Đã thanh toán đủ",
  pending_approval: "Chờ chủ tour duyệt",
  confirmed: "Đã xác nhận",
  rejected: "Bị từ chối",
  cancelled: "Đã hủy",
  expired: "Hết hạn thanh toán",
};
const LIVE_STATUSES: BookingStatus[] = ["awaiting_payment", "deposit_paid", "pending_approval"];

type Step = { kind: "pick" } | { kind: "hold"; hold: Hold } | { kind: "done"; booking: Booking; phone: string };

interface PassengerDraft {
  type: "adult" | "child" | "infant";
  fullName: string;
  birthDate: string;
  idNumber: string;
}

const PAX_LABEL = { adult: "Người lớn", child: "Trẻ em", infant: "Em bé" } as const;

function passengersFor(pax: Pax, prev: PassengerDraft[]): PassengerDraft[] {
  const types = [
    ...Array<"adult">(pax.adult).fill("adult"),
    ...Array<"child">(pax.child).fill("child"),
    ...Array<"infant">(pax.infant).fill("infant"),
  ];
  return types.map((type, i) => (prev[i]?.type === type ? prev[i] : { type, fullName: "", birthDate: "", idNumber: "" }));
}

export function BookingPanel({ product, brandName }: { product: ProductDetail; brandName: string }) {
  const [departures, setDepartures] = useState<Departure[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  // Số khách mặc định theo "đi cùng ai" đã chọn ở câu tìm tour; khách sửa thì theo khách.
  const party = useBrowserValue(() => localStorage.getItem(PARTY_KEY) ?? "", "");
  const [paxEdits, setPax] = useState<Pax | null>(null);
  const pax: Pax = paxEdits ?? (party in PARTIES ? PARTIES[party as PartyKey].pax : { adult: 2, child: 0, infant: 0 });
  const [step, setStep] = useState<Step>({ kind: "pick" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const holdKey = useRef<string | null>(null);

  const loadDepartures = useCallback(async () => {
    try {
      const r = await api<{ items: Departure[] }>(`/products/${product.slug}/departures`);
      setDepartures(r.items);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Không tải được lịch khởi hành.");
    }
  }, [product.slug]);

  useEffect(() => {
    let alive = true;
    api<{ items: Departure[] }>(`/products/${product.slug}/departures`)
      .then((r) => alive && setDepartures(r.items))
      .catch((e: unknown) => alive && setLoadError(e instanceof ApiError ? e.message : "Không tải được lịch khởi hành."));
    return () => {
      alive = false;
    };
  }, [product.slug]);

  const dep = departures?.find((d) => d.id === selected) ?? null;
  const totalPax = pax.adult + pax.child + pax.infant;

  async function hold() {
    if (!dep) return;
    setBusy(true);
    setError(null);
    holdKey.current ??= newIdempotencyKey();
    try {
      const h = await api<Hold>("/holds", { method: "POST", body: { departureId: dep.id, pax }, idempotencyKey: holdKey.current });
      holdKey.current = null;
      setStep({ kind: "hold", hold: h });
    } catch (e) {
      if (e instanceof ApiError && e.status !== 0) holdKey.current = null; // lỗi thật: lần bấm sau là yêu cầu mới
      setError(e instanceof Error ? e.message : "Không giữ được chỗ.");
      if (e instanceof ApiError && e.status === 409) void loadDepartures();
    } finally {
      setBusy(false);
    }
  }

  async function release(h: Hold) {
    await api(`/holds/${h.holdId}/release`, { method: "POST", body: {}, idempotencyKey: newIdempotencyKey() }).catch(() => undefined);
    setStep({ kind: "pick" });
    void loadDepartures();
  }

  return (
    <section id="dat-cho" aria-labelledby="dat-cho-title" className="rounded-xl border border-line bg-white p-4 sm:p-5">
      <h2 id="dat-cho-title" className="text-xl">Đặt chỗ</h2>

      {step.kind === "pick" ? (
        <div className="mt-4 space-y-5">
          {loadError ? <Alert tone="error">{loadError}</Alert> : null}
          {departures === null && !loadError ? <p className="text-sm text-muted">Đang tải lịch khởi hành…</p> : null}
          {departures && departures.length === 0 ? (
            <Alert tone="info">
              Tour chưa có lịch cố định. <a href={`/lien-he?tour=${product.slug}`} className="font-semibold underline">Gửi yêu cầu</a> để nhận lịch riêng cho đoàn.
            </Alert>
          ) : null}
          {departures && departures.length > 0 ? (
            <DeparturePicker departures={departures} selected={selected} onSelect={setSelected} />
          ) : null}

          {dep ? (
            <>
              <fieldset>
                <legend className="label">Số khách</legend>
                <div className="grid grid-cols-3 gap-2">
                  {(["adult", "child", "infant"] as const).map((k) => (
                    <div key={k}>
                      <label htmlFor={`pax-${k}`} className="text-xs text-muted">
                        {PAX_LABEL[k]}
                        {k === "child" ? " (2–11 tuổi)" : k === "infant" ? " (dưới 2)" : ""}
                      </label>
                      <input
                        id={`pax-${k}`}
                        type="number"
                        inputMode="numeric"
                        min={k === "adult" ? 1 : 0}
                        max={50}
                        value={pax[k]}
                        onChange={(e) => setPax({ ...pax, [k]: Math.max(k === "adult" ? 1 : 0, Math.min(50, Number(e.target.value) || 0)) })}
                        className="field tabular"
                      />
                    </div>
                  ))}
                </div>
              </fieldset>
              <PriceLines dep={dep} pax={pax} />
              {totalPax > dep.seatsAvailable ? (
                <Alert tone="error">Ngày này chỉ còn {dep.seatsAvailable} chỗ. Giảm số khách hoặc chọn ngày khác.</Alert>
              ) : null}
            </>
          ) : null}

          {error ? <Alert tone="error">{error}</Alert> : null}
          <button
            type="button"
            className="btn-primary w-full"
            disabled={!dep || busy || totalPax > (dep?.seatsAvailable ?? 0)}
            onClick={hold}
          >
            {busy ? "Đang giữ chỗ…" : dep ? `Giữ ${totalPax} chỗ ngày ${formatDate(dep.date)}` : "Chọn ngày khởi hành"}
          </button>
          <p className="text-xs text-muted">Giữ chỗ chưa mất tiền. Chỗ được giữ trong thời hạn hiện ra sau khi bấm.</p>
        </div>
      ) : null}

      {step.kind === "hold" ? (
        <PassengerForm
          key={step.hold.holdId}
          product={product}
          hold={step.hold}
          brandName={brandName}
          onRelease={() => release(step.hold)}
          onExpired={() => {
            setStep({ kind: "pick" });
            setError("Hết hạn giữ chỗ. Vui lòng chọn lại ngày và giữ chỗ lần nữa.");
            void loadDepartures();
          }}
          onBooked={(booking, phone) => setStep({ kind: "done", booking, phone })}
        />
      ) : null}

      {step.kind === "done" ? <BookingResult initial={step.booking} phone={step.phone} /> : null}
    </section>
  );
}

function DeparturePicker({
  departures,
  selected,
  onSelect,
}: {
  departures: Departure[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const months = [...new Set(departures.map((d) => d.date.slice(0, 7)))];
  return (
    <fieldset>
      <legend className="label">Ngày khởi hành</legend>
      <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
        {months.map((m) => (
          <div key={m}>
            <p className="mb-1 text-xs font-semibold text-muted capitalize">{monthLabel(m)}</p>
            <div className="grid grid-cols-2 gap-2">
              {departures
                .filter((d) => d.date.startsWith(m))
                .map((d) => {
                  const disabled = d.status === "full" || d.status === "closed" || d.seatsAvailable === 0;
                  return (
                    <label
                      key={d.id}
                      className={`tabular relative cursor-pointer rounded-lg border p-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-mist has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${disabled ? "cursor-not-allowed border-line opacity-50" : "border-line hover:border-primary"}`}
                    >
                      <input
                        type="radio"
                        name="departure"
                        value={d.id}
                        className="sr-only"
                        checked={selected === d.id}
                        disabled={disabled}
                        onChange={() => onSelect(d.id)}
                      />
                      <span className="block font-semibold">
                        {weekday(d.date)} {formatDate(d.date)}
                      </span>
                      <span className="block text-primary">{formatMoney(d.price.adult)}</span>
                      {/* "Sắp hết" theo trạng thái xTravelOS trả (few), web không tự đặt ngưỡng. */}
                      <span className={`block text-xs ${d.status === "few" ? "font-semibold text-accent-ink" : "text-muted"}`}>
                        {disabled ? "Hết chỗ" : d.status === "few" ? `Còn ${d.seatsAvailable} chỗ` : `${d.seatsAvailable} chỗ`}
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

/** Giá từng loại khách đúng như API trả; tổng tiền chính thức do xTravelOS tính khi giữ chỗ. */
function PriceLines({ dep, pax }: { dep: Departure; pax: Pax }) {
  const lines: [string, number, number | null][] = [
    ["Người lớn", pax.adult, dep.price.adult],
    ["Trẻ em", pax.child, dep.price.child],
    ["Em bé", pax.infant, dep.price.infant],
  ];
  return (
    <div className="rounded-lg bg-mist p-3 text-sm">
      <dl className="tabular space-y-1">
        {lines
          .filter(([, n]) => n > 0)
          .map(([label, n, price]) => (
            <div key={label} className="flex justify-between gap-2">
              <dt>{label} × {n}</dt>
              <dd>{price === null ? "Báo giá khi giữ chỗ" : `${formatMoney(price)} / khách`}</dd>
            </div>
          ))}
      </dl>
      <p className="mt-2 text-xs text-muted">
        Giá {dep.vatIncluded ? "đã gồm" : "chưa gồm"} thuế GTGT. Ngày về {formatDate(dep.returnDate)}.
      </p>
      {dep.agent ? (
        <p className="mt-2 font-semibold text-primary-strong">
          Phần hưởng cấp {dep.agent.tier}: {formatMoney(dep.agent.commissionPerAdult)} mỗi khách người lớn (trả sau khi tour kết thúc)
        </p>
      ) : null}
      {dep.alliance ? (
        <p className="mt-2 font-semibold text-primary-strong">
          Giá cost tạm tính: {formatMoney(dep.alliance.costPerAdult)} người lớn
          {dep.alliance.costPerChild !== null ? `, ${formatMoney(dep.alliance.costPerChild)} trẻ em` : ""}
        </p>
      ) : null}
    </div>
  );
}

function PassengerForm({
  product,
  hold,
  brandName,
  onRelease,
  onExpired,
  onBooked,
}: {
  product: ProductDetail;
  hold: Hold;
  brandName: string;
  onRelease: () => void;
  onExpired: () => void;
  onBooked: (b: Booking, phone: string) => void;
}) {
  const now = useNow(true);
  const remaining = (Date.parse(hold.expiresAt) - now) / 1000;
  const [contact, setContact] = useState({ fullName: "", phone: "", email: "" });
  const [passengers, setPassengers] = useState<PassengerDraft[]>(() => passengersFor(hold.pax, []));
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Mã chống gửi trùng cho lần đặt này; giữ nguyên khi bấm lại sau lỗi mạng.
  const bookingKey = useRef<string | null>(null);

  useEffect(() => {
    if (remaining <= 0) onExpired();
  }, [remaining, onExpired]);

  const update = (i: number, patch: Partial<PassengerDraft>) =>
    setPassengers((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    bookingKey.current ??= newIdempotencyKey();
    try {
      const booking = await api<Booking>("/bookings", {
        method: "POST",
        idempotencyKey: bookingKey.current,
        body: {
          holdId: hold.holdId,
          contact: { fullName: contact.fullName, phone: contact.phone, ...(contact.email ? { email: contact.email } : {}) },
          passengers: passengers.map((p) => ({
            fullName: p.fullName,
            type: p.type,
            ...(p.birthDate ? { birthDate: p.birthDate } : {}),
            ...(product.requiresIdDocument && p.idNumber ? { idNumber: p.idNumber } : {}),
          })),
          ...(note ? { note } : {}),
          consentPurpose: consent,
          marketingOptIn: marketing,
        },
      });
      onBooked(booking, contact.phone);
    } catch (err) {
      // Lỗi mạng: giữ nguyên mã chống trùng để bấm lại không tạo hai đơn.
      if (err instanceof ApiError && err.status !== 0 && err.status !== 422) bookingKey.current = null;
      setError(err instanceof Error ? err.message : "Không đặt được chỗ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4" noValidate={false}>
      <div className="flex items-center justify-between gap-3 rounded-lg bg-mist p-3" role="timer" aria-live="off">
        <div>
          <p className="text-sm font-semibold">Đang giữ {hold.pax.adult + hold.pax.child + hold.pax.infant} chỗ</p>
          <p className="tabular text-sm text-muted">
            Tổng {formatMoney(hold.total)}, cọc {formatMoney(hold.deposit)}
          </p>
        </div>
        <p className={`tabular text-2xl font-extrabold ${remaining < 120 ? "text-accent-ink" : "text-primary"}`}>
          <span className="sr-only">Hạn giữ chỗ còn </span>
          {formatCountdown(remaining)}
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="label">Người liên hệ</legend>
        <div>
          <label htmlFor="c-name" className="text-sm">Họ tên</label>
          <input id="c-name" required autoComplete="name" className="field" value={contact.fullName} onChange={(e) => setContact({ ...contact, fullName: e.target.value })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="c-phone" className="text-sm">Số điện thoại</label>
            <input id="c-phone" required type="tel" inputMode="tel" autoComplete="tel" className="field" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
          </div>
          <div>
            <label htmlFor="c-email" className="text-sm">Email (không bắt buộc)</label>
            <input id="c-email" type="email" autoComplete="email" className="field" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="label">Danh sách khách</legend>
        {product.requiresIdDocument ? (
          <p className="text-xs text-muted">Tour cần vé máy bay hoặc visa nên cần số hộ chiếu, CCCD. Số giấy tờ chuyển thẳng về hệ thống đặt chỗ, web không lưu.</p>
        ) : null}
        {passengers.map((p, i) => (
          <div key={i} className="rounded-lg border border-line p-3">
            <p className="text-sm font-semibold">Khách {i + 1}, {PAX_LABEL[p.type].toLowerCase()}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor={`p-${i}-name`} className="text-xs text-muted">Họ tên như trên giấy tờ</label>
                <input id={`p-${i}-name`} required className="field" value={p.fullName} onChange={(e) => update(i, { fullName: e.target.value })} />
              </div>
              <div>
                <label htmlFor={`p-${i}-dob`} className="text-xs text-muted">Ngày sinh{p.type === "adult" ? " (không bắt buộc)" : ""}</label>
                <input id={`p-${i}-dob`} type="date" required={p.type !== "adult"} className="field" value={p.birthDate} onChange={(e) => update(i, { birthDate: e.target.value })} />
              </div>
              {product.requiresIdDocument ? (
                <div>
                  <label htmlFor={`p-${i}-id`} className="text-xs text-muted">Số hộ chiếu hoặc CCCD</label>
                  <input id={`p-${i}-id`} required autoComplete="off" className="field uppercase" value={p.idNumber} onChange={(e) => update(i, { idNumber: e.target.value.toUpperCase() })} />
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </fieldset>

      <div>
        <label htmlFor="b-note" className="text-sm">Ghi chú cho điều hành (không bắt buộc)</label>
        <textarea id="b-note" rows={2} className="field py-2" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <Consent
        brand={brandName}
        purpose="để xử lý đặt chỗ, xuất vé, làm thủ tục và liên hệ trong chuyến đi"
        consent={consent}
        marketing={marketing}
        onConsent={setConsent}
        onMarketing={setMarketing}
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" className="btn-primary flex-1" disabled={busy || !consent}>
          {busy ? "Đang gửi…" : "Đặt chỗ và nhận mã thanh toán"}
        </button>
        <button type="button" className="btn-ghost" onClick={onRelease} disabled={busy}>
          Nhả chỗ
        </button>
      </div>
    </form>
  );
}

/** Kết quả đặt chỗ: mã VietQR do xTravelOS sinh, trạng thái tiền hỏi lại hệ thống mỗi 5 giây. */
export function BookingResult({ initial, phone }: { initial: Booking; phone: string }) {
  const [b, setB] = useState(initial);
  useEffect(() => {
    if (!LIVE_STATUSES.includes(b.status)) return;
    let stopped = false;
    const started = Date.now();
    const t = setInterval(async () => {
      if (stopped || Date.now() - started > 30 * 60_000) return clearInterval(t);
      try {
        const next = await api<Booking>("/bookings/lookup", { method: "POST", body: { code: b.code, phone } });
        if (!stopped) setB(next);
      } catch {
        // Bỏ qua lần hỏi lỗi; lần sau hỏi tiếp.
      }
    }, 5000);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [b.code, b.status, phone]);

  const good = b.status === "paid" || b.status === "confirmed" || b.status === "deposit_paid";
  return (
    <div className="mt-4 space-y-4" aria-live="polite">
      <Alert tone={b.status === "rejected" || b.status === "expired" || b.status === "cancelled" ? "error" : good ? "success" : "info"}>
        <p className="font-semibold">
          Mã đặt chỗ <span className="tabular">{b.code}</span>: {STATUS_LABEL[b.status]}
        </p>
        {b.status === "pending_approval" ? <p>Chủ tour đang duyệt. Kết quả hiện ở trang đại lý.</p> : null}
        {b.rejectionReason ? <p>Lý do: {b.rejectionReason}</p> : null}
        <p>Lưu mã này để tra cứu đơn bằng số điện thoại đã đặt.</p>
      </Alert>
      <dl className="tabular grid grid-cols-2 gap-2 text-sm">
        <dt className="text-muted">Tour</dt>
        <dd>{b.productName}</dd>
        <dt className="text-muted">Ngày đi</dt>
        <dd>{formatDate(b.departureDate)}</dd>
        <dt className="text-muted">Tổng tiền</dt>
        <dd className="font-semibold">{formatMoney(b.total)}</dd>
        <dt className="text-muted">Tiền cọc</dt>
        <dd>{formatMoney(b.deposit)}</dd>
        <dt className="text-muted">Đã nhận</dt>
        <dd className="font-semibold text-primary">{formatMoney(b.paidAmount)}</dd>
      </dl>
      {b.payment && (b.status === "awaiting_payment" || b.status === "deposit_paid") ? <PaymentBox p={b.payment} /> : null}
    </div>
  );
}

function PaymentBox({ p }: { p: NonNullable<Booking["payment"]> }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
    } catch {
      setCopied(null);
    }
  };
  return (
    <div className="rounded-xl border-2 border-primary p-4">
      <p className="flex items-center gap-2 font-semibold">
        <Icon name="qr" /> Quét mã VietQR bằng ứng dụng ngân hàng
      </p>
      <img src={p.qrImage} alt={`Mã VietQR chuyển ${formatMoney(p.amount)} tới ${p.accountName}`} width={240} height={240} className="mx-auto my-3 size-60" />
      <dl className="tabular space-y-1 text-sm">
        <div className="flex justify-between gap-2"><dt className="text-muted">Ngân hàng</dt><dd>{p.bankName}</dd></div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Số tài khoản</dt>
          <dd><button type="button" className="font-semibold underline decoration-dotted" onClick={() => copy("stk", p.accountNo)}>{p.accountNo}</button></dd>
        </div>
        <div className="flex justify-between gap-2"><dt className="text-muted">Chủ tài khoản</dt><dd>{p.accountName}</dd></div>
        <div className="flex justify-between gap-2"><dt className="text-muted">Số tiền</dt><dd className="font-semibold">{formatMoney(p.amount)}</dd></div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Nội dung</dt>
          <dd><button type="button" className="font-semibold underline decoration-dotted" onClick={() => copy("nd", p.transferContent)}>{p.transferContent}</button></dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-muted" aria-live="polite">
        {copied ? "Đã chép vào bộ nhớ tạm. " : "Bấm số tài khoản hoặc nội dung để chép. "}
        Trạng thái tiền tự cập nhật khi ngân hàng báo về hệ thống, thường trong vài phút.
      </p>
    </div>
  );
}
