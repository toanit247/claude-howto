// Cấu hình web. Hai nơi cất:
// - "xtravelos": GET/PUT /public/v1/site-settings trên xTravelOS; web chỉ giữ bản tạm trong bộ nhớ. Không cần Volume.
// - "file": một tệp JSON trên máy chủ web (ghi tạm rồi đổi tên để không có tệp hỏng dở). Railway cần Volume.
// Chọn bằng SETTINGS_SOURCE; mặc định "file" cho tới khi xTravelOS mở đầu API.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { BrandConfig } from "../shared/brand";
import { defaultSettings, SiteSettings } from "../shared/settings";
import { log } from "./logger";
import { UpstreamError, type XTravelClient } from "./xtravel";

export type SettingsSource = "file" | "xtravelos";
const REMOTE_TTL_MS = 60_000;

export class SettingsStore {
  private current: SiteSettings;
  private readonly defaults: SiteSettings;
  private remoteLoadedAt = 0;
  private inflight: Promise<SiteSettings> | null = null;

  constructor(
    readonly source: SettingsSource,
    private readonly file: string,
    brand: BrandConfig,
    private readonly api: XTravelClient | null = null,
  ) {
    this.defaults = defaultSettings(brand.services.map((s) => ({ ...s, enabled: true })));
    this.current = this.defaults;
    if (source === "file") this.current = this.readFile();
  }

  private merge(parsed: SiteSettings): SiteSettings {
    // Khối mới thêm vào mã mà bản lưu chưa có thì bật mặc định.
    return { ...parsed, features: { ...this.defaults.features, ...parsed.features } };
  }

  private readFile(): SiteSettings {
    try {
      const parsed = SiteSettings.safeParse(JSON.parse(readFileSync(this.file, "utf8")));
      if (parsed.success) return this.merge(parsed.data);
      log.warn("tệp cấu hình web không hợp lệ, dùng mặc định", { file: this.file, issue: parsed.error.issues[0]?.path.join(".") ?? "" });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") log.warn("không đọc được tệp cấu hình web, dùng mặc định", { file: this.file });
    }
    return this.defaults;
  }

  /** Bản đang có trong bộ nhớ, dùng cho mọi yêu cầu trang (không chờ mạng). */
  peek(): SiteSettings {
    if (this.source === "xtravelos" && Date.now() - this.remoteLoadedAt > REMOTE_TTL_MS) void this.refresh();
    return this.current;
  }

  /** Bản mới nhất: với xTravelOS thì hỏi lại khi bản tạm quá hạn. */
  async get(): Promise<SiteSettings> {
    if (this.source === "xtravelos" && Date.now() - this.remoteLoadedAt > REMOTE_TTL_MS) await this.refresh();
    return this.current;
  }

  /** Tải lại từ xTravelOS; 404 nghĩa là chưa lưu gì, giữ mặc định. Lỗi mạng thì giữ bản đang có. */
  async refresh(): Promise<SiteSettings> {
    const api = this.api;
    if (this.source !== "xtravelos" || !api) return this.current;
    if (this.inflight) return this.inflight;
    this.inflight = (async () => {
      try {
        const remote = await api.call("/site-settings", SiteSettings);
        this.current = this.merge(remote);
        this.remoteLoadedAt = Date.now();
      } catch (err) {
        if (err instanceof UpstreamError && err.status === 404) {
          this.current = this.defaults;
          this.remoteLoadedAt = Date.now();
        } else {
          log.warn("không tải được cấu hình web từ xTravelOS, giữ bản đang có", { name: err instanceof Error ? err.name : "unknown" });
          // Không đợi lâu trước khi thử lại, nhưng cũng không hỏi dồn dập.
          this.remoteLoadedAt = Date.now() - REMOTE_TTL_MS + 5_000;
        }
      } finally {
        this.inflight = null;
      }
      return this.current;
    })();
    return this.inflight;
  }

  /** Kiểm rồi ghi; trả về bản đã lưu. Ném lỗi zod nếu dữ liệu sai; ném UpstreamError nếu xTravelOS từ chối. */
  async save(input: unknown, staffToken: string | null): Promise<SiteSettings> {
    const next = SiteSettings.parse({ ...(input as object), version: 1, updatedAt: new Date().toISOString() });
    if (this.source === "xtravelos" && this.api) {
      await this.api.callNoContent("/site-settings", { method: "PUT", body: next, session: staffToken ?? undefined });
      this.current = next;
      this.remoteLoadedAt = Date.now();
      return next;
    }
    mkdirSync(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(next, null, 2) + "\n", { mode: 0o600 });
    renameSync(tmp, this.file);
    this.current = next;
    return next;
  }

  /** xTravelOS báo cấu hình đổi (ai đó sửa trong ERP): hỏi lại ngay. */
  invalidate(): void {
    this.remoteLoadedAt = 0;
  }
}
