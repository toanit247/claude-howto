// Trình duyệt chỉ gọi máy chủ web (/api); không bao giờ gọi thẳng xTravelOS.

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Mỗi lần bấm nút tạo một mã mới; bấm lại khi mạng chập chờn thì dùng lại mã cũ để không tạo trùng. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

export async function api<T>(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown; idempotencyKey?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (init.body !== undefined) headers["content-type"] = "application/json";
  if (init.idempotencyKey) headers["idempotency-key"] = init.idempotencyKey;
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, "Mất kết nối mạng. Kiểm tra mạng rồi bấm lại, đơn sẽ không bị tạo trùng.");
  }
  if (res.status === 204) return undefined as T;
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const detail =
      body && typeof body === "object" && "detail" in body && typeof body.detail === "string"
        ? body.detail
        : "Có lỗi xảy ra, vui lòng thử lại.";
    throw new ApiError(res.status, detail);
  }
  return body as T;
}
