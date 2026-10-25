// Ảnh bìa trang. Có ảnh thật (từ thư viện ảnh xTravelOS) thì hiện ảnh; chưa có thì hiện bìa theo màu thương hiệu
// với đường núi vẽ bằng SVG, để trang không bao giờ trống trơn.
import type { ReactNode } from "react";
import type { Media } from "../../shared/schemas";
import { mediaUrl } from "../../shared/routes";

export function PageCover({ eyebrow, title, lead, image, children }: { eyebrow?: string; title: string; lead?: string; image?: Media | null; children?: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden bg-primary text-white">
      {image ? (
        <img
          src={mediaUrl(image.id, 1440, "webp")}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 size-full object-cover opacity-40"
          loading="eager"
        />
      ) : null}
      <svg aria-hidden="true" viewBox="0 0 1440 240" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 -z-10 h-24 w-full text-[var(--brand-accent)] opacity-20 sm:h-32">
        <path fill="currentColor" d="M0 240 L0 170 L140 110 L260 160 L420 60 L560 150 L700 90 L860 170 L1000 80 L1160 150 L1300 100 L1440 150 L1440 240 Z" />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 1440 240" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 -z-10 h-16 w-full text-[var(--brand-soft)] opacity-30 sm:h-20">
        <path fill="currentColor" d="M0 240 L0 200 L180 150 L380 190 L620 140 L840 200 L1060 150 L1260 190 L1440 160 L1440 240 Z" />
      </svg>
      <div className="wrap py-10 sm:py-16">
        {eyebrow ? <p className="text-sm font-semibold text-soft">{eyebrow}</p> : null}
        <h1 className="mt-2 max-w-3xl text-3xl text-white sm:text-5xl">{title}</h1>
        {lead ? <p className="mt-4 max-w-2xl text-lg text-white/85">{lead}</p> : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}
