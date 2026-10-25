import { expect, test } from "@playwright/test";

const MOCK = "http://localhost:4199";

test("khách lẻ: giữ chỗ → đặt → hiện VietQR → ngân hàng báo tiền về", async ({ page, request }) => {
  await page.goto("/tour/ha-giang-4n3d-mua-tam-giac-mach");
  await page.getByRole("button", { name: "Chỉ cookie cần thiết" }).click();

  const panel = page.locator("#dat-cho");
  await panel.scrollIntoViewIfNeeded();
  // Chọn ngày thứ hai (còn nhiều chỗ).
  await panel.locator('label:has(input[name="departure"]:not([disabled]))').nth(1).click();
  await panel.getByRole("button", { name: /^Giữ 2 chỗ ngày/ }).click();

  await expect(panel.getByRole("timer")).toContainText("Đang giữ 2 chỗ");
  await panel.getByLabel("Họ tên", { exact: true }).fill("Nguyễn Văn An");
  await panel.getByLabel("Số điện thoại").fill("0912345678");
  await panel.getByLabel("Họ tên như trên giấy tờ").nth(0).fill("Nguyễn Văn An");
  await panel.getByLabel("Họ tên như trên giấy tờ").nth(1).fill("Trần Thị Bình");
  await panel.getByRole("checkbox", { name: /Tôi đồng ý/ }).check();
  await expect(panel.getByRole("checkbox", { name: /nhận tin ưu đãi/ })).not.toBeChecked();
  await panel.getByRole("button", { name: "Đặt chỗ và nhận mã thanh toán" }).click();

  const qr = panel.getByRole("img", { name: /Mã VietQR/ });
  await expect(qr).toBeVisible();
  await expect(panel).toContainText("Chờ thanh toán");
  await expect(panel).toContainText("Đã nhận");
  const code = (await panel.locator("text=/Mã đặt chỗ WT[0-9A-F]+/").textContent())?.match(/WT[0-9A-F]+/)?.[0];
  expect(code).toBeTruthy();

  // Giả lập ngân hàng báo tiền về xTravelOS; web tự cập nhật, không tự báo đã thanh toán.
  await request.post(`${MOCK}/__mock/payments/${code}`, { data: { amount: 999_999_999 } });
  await expect(panel).toContainText("Đã thanh toán đủ", { timeout: 15_000 });
});

test("tra cứu đơn và trang tìm tour", async ({ page }) => {
  await page.goto("/tour?budget=0-5000000");
  await expect(page.getByRole("heading", { name: /Tôi muốn đi/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Ngân sách: dưới 5.000.000/ })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Tìm thấy");
  await page.goto("/tra-cuu");
  await page.getByLabel("Mã đặt chỗ").fill("WT000000");
  await page.getByLabel("Số điện thoại").fill("0912345678");
  await page.getByRole("button", { name: "Tra cứu" }).click();
  await expect(page.getByRole("alert")).toContainText("Không thấy đơn");
});

test("đại lý đăng nhập thấy phần hưởng, đăng xuất thì hết", async ({ page }) => {
  await page.goto("/dai-ly/dang-nhap");
  await page.getByLabel("Tên đăng nhập").fill("daily01");
  await page.getByLabel("Mật khẩu").fill("matkhau123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("heading", { name: "Đại lý Thu Hà Travel" })).toBeVisible();

  await page.goto("/tour/nhat-ban-6n5d-tokyo-phu-si-osaka");
  const panel = page.locator("#dat-cho");
  await panel.locator('label:has(input[name="departure"]:not([disabled]))').first().click();
  await expect(panel).toContainText("Phần hưởng cấp 2");

  await page.context().clearCookies({ name: "wt_session" });
  await page.reload();
  await panel.locator('label:has(input[name="departure"]:not([disabled]))').first().click();
  await expect(panel).not.toContainText("Phần hưởng");
});

test("câu tìm tour: điền chỗ trống → đếm tour → kết quả → số khách tự điền", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Chỉ cookie cần thiết" }).click();

  await page.getByRole("button", { name: /^Nơi đến:/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Nhật Bản" }).click();
  await page.getByRole("button", { name: /^Đi cùng:/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Gia đình có trẻ nhỏ/ }).click();
  await expect(page.getByRole("button", { name: "Nơi đến: Nhật Bản" })).toBeVisible();
  const go = page.getByRole("button", { name: /Xem 1 tour phù hợp/ });
  await expect(go).toBeVisible();
  await go.click();

  await expect(page).toHaveURL(/\/tour\?.*destination=nhat-ban.*party=family/);
  await expect(page.getByRole("status")).toContainText("Tìm thấy 1 tour");
  await page.getByRole("link", { name: /Nhật Bản 6 ngày 5 đêm/ }).click();
  // "Gia đình có trẻ nhỏ" → 2 người lớn, 2 trẻ em điền sẵn trong khung đặt chỗ.
  const panel = page.locator("#dat-cho");
  await panel.locator('label:has(input[name="departure"]:not([disabled]))').first().click();
  await expect(panel.getByLabel("Người lớn")).toHaveValue("2");
  await expect(panel.getByLabel(/Trẻ em/)).toHaveValue("2");
});
