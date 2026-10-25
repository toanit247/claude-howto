// Nhật ký dạng JSON một dòng. Không bao giờ ghi thân yêu cầu, chuỗi truy vấn, cookie hay header xác thực.
// redact() là lớp chặn thêm: lỡ có số điện thoại, email, số giấy tờ trong chuỗi thì cũng bị che.

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const DIGITS = /\+?\d{8,12}/g;
const PASSPORT = /\b[A-Z]\d{7,8}\b/g;

export function redact(text: string): string {
  return text
    .replace(EMAIL, "[email]")
    .replace(DIGITS, (m) => (/^(\+84|0)\d{9,10}$/.test(m) ? "[sđt]" : "[số]"))
    .replace(PASSPORT, "[số]");
}

type Level = "info" | "warn" | "error";
type Fields = Record<string, string | number | boolean | null | undefined>;

function write(level: Level, msg: string, fields: Fields = {}): void {
  if (process.env.LOG_SILENT === "1") return;
  const safe: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined) continue;
    safe[k] = typeof v === "string" ? redact(v) : v;
  }
  const line = JSON.stringify({ t: new Date().toISOString(), level, msg: redact(msg), ...safe });
  (level === "error" ? process.stderr : process.stdout).write(line + "\n");
}

export const log = {
  info: (msg: string, f?: Fields) => write("info", msg, f),
  warn: (msg: string, f?: Fields) => write("warn", msg, f),
  error: (msg: string, f?: Fields) => write("error", msg, f),
};
