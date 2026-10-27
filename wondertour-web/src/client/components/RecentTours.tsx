import { paths } from "../../shared/routes";
import { Icon } from "../icons";
import { useBrowserValue } from "../lib/hooks";
import { readRecent, type RecentTour } from "../lib/recent";

/** Tour đã xem gần đây, đọc từ trình duyệt của chính người xem. */
export function RecentTours({ exclude }: { exclude?: string }) {
  const raw = useBrowserValue(() => JSON.stringify(readRecent()), "[]");
  const items = (JSON.parse(raw) as RecentTour[]).filter((t) => t.slug !== exclude);
  if (!items.length) return null;
  return (
    <section aria-labelledby="recent-title" className="wrap mt-16">
      <h2 id="recent-title" className="flex items-center gap-2 text-xl">
        <Icon name="history" /> Tour bạn đã xem
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((t) => (
          <li key={t.slug}>
            <a href={paths.product(t.slug)} className="inline-block rounded-lg border border-line px-3 py-2 text-sm hover:border-primary hover:text-primary">
              {t.name}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
