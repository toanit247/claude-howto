import type { ReactNode } from "react";
import { formatMoney } from "../../shared/format";
import { mediaUrl, MEDIA_WIDTHS } from "../../shared/routes";
import type { Media } from "../../shared/schemas";
import { Icon } from "../icons";

/** Ảnh qua máy chủ web: AVIF, WebP, nhiều cỡ theo màn hình, tải lười trừ ảnh đầu trang. */
export function Picture({
  media,
  sizes,
  className = "",
  priority = false,
}: {
  media: Media;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const srcset = (f: "avif" | "webp") => MEDIA_WIDTHS.map((w) => `${mediaUrl(media.id, w, f)} ${w}w`).join(", ");
  return (
    <picture>
      <source type="image/avif" srcSet={srcset("avif")} sizes={sizes} />
      <img
        src={mediaUrl(media.id, 768, "webp")}
        srcSet={srcset("webp")}
        sizes={sizes}
        width={media.width ?? undefined}
        height={media.height ?? undefined}
        alt={media.alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={className}
      />
    </picture>
  );
}

/** Giá luôn đủ số, ghi rõ mỗi khách và đã gồm hay chưa gồm thuế GTGT. */
export function Price({
  amount,
  vatIncluded,
  compareAt,
  size = "md",
  prefix,
}: {
  amount: number;
  vatIncluded: boolean;
  compareAt?: number | null;
  size?: "md" | "lg";
  prefix?: string;
}) {
  return (
    <div>
      {compareAt && compareAt > amount ? (
        <s className="tabular text-sm text-muted" aria-label={`Giá cũ ${formatMoney(compareAt)}`}>
          {formatMoney(compareAt)}
        </s>
      ) : null}
      <p className={`tabular font-extrabold text-primary ${size === "lg" ? "text-3xl" : "text-xl"}`}>
        {prefix ? <span className="mr-1 text-sm font-semibold text-muted">{prefix}</span> : null}
        {formatMoney(amount)}
      </p>
      <p className="text-xs text-muted">mỗi khách, {vatIncluded ? "đã gồm" : "chưa gồm"} thuế GTGT</p>
    </div>
  );
}

export function Alert({ tone, children }: { tone: "error" | "info" | "success"; children: ReactNode }) {
  const styles = {
    error: "border-accent bg-soft/40 text-accent-ink",
    info: "border-line bg-mist text-ink",
    success: "border-primary bg-mist text-primary-strong",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex gap-2 rounded-lg border-l-4 p-3 text-sm ${styles}`}>
      <Icon name={tone === "error" ? "warning" : tone === "success" ? "check" : "doc"} className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Đường dẫn" className="text-sm text-muted">
      <ol className="flex flex-wrap gap-x-2">
        {items.map((it, i) => (
          <li key={it.label} className="flex gap-2">
            {i > 0 ? <span aria-hidden="true">/</span> : null}
            {it.href ? (
              <a href={it.href} className="hover:text-primary hover:underline">
                {it.label}
              </a>
            ) : (
              <span aria-current="page">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Consent({
  brand,
  purpose,
  consent,
  marketing,
  onConsent,
  onMarketing,
}: {
  brand: string;
  purpose: string;
  consent: boolean;
  marketing: boolean;
  onConsent: (v: boolean) => void;
  onMarketing: (v: boolean) => void;
}) {
  return (
    <div className="space-y-2 text-sm">
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-[var(--brand-primary)]"
          checked={consent}
          onChange={(e) => onConsent(e.target.checked)}
          required
        />
        <span>
          Tôi đồng ý để {brand} dùng thông tin trên {purpose}, theo{" "}
          <a href="/chinh-sach-quyen-rieng-tu" className="text-primary underline">
            chính sách quyền riêng tư
          </a>
          .
        </span>
      </label>
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-[var(--brand-primary)]"
          checked={marketing}
          onChange={(e) => onMarketing(e.target.checked)}
        />
        <span>Tôi muốn nhận tin ưu đãi và tour mới qua email, Zalo (không bắt buộc).</span>
      </label>
    </div>
  );
}
