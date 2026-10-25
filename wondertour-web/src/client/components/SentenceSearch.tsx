// Câu tìm tour: thay ô tìm kiếm và bộ lọc bằng một câu điền chỗ trống.
// "Tôi muốn đi [đâu đó] vào [tháng nào] cùng [ai], ngân sách [bao nhiêu]." Câu chính là bộ lọc;
// gửi bằng GET để trang kết quả có đường dẫn riêng. Số tour khớp hỏi máy chủ web mỗi khi câu đổi.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { formatMoney, monthLabel } from "../../shared/format";
import { PARTIES, PARTY_KEYS, type PartyKey } from "../../shared/party";
import { BUDGETS } from "../../shared/routes";
import type { ProductFilter, ProductList } from "../../shared/schemas";
import { Icon } from "../icons";
import { api } from "../lib/api";
import { useBrowserValue } from "../lib/hooks";

type Slot = "where" | "when" | "who" | "budget";

interface Choice {
  q: string;
  destination: string;
  category: string;
  month: string;
  party: PartyKey | "";
  budget: string;
}

const EMPTY: Choice = { q: "", destination: "", category: "", month: "", party: "", budget: "" };
const SAVED_KEY = "wt_sentence";
export const PARTY_KEY = "wt_party";
const CATEGORY_LABEL: Record<string, string> = { "trong-nuoc": "trong nước", "nuoc-ngoai": "nước ngoài" };

function fromFilter(f: Partial<ProductFilter>): Choice {
  const budget = BUDGETS.find((b) => b.min === (f.minPrice ?? -1) && b.max === (f.maxPrice ?? null));
  return {
    q: f.q ?? "",
    destination: f.destination ?? "",
    category: f.category && CATEGORY_LABEL[f.category] ? f.category : "",
    month: f.month ?? "",
    party: f.party ?? "",
    budget: budget?.value ?? "",
  };
}

function parseSaved(raw: string): Choice {
  try {
    const o = JSON.parse(raw) as Partial<Choice>;
    const c: Choice = { ...EMPTY };
    for (const k of Object.keys(EMPTY) as (keyof Choice)[]) {
      const v = o[k];
      if (typeof v === "string" && v.length <= 80) (c as Record<keyof Choice, string>)[k] = v;
    }
    if (c.party && !(c.party in PARTIES)) c.party = "";
    return c;
  } catch {
    return EMPTY;
  }
}

export function toQuery(c: Choice): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(c)) if (v) p.set(k, v);
  return p;
}

function isEmpty(c: Choice): boolean {
  return Object.values(c).every((v) => !v);
}

function budgetLabel(b: (typeof BUDGETS)[number]): string {
  if (b.max === null) return `từ ${formatMoney(b.min)}`;
  if (b.min === 0) return `dưới ${formatMoney(b.max)}`;
  return `${formatMoney(b.min)} đến ${formatMoney(b.max)}`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function SentenceSearch({
  facets,
  months,
  filter,
  tone,
  subtitle,
}: {
  facets: ProductList["facets"];
  months: string[];
  filter?: Partial<ProductFilter>;
  tone: "dark" | "light";
  subtitle?: ReactNode;
}) {
  const fromProps = filter ? fromFilter(filter) : EMPTY;
  // Nhớ câu lần trước trong trình duyệt của người xem; có bộ lọc trên đường dẫn thì ưu tiên đường dẫn.
  const saved = useBrowserValue(() => localStorage.getItem(SAVED_KEY) ?? "", "");
  const base = !isEmpty(fromProps) ? fromProps : saved ? parseSaved(saved) : EMPTY;
  const [edits, setEdits] = useState<Partial<Choice> | null>(null);
  const choice: Choice = { ...base, ...edits };
  const [open, setOpen] = useState<Slot | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const set = (patch: Partial<Choice>) => {
    setEdits((e) => ({ ...e, ...patch }));
    setOpen(null);
  };

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const query = toQuery(choice).toString();
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      api<ProductList>(`/products?${query}&pageSize=1`)
        .then((r) => alive && setCount(r.total))
        .catch(() => alive && setCount(null));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  const destinationName = facets.destinations.find((d) => d.slug === choice.destination)?.name ?? "";
  const whereLabel = choice.q || destinationName || (choice.category ? CATEGORY_LABEL[choice.category] : "") || "";
  const whenLabel = choice.month ? monthLabel(choice.month) : "";
  const whoLabel = choice.party ? PARTIES[choice.party].label : "";
  const budgetChoice = BUDGETS.find((b) => b.value === choice.budget);
  const budgetText = budgetChoice ? budgetLabel(budgetChoice) : "";

  const submit = () => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(choice));
      if (choice.party) localStorage.setItem(PARTY_KEY, choice.party);
    } catch {
      // Không lưu được cũng không sao.
    }
    window.location.href = `/tour?${query}`;
  };

  const sentence = `Tôi muốn đi ${whereLabel || "đâu đó"}${whenLabel ? ` vào ${whenLabel}` : ""}${whoLabel ? ` cùng ${whoLabel}` : ""}${budgetText ? `, ngân sách ${budgetText}` : ""}`;
  const dark = tone === "dark";

  return (
    <div className={dark ? "text-white" : "text-ink"}>
      <h1 className={`sentence ${dark ? "sentence-dark" : "sentence-light"}`}>
        Tôi muốn đi{" "}
        <Blank slot="where" label="Nơi đến" value={whereLabel} placeholder="đâu đó" onOpen={setOpen} />
        {" "}vào{" "}
        <Blank slot="when" label="Thời gian" value={whenLabel} placeholder="tháng nào" onOpen={setOpen} />
        {" "}cùng{" "}
        <Blank slot="who" label="Đi cùng" value={whoLabel} placeholder="ai" onOpen={setOpen} />
        , ngân sách{" "}
        <Blank slot="budget" label="Ngân sách" value={budgetText} placeholder="bao nhiêu" onOpen={setOpen} />
        .
      </h1>
      {subtitle}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="button" onClick={submit} className={`btn w-full sm:w-auto ${dark ? "bg-white text-primary hover:bg-soft" : "btn-primary"}`}>
          <Icon name="search" />
          {count === null ? "Xem tour phù hợp" : count === 0 ? "Chưa có tour khớp, xem gợi ý" : `Xem ${count} tour phù hợp`}
        </button>
        {choice.party === "company" || count === 0 ? (
          <a
            href={`/lien-he?nhu-cau=${encodeURIComponent(sentence)}`}
            className={`inline-flex min-h-11 items-center justify-center text-sm font-semibold underline-offset-4 hover:underline ${dark ? "text-soft" : "text-primary"}`}
          >
            {choice.party === "company" ? "Nhận báo giá riêng cho đoàn" : "Nhờ thiết kế tour riêng"}
          </a>
        ) : !isEmpty(choice) ? (
          <button type="button" onClick={() => set({ ...EMPTY })} className={`inline-flex min-h-11 items-center text-sm ${dark ? "text-white/75 hover:text-white" : "text-muted hover:text-ink"}`}>
            Xóa lựa chọn
          </button>
        ) : null}
      </div>

      <dialog
        ref={dialog}
        className="sheet"
        aria-label={open ? SLOT_TITLE[open] : undefined}
        onClose={() => setOpen(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setOpen(null);
        }}
      >
        {open ? (
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-lg font-extrabold">{SLOT_TITLE[open]}</p>
              <button type="button" onClick={() => setOpen(null)} className="flex size-11 items-center justify-center rounded-full hover:bg-mist" aria-label="Đóng">
                <Icon name="close" className="size-6" />
              </button>
            </div>
            <div className="mt-3">
              {open === "where" ? (
                <WherePicker choice={choice} facets={facets} onPick={set} />
              ) : open === "when" ? (
                <Options
                  options={[{ value: "", label: "Tháng nào cũng được" }, ...months.map((m) => ({ value: m, label: cap(monthLabel(m)) }))]}
                  current={choice.month}
                  onPick={(month) => set({ month })}
                  cols={3}
                />
              ) : open === "who" ? (
                <Options
                  options={[{ value: "", label: "Chưa rõ" }, ...PARTY_KEYS.map((k) => ({ value: k, label: cap(PARTIES[k].label), hint: PARTIES[k].hint }))]}
                  current={choice.party}
                  onPick={(party) => set({ party: party as PartyKey | "" })}
                />
              ) : (
                <Options
                  options={[{ value: "", label: "Mọi mức giá" }, ...BUDGETS.map((b) => ({ value: b.value, label: cap(budgetLabel(b)), hint: "mỗi khách" }))]}
                  current={choice.budget}
                  onPick={(budget) => set({ budget })}
                />
              )}
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}

const SLOT_TITLE: Record<Slot, string> = { where: "Bạn muốn đi đâu?", when: "Đi vào tháng nào?", who: "Đi cùng ai?", budget: "Ngân sách mỗi khách" };

function Blank({
  slot,
  label,
  value,
  placeholder,
  onOpen,
}: {
  slot: Slot;
  label: string;
  value: string;
  placeholder: string;
  onOpen: (s: Slot) => void;
}) {
  return (
    <button
      type="button"
      className={`blank ${value ? "blank-filled" : ""}`}
      aria-haspopup="dialog"
      aria-label={`${label}: ${value || "chưa chọn"}`}
      onClick={() => onOpen(slot)}
    >
      {value || placeholder}
    </button>
  );
}

function Options({
  options,
  current,
  onPick,
  cols = 1,
}: {
  options: { value: string; label: string; hint?: string }[];
  current: string;
  onPick: (value: string) => void;
  cols?: 1 | 3;
}) {
  return (
    <ul className={`grid gap-2 ${cols === 3 ? "grid-cols-2 sm:grid-cols-3" : ""}`} role="listbox" aria-label="Lựa chọn">
      {options.map((o) => (
        <li key={o.value} role="option" aria-selected={o.value === current}>
          <button
            type="button"
            onClick={() => onPick(o.value)}
            className={`w-full rounded-xl border px-3 py-2.5 text-left ${o.value === current ? "border-primary bg-mist text-primary" : "border-line hover:border-primary"}`}
          >
            <span className="block font-semibold">{o.label}</span>
            {o.hint ? <span className="block text-xs text-muted">{o.hint}</span> : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

function WherePicker({ choice, facets, onPick }: { choice: Choice; facets: ProductList["facets"]; onPick: (p: Partial<Choice>) => void }) {
  const [text, setText] = useState(choice.q);
  const applyText = () => onPick({ q: text.trim(), destination: "", category: "" });
  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyText();
        }}
        className="flex gap-2"
      >
        <label htmlFor="where-text" className="sr-only">Gõ tên nơi muốn đi</label>
        <input
          id="where-text"
          type="search"
          enterKeyHint="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Gõ tên nơi muốn đi…"
          className="field"
          autoComplete="off"
          maxLength={80}
        />
        <button type="submit" className="btn-ghost shrink-0">Dùng</button>
      </form>
      <Options
        options={[
          { value: "", label: "Mọi nơi" },
          { value: "cat:trong-nuoc", label: "Trong nước" },
          { value: "cat:nuoc-ngoai", label: "Nước ngoài" },
        ]}
        current={choice.category ? `cat:${choice.category}` : choice.q || choice.destination ? "-" : ""}
        onPick={(v) => onPick({ q: "", destination: "", category: v.replace("cat:", "") })}
        cols={3}
      />
      <Options
        options={facets.destinations.map((d) => ({ value: d.slug, label: d.name }))}
        current={choice.destination}
        onPick={(destination) => onPick({ q: "", destination, category: "" })}
        cols={3}
      />
    </div>
  );
}
