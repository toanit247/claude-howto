// Bản tạm trong bộ nhớ, có hạn và có nhãn để xTravelOS báo đổi thì xóa đúng trang.
// Không phải nơi lưu dữ liệu: mất khi khởi động lại, và bị xóa sạch khi xTravelOS mất kết nối.

interface Entry {
  value: unknown;
  expiresAt: number;
  tags: string[];
}

export class TtlCache {
  private entries = new Map<string, Entry>();
  private inflight = new Map<string, Promise<unknown>>();

  constructor(
    private readonly maxEntries = 2000,
    private readonly now: () => number = Date.now,
  ) {}

  get<T>(key: string): T | undefined {
    const e = this.entries.get(key);
    if (!e) return undefined;
    if (e.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return e.value as T;
  }

  set(key: string, value: unknown, ttlMs: number, tags: string[] = []): void {
    if (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    this.entries.set(key, { value, expiresAt: this.now() + ttlMs, tags });
  }

  /** Lấy từ bản tạm, chưa có thì gọi loader một lần cho mọi yêu cầu đồng thời cùng khóa. */
  async wrap<T>(key: string, ttlMs: number, tags: string[], loader: () => Promise<T>): Promise<T> {
    const hit = this.get<T>(key);
    if (hit !== undefined) return hit;
    const pending = this.inflight.get(key);
    if (pending) return pending as Promise<T>;
    const p = loader()
      .then((v) => {
        this.set(key, v, ttlMs, tags);
        return v;
      })
      .finally(() => this.inflight.delete(key));
    this.inflight.set(key, p);
    return p;
  }

  purgeTag(tag: string): number {
    let n = 0;
    for (const [k, e] of this.entries) {
      if (e.tags.includes(tag)) {
        this.entries.delete(k);
        n++;
      }
    }
    return n;
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}
