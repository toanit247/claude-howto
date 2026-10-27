import { createMockXTravel } from "./server";

process.loadEnvFile?.(".env");
const port = Number(process.env.MOCK_PORT ?? 4100);
const { app } = createMockXTravel({
  apiKey: process.env.XTRAVEL_API_KEY ?? "dev-service-key-change-me-0001",
  holdSeconds: process.env.MOCK_HOLD_SECONDS ? Number(process.env.MOCK_HOLD_SECONDS) : undefined,
  webhook: process.env.MOCK_WEBHOOK_URL
    ? { url: process.env.MOCK_WEBHOOK_URL, secret: process.env.XTRAVEL_WEBHOOK_SECRET ?? "dev-webhook-secret-change-me-0001" }
    : undefined,
});
app.listen(port, () => console.log(`xTravelOS giả lập chạy ở http://localhost:${port}`));
