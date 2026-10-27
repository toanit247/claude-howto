import type { AppData } from "../shared/routes";
import { safeJson } from "./seo";

export interface Renderer {
  /** Khung HTML (index.html đã qua Vite). */
  template(url: string): Promise<string>;
  /** Dựng nội dung React thành HTML. */
  render(data: AppData): Promise<string>;
}

export function htmlDocument(template: string, head: string, appHtml: string, data: AppData): string {
  // Dữ liệu cho bước hydrate nằm trong thẻ JSON (không chạy như mã), nên CSP script-src 'self' vẫn chặt.
  const dataTag = `<script type="application/json" id="__APP_DATA__">${safeJson(data)}</script>`;
  return template
    .replace("<!--app-head-->", () => head)
    .replace("<!--app-html-->", () => appHtml)
    .replace("<!--app-data-->", () => dataTag);
}
