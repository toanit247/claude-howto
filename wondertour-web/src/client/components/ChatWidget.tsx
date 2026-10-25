// Trợ lý AI tư vấn tour, nhìn giống trợ lý trong xTravelOS: khung 360×480, đầu khung màu thương hiệu,
// bong bóng khách màu thương hiệu, bong bóng trợ lý trắng viền xám, nút "Gửi". Hội thoại chỉ lưu trong
// sessionStorage của trình duyệt khách; máy chủ không giữ.
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import type { PublicSettings } from "../../shared/settings";
import { Icon } from "../icons";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const STORE_KEY = "wt_chat";
const OPEN_KEY = "wt_chat_open";

function load(): Msg[] {
  try {
    const raw = JSON.parse(sessionStorage.getItem(STORE_KEY) ?? "[]") as unknown;
    return Array.isArray(raw) ? raw.filter((m): m is Msg => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string").slice(-24) : [];
  } catch {
    return [];
  }
}
function save(msgs: Msg[]): void {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-24)));
  } catch {
    // Không lưu được cũng không sao.
  }
}

/** Dựng chữ trợ lý: xuống dòng, gạch đầu dòng, **đậm**, và link nội bộ [tên](/duong-dan). Không chèn HTML. */
export function renderAssistant(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const lines = text.split("\n");
  lines.forEach((line, li) => {
    const isBullet = /^\s*[-•]\s+/.test(line);
    const body = isBullet ? line.replace(/^\s*[-•]\s+/, "") : line;
    const parts: ReactNode[] = [];
    const re = /\[([^\]]{1,120})\]\((\/[^\s)]{0,200})\)|\*\*([^*]{1,120})\*\*/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body))) {
      if (m.index > last) parts.push(body.slice(last, m.index));
      if (m[1] !== undefined && m[2] !== undefined) {
        parts.push(
          <a key={`${li}-${m.index}`} href={m[2]} className="font-semibold text-primary underline underline-offset-2">
            {m[1]}
          </a>,
        );
      } else if (m[3] !== undefined) {
        parts.push(<strong key={`${li}-${m.index}`}>{m[3]}</strong>);
      }
      last = m.index + m[0].length;
    }
    if (last < body.length) parts.push(body.slice(last));
    out.push(
      isBullet ? (
        <span key={li} className="block pl-3 -indent-3">
          • {parts}
        </span>
      ) : (
        <span key={li} className="block min-h-[1em]">
          {parts}
        </span>
      ),
    );
  });
  return out;
}

export function ChatWidget({ settings, brandName }: { settings: PublicSettings; brandName: string }) {
  const bot = settings.chatbot;
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Khôi phục hội thoại và trạng thái mở từ sessionStorage sau khi trang hiện.
  useEffect(() => {
    const saved = load();
    // Màn hình rộng thì mở lại khung như trước khi chuyển trang; điện thoại thì giữ lịch sử nhưng khung đóng để không che nội dung.
    let wasOpen = false;
    try {
      wasOpen = sessionStorage.getItem(OPEN_KEY) === "1" && window.matchMedia("(min-width: 640px)").matches;
    } catch {
      wasOpen = false;
    }
    if (saved.length || wasOpen) {
      // Chuyển sang vòng lặp sau để không đổi state ngay trong effect.
      const t = setTimeout(() => {
        setMsgs(saved);
        setOpen(wasOpen);
      }, 0);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(OPEN_KEY, open ? "1" : "0");
    } catch {
      // bỏ qua
    }
  }, [open]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, waiting, open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content }];
    setMsgs(next);
    save(next);
    setDraft("");
    setBusy(true);
    setWaiting(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let answer = "";
    const push = (final = false) => {
      const list: Msg[] = [...next, { role: "assistant", content: answer }];
      setMsgs(list);
      if (final) save(list);
    };
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/x-ndjson" },
        body: JSON.stringify({ messages: next.slice(-12), path: window.location.pathname }),
        credentials: "same-origin",
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => null)) as { detail?: string } | null;
        answer = body?.detail ?? "Trợ lý chưa trả lời được. Anh/chị thử lại sau ạ.";
        push(true);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line) as { type: string; text?: string; detail?: string };
          if (ev.type === "delta" && ev.text) {
            setWaiting(false);
            answer += ev.text;
            push();
          } else if (ev.type === "error") {
            setWaiting(false);
            answer = answer || ev.detail || "Trợ lý chưa trả lời được.";
            push();
          }
        }
      }
      push(true);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        answer = answer || "Mất kết nối. Anh/chị thử gửi lại ạ.";
        push(true);
      }
    } finally {
      setBusy(false);
      setWaiting(false);
      abortRef.current = null;
    }
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(draft);
    }
  }
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(draft);
  }
  function clear() {
    abortRef.current?.abort();
    setMsgs([]);
    save([]);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="wt-chat-panel"
        className="chat-launcher"
      >
        <Icon name="chat" className="size-5" />
        {open ? "Đóng trợ lý" : bot.name}
      </button>

      <section id="wt-chat-panel" aria-label={`Trợ lý ${bot.name}`} className={`chat-panel ${open ? "chat-open" : ""}`} hidden={!open}>
        <header className="chat-head">
          <b className="flex-1 text-sm">
            Trợ lý · {bot.name}
          </b>
          <button type="button" onClick={clear} className="text-xs underline underline-offset-2">Xóa hội thoại</button>
          <button type="button" onClick={() => setOpen(false)} className="ml-1 flex size-8 items-center justify-center rounded-full hover:bg-white/15" aria-label="Đóng">
            <Icon name="close" className="size-5" />
          </button>
        </header>

        <div ref={logRef} className="chat-log" role="log" aria-live="polite" aria-relevant="additions">
          <div className="chat-m chat-a">{renderAssistant(bot.greeting)}</div>
          {msgs.length === 0 && bot.suggestions.length ? (
            <div className="flex flex-wrap gap-1.5">
              {bot.suggestions.map((s) => (
                <button key={s} type="button" onClick={() => void send(s)} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs text-ink hover:border-primary hover:text-primary">
                  {s}
                </button>
              ))}
            </div>
          ) : null}
          {msgs.map((m, i) => (
            <div key={i} className={`chat-m ${m.role === "user" ? "chat-u" : "chat-a"}`}>
              {m.role === "user" ? m.content : renderAssistant(m.content)}
            </div>
          ))}
          {waiting ? <p className="chat-n">Đang trả lời…</p> : null}
        </div>

        <form onSubmit={onSubmit} className="chat-form">
          <label htmlFor="wt-chat-in" className="sr-only">Nhắn cho trợ lý</label>
          <textarea
            id="wt-chat-in"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            placeholder="Hỏi về tour, vé, đoàn…"
            rows={1}
            maxLength={2000}
            className="chat-in"
          />
          <button type="submit" disabled={busy || !draft.trim()} className="chat-send">Gửi</button>
        </form>
        <p className="px-3 pb-2 text-[11px] text-muted">
          Trợ lý gợi ý theo dữ liệu của {brandName}; đặt chỗ và thanh toán thực hiện trên trang tour. Không gửi số giấy tờ qua chat.
        </p>
      </section>
    </>
  );
}
