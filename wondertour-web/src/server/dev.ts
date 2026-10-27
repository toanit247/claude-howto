// Điểm chạy khi phát triển: Vite chạy dạng middleware, sửa giao diện thấy ngay.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createServer } from "vite";
import type { AppData } from "../shared/routes";
import { createApp } from "./app";
import { loadConfig } from "./config";
import { log } from "./logger";

process.loadEnvFile?.(".env");
const config = loadConfig();
const vite = await createServer({ server: { middlewareMode: true }, appType: "custom" });
const raw = readFileSync(resolve("index.html"), "utf8");

const { app } = createApp({
  config,
  devMiddleware: vite.middlewares,
  renderer: {
    template: (url) => vite.transformIndexHtml(url, raw),
    render: async (data: AppData) => {
      const mod = (await vite.ssrLoadModule("/src/client/entry-server.tsx")) as { render: (d: AppData) => string };
      return mod.render(data);
    },
  },
});

app.listen(config.port, () => log.info("web (phát triển) đã chạy", { url: `http://localhost:${config.port}` }));
