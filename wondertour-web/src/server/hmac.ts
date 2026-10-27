import { createHmac, timingSafeEqual } from "node:crypto";

export const SIGNATURE_HEADER = "x-xtravel-signature";
export const TIMESTAMP_HEADER = "x-xtravel-timestamp";
const MAX_SKEW_SECONDS = 300;

export function sign(secret: string, timestamp: string, rawBody: Buffer | string): string {
  return "sha256=" + createHmac("sha256", secret).update(`${timestamp}.`).update(rawBody).digest("hex");
}

/** Kiểm chữ ký xTravelOS gửi kèm báo đổi nội dung; chặn gửi lại bản cũ quá 5 phút. */
export function verify(
  secret: string,
  timestamp: string | undefined,
  signature: string | undefined,
  rawBody: Buffer,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (!timestamp || !signature || !/^\d{10}$/.test(timestamp)) return false;
  if (Math.abs(nowSeconds - Number(timestamp)) > MAX_SKEW_SECONDS) return false;
  const expected = Buffer.from(sign(secret, timestamp, rawBody));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
