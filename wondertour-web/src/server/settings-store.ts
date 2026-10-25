// Lưu cấu hình web vào một tệp JSON (ghi tạm rồi đổi tên để không bao giờ có tệp hỏng dở).
// Railway: gắn một Volume vào thư mục chứa tệp này, nếu không mỗi lần triển khai lại về mặc định.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { BrandConfig } from "../shared/brand";
import { defaultSettings, SiteSettings } from "../shared/settings";
import { log } from "./logger";

export class SettingsStore {
  private current: SiteSettings;

  constructor(
    private readonly file: string,
    brand: BrandConfig,
  ) {
    const defaults = defaultSettings(brand.services.map((s) => ({ ...s, enabled: true })));
    this.current = defaults;
    try {
      const raw = JSON.parse(readFileSync(file, "utf8")) as unknown;
      const parsed = SiteSettings.safeParse(raw);
      if (parsed.success) {
        // Khối mới thêm vào mã mà tệp cũ chưa có thì bật mặc định.
        this.current = { ...parsed.data, features: { ...defaults.features, ...parsed.data.features } };
      } else {
        log.warn("tệp cấu hình web không hợp lệ, dùng mặc định", { file, issue: parsed.error.issues[0]?.path.join(".") ?? "" });
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") log.warn("không đọc được tệp cấu hình web, dùng mặc định", { file });
    }
  }

  get(): SiteSettings {
    return this.current;
  }

  /** Kiểm rồi ghi; trả về bản đã lưu. Ném lỗi zod nếu dữ liệu sai. */
  save(input: unknown): SiteSettings {
    const next = SiteSettings.parse({ ...(input as object), version: 1, updatedAt: new Date().toISOString() });
    mkdirSync(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(next, null, 2) + "\n", { mode: 0o600 });
    renameSync(tmp, this.file);
    this.current = next;
    return next;
  }
}
