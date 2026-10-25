// Trang quản trị web (/quan-tri): bật tắt khối, sửa dịch vụ, tour đoàn, liên hệ, trợ lý AI.
// Không đụng sản phẩm, giá, đơn: những thứ đó quản lý trong xTravelOS.
import { useEffect, useState, type FormEvent } from "react";
import type { AppData, PageData } from "../../shared/routes";
import { FEATURE_KEYS, FEATURE_LABEL, type GroupOption, type ServiceItem, type SiteSettings } from "../../shared/settings";
import { Alert } from "../components/ui";
import { api, ApiError } from "../lib/api";

export function AdminPage({ page }: { data: AppData; page: Extract<PageData, { page: "admin" }> }) {
  const [user, setUser] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    api<{ username: string | null }>("/admin/me")
      .then((r) => {
        setUser(r.username);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, []);

  void page;
  if (!checked) return <div className="wrap py-12 text-muted">Đang kiểm tra phiên…</div>;
  if (!user) return <LoginForm onDone={setUser} />;
  return <SettingsForm user={user} onLogout={() => setUser(null)} />;
}

function LoginForm({ onDone }: { onDone: (u: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ username: string }>("/admin/login", { method: "POST", body: { username, password } });
      onDone(r.username);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đăng nhập được.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="wrap max-w-md py-12">
      <h1 className="text-3xl">Quản trị web</h1>
      <p className="mt-2 text-muted">Đăng nhập bằng tài khoản nhân viên xTravelOS đã được cấp quyền sửa web. Khách và đại lý không dùng trang này.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="ad-user" className="label">Tên đăng nhập</label>
          <input id="ad-user" required autoComplete="username" className="field" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label htmlFor="ad-pass" className="label">Mật khẩu</label>
          <input id="ad-pass" required type="password" autoComplete="current-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? "Đang đăng nhập…" : "Đăng nhập"}</button>
      </form>
    </div>
  );
}

function SettingsForm({ user, onLogout }: { user: string; onLogout: () => void }) {
  const [s, setS] = useState<SiteSettings | null>(null);
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<SiteSettings>("/admin/settings")
      .then(setS)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) onLogout();
        else setStatus({ tone: "error", text: err instanceof Error ? err.message : "Không tải được cấu hình." });
      });
  }, [onLogout]);

  if (!s) return <div className="wrap py-12 text-muted">{status ? <Alert tone="error">{status.text}</Alert> : "Đang tải cấu hình…"}</div>;

  const update = (patch: Partial<SiteSettings>) => setS({ ...s, ...patch });
  const setService = (i: number, patch: Partial<ServiceItem>) => update({ services: s.services.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const setGroup = (i: number, patch: Partial<GroupOption>) => update({ groupOptions: s.groupOptions.map((x, j) => (j === i ? { ...x, ...patch } : x)) });

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const saved = await api<SiteSettings>("/admin/settings", { method: "PUT", body: s });
      setS(saved);
      setStatus({ tone: "success", text: "Đã lưu. Trang web đổi ngay cho khách mới tải." });
    } catch (err) {
      setStatus({ tone: "error", text: err instanceof Error ? err.message : "Không lưu được." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="wrap max-w-3xl space-y-10 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">Quản trị web</h1>
          <p className="mt-1 text-sm text-muted">Đăng nhập: {user}. Sản phẩm, giá, đơn hàng quản lý trong xTravelOS, không ở đây.</p>
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={async () => {
            await api("/admin/logout", { method: "POST", body: {} }).catch(() => undefined);
            onLogout();
          }}
        >
          Đăng xuất
        </button>
      </div>

      <section aria-labelledby="f-title">
        <h2 id="f-title" className="text-xl">Khối hiển thị</h2>
        <p className="mt-1 text-sm text-muted">Tắt là ẩn khỏi web cho khách; không mất dữ liệu.</p>
        <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
          {FEATURE_KEYS.map((k) => (
            <li key={k} className="flex items-center justify-between gap-3 p-3">
              <label htmlFor={`f-${k}`} className="text-sm">{FEATURE_LABEL[k]}</label>
              <input
                id={`f-${k}`}
                type="checkbox"
                role="switch"
                aria-checked={s.features[k] ?? true}
                checked={s.features[k] ?? true}
                onChange={(e) => update({ features: { ...s.features, [k]: e.target.checked } })}
                className="size-5 accent-[var(--brand-primary)]"
              />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="s-title">
        <h2 id="s-title" className="text-xl">Lưới dịch vụ ở trang chủ</h2>
        <p className="mt-1 text-sm text-muted">Tối đa 12 mục. Biểu tượng: map, plane, users, ticket, passport, building, sim, case, cap, confetti, bus, wallet.</p>
        <div className="mt-3 space-y-2">
          {s.services.map((sv, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr_1fr_2fr_auto] items-center gap-2 rounded-lg border border-line p-2 text-sm">
              <input type="checkbox" aria-label="Hiện" checked={sv.enabled} onChange={(e) => setService(i, { enabled: e.target.checked })} className="size-4 accent-[var(--brand-primary)]" />
              <input aria-label="Tên" className="field min-h-9" value={sv.label} onChange={(e) => setService(i, { label: e.target.value })} />
              <input aria-label="Biểu tượng" className="field min-h-9" value={sv.icon} onChange={(e) => setService(i, { icon: e.target.value })} />
              <input aria-label="Đường dẫn" className="field min-h-9" value={sv.href} onChange={(e) => setService(i, { href: e.target.value })} />
              <button type="button" className="text-xs text-accent-ink underline" onClick={() => update({ services: s.services.filter((_, j) => j !== i) })}>Xóa</button>
            </div>
          ))}
          {s.services.length < 12 ? (
            <button type="button" className="btn-ghost" onClick={() => update({ services: [...s.services, { label: "Dịch vụ mới", icon: "flag", href: "/lien-he", enabled: true }] })}>
              Thêm dịch vụ
            </button>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="g-title">
        <h2 id="g-title" className="text-xl">Lựa chọn trong trang Tour đoàn</h2>
        <div className="mt-3 space-y-2">
          {s.groupOptions.map((g, i) => (
            <div key={g.key} className="grid gap-2 rounded-lg border border-line p-3 text-sm sm:grid-cols-[auto_1fr_1fr]">
              <label className="flex items-center gap-2"><input type="checkbox" checked={g.enabled} onChange={(e) => setGroup(i, { enabled: e.target.checked })} className="size-4 accent-[var(--brand-primary)]" />Hiện</label>
              <input aria-label="Tên" className="field min-h-9" value={g.label} onChange={(e) => setGroup(i, { label: e.target.value })} />
              <input aria-label="Đường dẫn" className="field min-h-9" value={g.href} onChange={(e) => setGroup(i, { href: e.target.value })} />
              <input aria-label="Mô tả" className="field min-h-9 sm:col-span-3" value={g.description} onChange={(e) => setGroup(i, { description: e.target.value })} />
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="c-title" className="grid gap-3 sm:grid-cols-3">
        <h2 id="c-title" className="text-xl sm:col-span-3">Liên hệ hiện trên web</h2>
        <div>
          <label htmlFor="c-hotline" className="label">Hotline</label>
          <input id="c-hotline" className="field" value={s.contact.hotline ?? ""} onChange={(e) => update({ contact: { ...s.contact, hotline: e.target.value || undefined } })} />
        </div>
        <div>
          <label htmlFor="c-email" className="label">Email</label>
          <input id="c-email" type="email" className="field" value={s.contact.email ?? ""} onChange={(e) => update({ contact: { ...s.contact, email: e.target.value || undefined } })} />
        </div>
        <div>
          <label htmlFor="c-zalo" className="label">Link Zalo</label>
          <input id="c-zalo" type="url" placeholder="https://zalo.me/…" className="field" value={s.contact.zalo ?? ""} onChange={(e) => update({ contact: { ...s.contact, zalo: e.target.value || undefined } })} />
        </div>
      </section>

      <section aria-labelledby="b-title" className="space-y-3">
        <h2 id="b-title" className="text-xl">Trợ lý AI</h2>
        <div>
          <label htmlFor="b-name" className="label">Tên trợ lý</label>
          <input id="b-name" className="field" value={s.chatbot.name} onChange={(e) => update({ chatbot: { ...s.chatbot, name: e.target.value } })} />
        </div>
        <div>
          <label htmlFor="b-greet" className="label">Câu chào</label>
          <textarea id="b-greet" rows={2} className="field py-2" value={s.chatbot.greeting} onChange={(e) => update({ chatbot: { ...s.chatbot, greeting: e.target.value } })} />
        </div>
        <div>
          <label htmlFor="b-sug" className="label">Câu hỏi gợi ý (mỗi dòng một câu, tối đa 6)</label>
          <textarea id="b-sug" rows={4} className="field py-2" value={s.chatbot.suggestions.join("\n")} onChange={(e) => update({ chatbot: { ...s.chatbot, suggestions: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 6) } })} />
        </div>
        <div>
          <label htmlFor="b-tone" className="label">Lưu ý giọng nói cho trợ lý (không bắt buộc)</label>
          <textarea id="b-tone" rows={2} className="field py-2" placeholder="Ví dụ: nhắc khách về ưu đãi tháng này; không nhận đoàn dưới 10 người" value={s.chatbot.toneNote} onChange={(e) => update({ chatbot: { ...s.chatbot, toneNote: e.target.value } })} />
        </div>
      </section>

      {status ? <Alert tone={status.tone}>{status.text}</Alert> : null}
      <div className="sticky bottom-0 -mx-4 border-t border-line bg-white/95 p-4 backdrop-blur sm:mx-0 sm:rounded-xl">
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>{busy ? "Đang lưu…" : "Lưu cấu hình"}</button>
      </div>
      <p className="text-xs text-muted">Thông tin thương hiệu gốc (tên, logo, màu) nằm ở tệp <code>brand/*.json</code> của bản triển khai; muốn đổi, người kỹ thuật sửa tệp đó.</p>
    </form>
  );
}
