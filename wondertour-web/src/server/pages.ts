// Lấy dữ liệu công khai cho từng trang dựng phía máy chủ.
import { z } from "zod";
import { BUDGETS, type PageData, type RouteName } from "../shared/routes";
import { ProductFilter } from "../shared/schemas";
import type { Catalog } from "./catalog";
import { UpstreamError } from "./xtravel";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export function safeNext(raw: unknown): string | null {
  return typeof raw === "string" && /^\/(?!\/)[\w\-/]*$/.test(raw) ? raw : null;
}

/** 12 tháng tới (theo giờ Việt Nam) cho ô chọn tháng khởi hành. */
export function upcomingMonths(now = new Date()): string[] {
  const vn = new Date(now.getTime() + 7 * 3600_000);
  const out: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth() + i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

function filterFromQuery(query: URLSearchParams) {
  const raw: Record<string, string> = {};
  for (const [k, v] of query) if (v !== "") raw[k] = v;
  const budget = BUDGETS.find((b) => b.value === raw.budget);
  if (budget) {
    raw.minPrice = String(budget.min);
    if (budget.max !== null) raw.maxPrice = String(budget.max);
  }
  delete raw.budget;
  const parsed = ProductFilter.safeParse(raw);
  return parsed.success ? parsed.data : ProductFilter.parse({});
}

export async function loadPage(
  route: { name: RouteName; slug: string | null },
  query: URLSearchParams,
  catalog: Catalog,
): Promise<{ status: number; page: PageData }> {
  const ok = (page: PageData) => ({ status: 200, page });
  const notFound = { status: 404, page: { page: "not-found" } as PageData };
  try {
    switch (route.name) {
      case "home": {
        const [products, deals, articles] = await Promise.all([
          catalog.listProducts({ pageSize: 9, sort: "departure" }),
          catalog.listProducts({ pageSize: 8, promo: "1" }),
          catalog.listArticles(1, 3),
        ]);
        return ok({
          page: "home",
          products: products.items,
          deals: deals.items,
          articles: articles.items,
          facets: products.facets,
          months: upcomingMonths(),
        });
      }
      case "tours": {
        const filter = filterFromQuery(query);
        return ok({ page: "tours", filter, list: await catalog.listProducts(filter), months: upcomingMonths() });
      }
      case "destination": {
        const s = route.slug ?? "";
        const page = Math.max(1, Number(query.get("page")) || 1);
        const list = await catalog.listProducts({ destination: s, page, pageSize: 24 });
        const destination = list.items.flatMap((p) => p.destinations).find((d) => d.slug === s);
        if (!destination) return notFound;
        return ok({ page: "destination", destination, list });
      }
      case "product": {
        const product = await catalog.getProduct(route.slug ?? "");
        const dest = product.destinations[0]?.slug;
        const related = dest
          ? (await catalog.listProducts({ destination: dest, pageSize: 5 })).items.filter((p) => p.slug !== product.slug)
          : [];
        return ok({ page: "product", product, related: related.slice(0, 4) });
      }
      case "articles": {
        const page = Math.max(1, Number(query.get("page")) || 1);
        return ok({ page: "articles", list: await catalog.listArticles(page) });
      }
      case "article":
        return ok({ page: "article", article: await catalog.getArticle(route.slug ?? "") });
      case "lookup":
        return ok({ page: "lookup" });
      case "contact": {
        const t = slug.safeParse(query.get("tour"));
        const need = query.get("nhu-cau")?.trim().slice(0, 60) || null;
        return ok({ page: "contact", productSlug: t.success ? t.data : null, need });
      }
      case "agent-login":
        return ok({ page: "agent-login", next: safeNext(query.get("next")) });
      case "agent":
        return ok({ page: "agent" });
      case "privacy":
        return ok({ page: "privacy" });
    }
  } catch (err) {
    if (err instanceof UpstreamError && err.status === 404) return notFound;
    throw err;
  }
}
