import { useEffect, useState, useSyncExternalStore } from "react";
import type { AgentProfile } from "../../shared/schemas";
import { api } from "./api";

/** Hồ sơ đại lý/liên minh đang đăng nhập; tải sau khi trang hiện để trang công khai không phụ thuộc phiên. */
export function useSession(): { agent: AgentProfile | null; loaded: boolean } {
  const [state, setState] = useState<{ agent: AgentProfile | null; loaded: boolean }>({ agent: null, loaded: false });
  useEffect(() => {
    let alive = true;
    api<{ agent: AgentProfile | null }>("/session")
      .then((r) => alive && setState({ agent: r.agent, loaded: true }))
      .catch(() => alive && setState({ agent: null, loaded: true }));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

/** Đồng hồ chạy mỗi giây cho đếm ngược hạn giữ chỗ. */
export function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}


/**
 * Giá trị chỉ có trên trình duyệt (cookie, localStorage). Máy chủ và lần hydrate đầu dùng serverValue
 * để HTML khớp nhau; sau đó đọc giá trị thật. Hàm read phải trả chuỗi để so sánh ổn định.
 */
export function useBrowserValue(read: () => string, serverValue: string, changeEvent?: string): string {
  return useSyncExternalStore(
    (notify) => {
      if (!changeEvent) return () => {};
      window.addEventListener(changeEvent, notify);
      return () => window.removeEventListener(changeEvent, notify);
    },
    read,
    () => serverValue,
  );
}

const CITY_COOKIE = "wt_from";
const CITY_EVENT = "wt-city";

/** Nơi khởi hành người xem đã chọn ở đầu trang (cookie của chính trình duyệt, không gửi xTravelOS). */
export function useCity(): string {
  return useBrowserValue(
    () => {
      const c = document.cookie.split("; ").find((x) => x.startsWith(`${CITY_COOKIE}=`));
      return c ? decodeURIComponent(c.slice(CITY_COOKIE.length + 1)) : "";
    },
    "",
    CITY_EVENT,
  );
}

export function setCity(city: string): void {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = city
    ? `${CITY_COOKIE}=${encodeURIComponent(city)}; Max-Age=${365 * 86400}; Path=/; SameSite=Lax${secure}`
    : `${CITY_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(CITY_EVENT));
}
