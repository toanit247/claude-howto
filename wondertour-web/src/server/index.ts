// Điểm chạy bản thật: phục vụ gói giao diện đã build và dựng trang bằng entry-server đã build.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { AppData } from "../shared/routes";
import { createApp } from "./app";
import { loadConfig } from "./config";
import { log } from "./logger";

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = loadConfig();
const template = readFileSync(resolve(dist, "client/index.html"), "utf8");
const entry = (await import(pathToFileURL(resolve(dist, "server-entry/entry-server.js")).href)) as {
  render: (data: AppData) => string;
};

const { app } = createApp({
  config,
  staticDir: resolve(dist, "client"),
  renderer: { template: async () => template, render: async (data) => entry.render(data) },
});

const server = app.listen(config.port, () => {
  log.info("web đã chạy", { port: config.port, site: config.siteKind, env: config.appEnv });
});

for (const sig of ["SIGTERM", "SIGINT"] as const) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
