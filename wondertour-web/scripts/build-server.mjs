// Đóng gói máy chủ web bằng esbuild. Thư viện trong node_modules giữ nguyên (cài bằng npm ci --omit=dev).
import { build } from "esbuild";

await build({
  entryPoints: ["src/server/index.ts"],
  outfile: "dist/server/index.js",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  packages: "external",
  sourcemap: false,
  legalComments: "none",
});
