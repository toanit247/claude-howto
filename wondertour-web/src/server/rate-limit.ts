// Giới hạn số lượt theo khóa (IP, số điện thoại) trong một cửa sổ thời gian. Chạy trong bộ nhớ một máy;
// chạy nhiều máy thì xTravelOS vẫn là chốt chặn cuối (khóa chỗ, hạn giữ chỗ).

export class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Trả về số giây phải chờ nếu vượt giới hạn, 0 nếu được phép. */
  take(key: string): number {
    const t = this.now();
    if (this.hits.size > 50_000) this.sweep(t);
    const h = this.hits.get(key);
    if (!h || h.resetAt <= t) {
      this.hits.set(key, { count: 1, resetAt: t + this.windowMs });
      return 0;
    }
    if (h.count >= this.limit) return Math.ceil((h.resetAt - t) / 1000);
    h.count++;
    return 0;
  }

  private sweep(t: number): void {
    for (const [k, h] of this.hits) if (h.resetAt <= t) this.hits.delete(k);
  }
}
