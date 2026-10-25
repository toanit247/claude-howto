// Gọi API công khai xTravelOS (/public/v1). Khóa dịch vụ chỉ nằm ở đây, phía máy chủ.
import { Readable } from "node:stream";
import type { z } from "zod";
import { ApiErrorBody } from "../shared/schemas";
import { log } from "./logger";

const DEFAULT_DETAIL: Record<number, string> = {
  400: "Yêu cầu chưa đúng.",
  401: "Phiên đăng nhập đã hết, vui lòng đăng nhập lại.",
  403: "Tài khoản không có quyền làm việc này.",
  404: "Không tìm thấy dữ liệu.",
  409: "Chỗ vừa hết hoặc dữ liệu đã thay đổi, vui lòng chọn lại.",
  422: "Thông tin gửi lên chưa đúng.",
  429: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.",
};

export const MAINTENANCE_DETAIL = "Hệ thống đặt chỗ đang bảo trì, vui lòng quay lại sau ít phút.";

/** xTravelOS trả lỗi nghiệp vụ (4xx) kèm thông báo tiếng Việt hiển thị được. */
export class UpstreamError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
  ) {
    super(`xTravelOS ${status}`);
  }
}

/** xTravelOS không trả lời, lỗi 5xx, hoặc trả dữ liệu sai hợp đồng: web chuyển sang báo bảo trì. */
export class UpstreamUnavailable extends Error {}

export interface CallOptions {
  method?: "GET" | "POST";
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  session?: string | undefined;
  idempotencyKey?: string | undefined;
  headers?: Record<string, string>;
}

export class XTravelClient {
  private downUntil = 0;

  constructor(
    private readonly cfg: { baseUrl: string; apiKey: string; timeoutMs: number },
    private readonly onDown: () => void = () => {},
    private readonly downForMs = 15_000,
  ) {}

  isDown(): boolean {
    return Date.now() < this.downUntil;
  }

  private markDown(reason: string, path: string): never {
    if (!this.isDown()) log.error("xTravelOS không khả dụng, chuyển sang bảo trì", { reason, path });
    this.downUntil = Date.now() + this.downForMs;
    this.onDown();
    throw new UpstreamUnavailable(reason);
  }

  private url(path: string, query?: CallOptions["query"]): string {
    const u = new URL(`${this.cfg.baseUrl}/public/v1${path}`);
    for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== "") u.searchParams.set(k, String(v));
    return u.toString();
  }

  private async send(path: string, opts: CallOptions, accept: string): Promise<Response> {
    const headers: Record<string, string> = {
      authorization: `Bearer ${this.cfg.apiKey}`,
      accept,
      "user-agent": "wondertour-web/1",
      ...opts.headers,
    };
    if (opts.session) headers["x-session-token"] = opts.session;
    if (opts.idempotencyKey) headers["idempotency-key"] = opts.idempotencyKey;
    if (opts.body !== undefined) headers["content-type"] = "application/json";
    try {
      return await fetch(this.url(path, opts.query), {
        method: opts.method ?? "GET",
        headers,
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        signal: AbortSignal.timeout(this.cfg.timeoutMs),
        redirect: "error",
      });
    } catch (err) {
      return this.markDown(err instanceof Error ? err.name : "network", path);
    }
  }

  private async fail(res: Response, path: string): Promise<never> {
    if (res.status >= 500) return this.markDown(`http ${res.status}`, path);
    let detail = DEFAULT_DETAIL[res.status] ?? "Không xử lý được yêu cầu.";
    const body = ApiErrorBody.safeParse(await res.json().catch(() => null));
    if (body.success) detail = body.data.detail;
    throw new UpstreamError(res.status, detail);
  }

  /** Gọi một đầu API và kiểm dữ liệu trả về theo hợp đồng trước khi dùng. */
  async call<S extends z.ZodType>(path: string, schema: S, opts: CallOptions = {}): Promise<z.infer<S>> {
    const res = await this.send(path, opts, "application/json");
    if (!res.ok) return this.fail(res, path);
    const parsed = schema.safeParse(await res.json().catch(() => undefined));
    if (!parsed.success) {
      log.error("xTravelOS trả dữ liệu sai hợp đồng", {
        path,
        issue: parsed.error.issues[0]?.path.join(".") ?? "",
      });
      throw new UpstreamUnavailable("contract");
    }
    return parsed.data;
  }

  /** Gọi đầu API không cần thân trả về (204). */
  async callNoContent(path: string, opts: CallOptions = {}): Promise<void> {
    const res = await this.send(path, opts, "application/json");
    if (!res.ok) return this.fail(res, path);
    await res.body?.cancel();
  }

  /** Lấy ảnh dưới dạng luồng để chuyển tiếp cho trình duyệt. */
  async media(id: string, width: number, format: string): Promise<{ type: string; body: Readable } | null> {
    const res = await this.send(`/media/${encodeURIComponent(id)}`, { query: { w: width, format } }, "image/*");
    if (res.status === 404) return null;
    if (!res.ok) return this.fail(res, "/media");
    const type = res.headers.get("content-type") ?? "";
    if (!/^image\/(avif|webp|jpeg|png|svg\+xml)$/.test(type.split(";")[0] ?? "") || !res.body) {
      await res.body?.cancel();
      return null;
    }
    return { type, body: Readable.fromWeb(res.body as import("node:stream/web").ReadableStream) };
  }
}
