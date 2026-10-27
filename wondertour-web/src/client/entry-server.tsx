import { renderToString } from "react-dom/server";
import type { AppData } from "../shared/routes";
import { App } from "./App";

/** Dựng trang phía máy chủ: HTML đủ nội dung ngay lần tải đầu cho Google và điện thoại chậm. */
export function render(data: AppData): string {
  return renderToString(<App data={data} />);
}
