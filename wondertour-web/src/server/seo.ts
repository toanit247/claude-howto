// Thẻ cho Google và mạng xã hội: tiêu đề, mô tả, canonical, Open Graph, dữ liệu có cấu trúc schema.org.
import type { AppData } from "../shared/routes";
import { mediaUrl, paths } from "../shared/routes";
import type { Media } from "../shared/schemas";
import type { AppConfig } from "./config";

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

/** JSON nằm trong <script> phải chặn được chuỗi đóng thẻ và ký tự ngắt dòng lạ. */
export function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

interface Head {
  title: string;
  description: string;
  canonicalPath: string | null;
  image: Media | null;
  type: "website" | "article" | "product";
  noindex: boolean;
  jsonLd: object[];
}

function clip(s: string, n = 160): string {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";
}

export function buildHead(data: AppData, config: AppConfig): string {
  const { brand } = data;
  const base = config.publicBaseUrl;
  const abs = (p: string) => `${base}${p}`;
  const org = {
    "@type": "TravelAgency",
    "@id": `${base}/#org`,
    name: brand.name,
    url: base,
    logo: abs(brand.logo),
    slogan: brand.slogan,
    address: { "@type": "PostalAddress", streetAddress: brand.contact.address, addressCountry: "VN" },
    ...(brand.contact.hotline ? { telephone: brand.contact.hotline } : {}),
  };
  const crumbs = (items: [string, string][]) => ({
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: abs(path) })),
  });

  const page = data.page;
  let h: Head = {
    title: `${brand.name} — ${brand.slogan}`,
    description: brand.description,
    canonicalPath: data.path,
    image: null,
    type: "website",
    noindex: false,
    jsonLd: [org],
  };

  switch (page.page) {
    case "home":
      h = { ...h, canonicalPath: "/", image: page.products[0]?.coverImage ?? null };
      break;
    case "tours":
      h = { ...h, title: `Tour du lịch — ${brand.name}`, canonicalPath: "/tour" };
      break;
    case "destination":
      h = {
        ...h,
        title: `Tour ${page.destination.name} — ${brand.name}`,
        description: clip(`Các tour ${page.destination.name} do ${brand.name} tổ chức. ${brand.description}`),
        canonicalPath: paths.destination(page.destination.slug),
        jsonLd: [org, crumbs([["Trang chủ", "/"], [page.destination.name, paths.destination(page.destination.slug)]])],
      };
      break;
    case "product": {
      const p = page.product;
      const path = paths.product(p.slug);
      h = {
        ...h,
        title: `${p.name} — ${brand.name}`,
        description: clip(p.summary),
        canonicalPath: path,
        image: p.coverImage,
        type: "product",
        jsonLd: [
          org,
          {
            "@type": "TouristTrip",
            name: p.name,
            description: p.summary,
            url: abs(path),
            ...(p.coverImage ? { image: abs(mediaUrl(p.coverImage.id, 1024, "webp")) } : {}),
            provider: { "@id": `${base}/#org` },
            itinerary: {
              "@type": "ItemList",
              itemListElement: p.itinerary.map((d) => ({
                "@type": "ListItem",
                position: d.day,
                name: `Ngày ${d.day}: ${d.title}`,
              })),
            },
            ...(p.fromPrice !== null
              ? {
                  offers: {
                    "@type": "Offer",
                    price: p.fromPrice,
                    priceCurrency: "VND",
                    url: abs(path),
                    availability: "https://schema.org/InStock",
                  },
                }
              : {}),
          },
          crumbs([
            ["Trang chủ", "/"],
            ["Tour", "/tour"],
            [p.name, path],
          ]),
        ],
      };
      break;
    }
    case "articles":
      h = { ...h, title: `Bài viết — ${brand.name}`, canonicalPath: "/bai-viet" };
      break;
    case "article": {
      const a = page.article;
      const path = paths.article(a.slug);
      h = {
        ...h,
        title: `${a.title} — ${brand.name}`,
        description: clip(a.excerpt),
        canonicalPath: path,
        image: a.cover,
        type: "article",
        jsonLd: [
          org,
          {
            "@type": "Article",
            headline: a.title,
            description: a.excerpt,
            datePublished: a.publishedAt,
            dateModified: a.updatedAt,
            author: { "@type": "Person", name: a.author },
            publisher: { "@id": `${base}/#org` },
            mainEntityOfPage: abs(path),
            ...(a.cover ? { image: abs(mediaUrl(a.cover.id, 1024, "webp")) } : {}),
          },
          crumbs([
            ["Trang chủ", "/"],
            ["Bài viết", "/bai-viet"],
            [a.title, path],
          ]),
        ],
      };
      break;
    }
    case "lookup":
      h = { ...h, title: `Tra cứu đặt chỗ — ${brand.name}`, noindex: true };
      break;
    case "contact":
      h = { ...h, title: `Liên hệ tư vấn — ${brand.name}`, canonicalPath: "/lien-he" };
      break;
    case "agent-login":
    case "agent":
      h = {
        ...h,
        title: `${data.siteKind === "alliance" ? "Cổng liên minh" : "Đại lý, cộng tác viên"} — ${brand.name}`,
        noindex: true,
        canonicalPath: null,
      };
      break;
    case "privacy":
      h = { ...h, title: `Chính sách quyền riêng tư — ${brand.name}` };
      break;
    case "not-found":
      h = { ...h, title: `Không tìm thấy trang — ${brand.name}`, noindex: true, canonicalPath: null };
      break;
    case "maintenance":
      h = { ...h, title: `Đang bảo trì — ${brand.name}`, noindex: true, canonicalPath: null };
      break;
  }

  if (data.siteKind === "alliance" || config.appEnv === "staging") h.noindex = true;

  const tags = [
    `<title>${escapeHtml(h.title)}</title>`,
    `<meta name="description" content="${escapeHtml(h.description)}">`,
    `<meta name="theme-color" content="${escapeHtml(brand.colors.primary)}">`,
    `<link rel="icon" href="${escapeHtml(brand.logo)}">`,
    h.noindex ? `<meta name="robots" content="noindex, nofollow">` : "",
    h.canonicalPath && !h.noindex ? `<link rel="canonical" href="${escapeHtml(abs(h.canonicalPath))}">` : "",
    `<meta property="og:site_name" content="${escapeHtml(brand.name)}">`,
    `<meta property="og:locale" content="vi_VN">`,
    `<meta property="og:type" content="${h.type === "article" ? "article" : "website"}">`,
    `<meta property="og:title" content="${escapeHtml(h.title)}">`,
    `<meta property="og:description" content="${escapeHtml(h.description)}">`,
    h.canonicalPath ? `<meta property="og:url" content="${escapeHtml(abs(h.canonicalPath))}">` : "",
    h.image ? `<meta property="og:image" content="${escapeHtml(abs(mediaUrl(h.image.id, 1024, "webp")))}">` : "",
    h.image ? `<meta property="og:image:alt" content="${escapeHtml(h.image.alt)}">` : "",
    `<meta name="twitter:card" content="${h.image ? "summary_large_image" : "summary"}">`,
    h.noindex
      ? ""
      : `<script type="application/ld+json">${safeJson({ "@context": "https://schema.org", "@graph": h.jsonLd })}</script>`,
  ];
  return tags.filter(Boolean).join("\n    ");
}

export function robotsTxt(config: AppConfig): string {
  if (config.siteKind === "alliance" || config.appEnv === "staging") return "User-agent: *\nDisallow: /\n";
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /dai-ly",
    "Disallow: /tra-cuu",
    `Sitemap: ${config.publicBaseUrl}/sitemap.xml`,
    "",
  ].join("\n");
}

export function sitemapXml(base: string, entries: { path: string; lastmod: string | null }[]): string {
  const urls = [{ path: "/", lastmod: null }, { path: "/tour", lastmod: null }, { path: "/bai-viet", lastmod: null }, ...entries]
    .map(
      (e) =>
        `  <url><loc>${escapeHtml(base + e.path)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}</url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** Biến màu thương hiệu: đổi doanh nghiệp chỉ cần đổi tệp brand/*.json. */
export function brandCss(config: AppConfig): string {
  const c = config.brand.colors;
  return `:root{--brand-primary:${c.primary};--brand-accent:${c.accent};--brand-soft:${c.soft};}\n`;
}
