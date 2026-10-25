import { defineConfig, devices } from "@playwright/test";

// Chạy luồng giữ chỗ → đặt → hiện VietQR trên bản build thật, nối với xTravelOS giả lập.
// Muốn chạy với máy chủ thử của xTravelOS: đặt E2E_BASE_URL trỏ vào web thử và bỏ qua webServer.
const external = process.env.E2E_BASE_URL;
const env = {
  NODE_ENV: "development",
  PORT: "3100",
  PUBLIC_BASE_URL: "http://localhost:3100",
  XTRAVEL_API_URL: "http://localhost:4199",
  XTRAVEL_API_KEY: "e2e-service-key-0123456789abcdef",
  XTRAVEL_WEBHOOK_SECRET: "e2e-webhook-secret-0123456789ab",
  COOKIE_SECRET: "e2e-cookie-secret-0123456789",
  COOKIE_SECURE: "false",
  LOG_SILENT: "1",
};

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: external ?? "http://localhost:3100",
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    // Môi trường có sẵn Chromium riêng thì chỉ đường dẫn qua biến này.
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: external
    ? undefined
    : [
        {
          command: "npx tsx mock-xtravelos/main.ts",
          port: 4199,
          env: { MOCK_PORT: "4199", XTRAVEL_API_KEY: env.XTRAVEL_API_KEY },
          reuseExistingServer: false,
        },
        { command: "node dist/server/index.js", port: 3100, env, reuseExistingServer: false },
      ],
});
