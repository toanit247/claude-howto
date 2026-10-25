// Lấy các biểu tượng Solar (kiểu Linear) đang dùng từ @iconify-json/solar thành component React.
// Chạy lại khi thêm biểu tượng: node scripts/extract-icons.mjs
import { readFileSync, writeFileSync } from "node:fs";

const NAMES = {
  pin: "map-point-linear",
  calendar: "calendar-linear",
  users: "users-group-rounded-linear",
  clock: "clock-circle-linear",
  phone: "phone-linear",
  mail: "letter-linear",
  search: "magnifier-linear",
  user: "user-linear",
  logout: "logout-2-linear",
  shield: "shield-check-linear",
  wallet: "wallet-linear",
  check: "check-circle-linear",
  warning: "danger-triangle-linear",
  arrow: "arrow-right-linear",
  doc: "document-text-linear",
  plane: "plane-linear",
  bus: "bus-linear",
  building: "buildings-2-linear",
  close: "close-circle-linear",
  qr: "qr-code-linear",
  chat: "chat-round-dots-linear",
  history: "history-linear",
  flag: "flag-linear",
  tag: "tag-price-linear",
  sim: "sim-card-linear",
  passport: "passport-linear",
  ticket: "ticket-linear",
  case: "case-linear",
  cap: "square-academic-cap-linear",
  fire: "fire-linear",
  map: "map-linear",
  confetti: "confetti-linear",
  down: "alt-arrow-down-linear",
  filter: "tuning-2-linear",
};

const set = JSON.parse(readFileSync("node_modules/@iconify-json/solar/icons.json", "utf8"));
const missing = Object.values(NAMES).filter((n) => !set.icons[n]);
if (missing.length) throw new Error(`Không có biểu tượng: ${missing.join(", ")}`);

const entries = Object.entries(NAMES)
  .map(([key, name]) => `  ${key}: ${JSON.stringify(set.icons[name].body)},`)
  .join("\n");

writeFileSync(
  "src/client/icons.tsx",
  `// Tệp sinh tự động bởi scripts/extract-icons.mjs — không sửa tay.
// Solar Icon Set của 480 Design, giấy phép CC BY 4.0.
const BODIES = {
${entries}
} as const;

export type IconName = keyof typeof BODIES;

export function isIconName(name: string): name is IconName {
  return Object.hasOwn(BODIES, name);
}

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 ${set.width} ${set.height}"
      className={className}
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: BODIES[name] }}
    />
  );
}
`,
);
console.log(`Đã ghi ${Object.keys(NAMES).length} biểu tượng.`);
