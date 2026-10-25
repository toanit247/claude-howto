// Phiên đại lý/liên minh: mã phiên xTravelOS cấp nằm trong cookie HttpOnly, không bao giờ vào JavaScript
// của trình duyệt hay đường dẫn. Hồ sơ hiển thị (tên, công ty, luồng) nằm trong cookie ký riêng.
import type { CookieOptions, Request, Response } from "express";
import { AgentProfile } from "../shared/schemas";

export const SESSION_COOKIE = "wt_session";
export const PROFILE_COOKIE = "wt_agent";

export function readSession(req: Request): { token: string; profile: AgentProfile } | null {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  const rawProfile: unknown = req.signedCookies?.[PROFILE_COOKIE];
  if (typeof token !== "string" || token.length < 16 || typeof rawProfile !== "string") return null;
  try {
    const profile = AgentProfile.safeParse(JSON.parse(rawProfile));
    return profile.success ? { token, profile: profile.data } : null;
  } catch {
    return null;
  }
}

function base(secure: boolean): CookieOptions {
  return { httpOnly: true, secure, sameSite: "lax", path: "/" };
}

export function writeSession(
  res: Response,
  secure: boolean,
  token: string,
  profile: AgentProfile,
  expiresAt: string,
): void {
  const maxAge = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  res.cookie(SESSION_COOKIE, token, { ...base(secure), maxAge });
  res.cookie(PROFILE_COOKIE, JSON.stringify(profile), { ...base(secure), maxAge, signed: true });
}

export function clearSession(res: Response, secure: boolean): void {
  res.clearCookie(SESSION_COOKIE, base(secure));
  res.clearCookie(PROFILE_COOKIE, { ...base(secure), signed: true });
}
