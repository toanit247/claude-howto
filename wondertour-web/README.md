# Web bán hàng WonderTour đấu nối xTravelOS

Web bán tour mới thay cho wondertour.vn (Laravel). Web là một dịch vụ riêng, **không có cơ sở dữ liệu nghiệp vụ**: sản phẩm, lịch khởi hành, chỗ còn, giá, bài viết, ảnh đều lấy từ API công khai của xTravelOS (`/public/v1`). Mọi giữ chỗ, đặt chỗ, thanh toán đi qua xTravelOS.

Làm theo tài liệu "Tiêu chuẩn kỹ thuật web bán hàng đấu nối xTravelOS" (25/10/2026).

## Chạy thử trên máy

Cần Node.js 22 trở lên. Trên Windows: giải nén vào `G:\Web WonderTour` rồi bấm đúp `chay-thu.bat` (tự cài thư viện, bật xTravelOS giả lập và web, mở trình duyệt). Hoặc chạy tay:

```bash
cd wondertour-web
npm ci
cp .env.example .env

# Cửa sổ 1: xTravelOS giả lập (cổng 4100)
npm run dev:mock

# Cửa sổ 2: web (cổng 3000)
npm run dev
```

Mở `http://localhost:3000`. Tài khoản thử của bản giả lập:

| Tài khoản | Mật khẩu | Luồng |
| --- | --- | --- |
| `daily01` | `matkhau123` | Đại lý, cấp 2 (web công ty) |
| `lienminh01` | `matkhau123` | Doanh nghiệp liên minh (đặt `SITE_KIND=alliance`) |

Giả lập ngân hàng báo tiền về một đơn:

```bash
curl -X POST http://localhost:4100/__mock/payments/WTABC123 -H 'content-type: application/json' -d '{"amount": 1000000}'
```

## Lệnh kiểm tra

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm test            # vitest + supertest, nối xTravelOS giả lập
npm run build       # vite build + esbuild
npm run test:e2e    # Playwright: giữ chỗ → đặt → hiện VietQR → tiền về
npm audit --omit=dev
```

## Nối với xTravelOS thật

Máy thử xTravelOS chạy trên máy anh Toản ở `http://127.0.0.1:8766`. Kiểm thử hợp đồng (khóa thử đặt trong biến môi trường, không gửi qua tin nhắn):

```bash
XTRAVEL_CONTRACT_URL=http://127.0.0.1:8766 XTRAVEL_CONTRACT_KEY=<khóa thử> npm run test:contract
```

1. Phía xTravelOS làm các đầu API trong bảng "Hợp đồng API" của tài liệu. Bản đề xuất chi tiết từng trường nằm ở `src/shared/schemas.ts`; xTravelOS giả lập phát bản OpenAPI tương ứng tại `http://localhost:4100/openapi.json`.
2. Khi xTravelOS xuất `/openapi.json` chính thức, chạy `XTRAVEL_API_URL=<máy thử> npm run gen:types`, đối chiếu và sửa `src/shared/schemas.ts` cho khớp.
3. Đặt biến môi trường của máy chủ web: `XTRAVEL_API_URL`, `XTRAVEL_API_KEY`, `XTRAVEL_WEBHOOK_SECRET` (xem `.env.example`).
4. Đăng ký đầu báo đổi nội dung `POST https://<web>/hooks/xtravelos` trong xTravelOS, ký HMAC SHA-256 theo `src/server/hmac.ts`.

Điểm bên xTravelOS phải làm đúng (kiểm thử của web đã bắt các lỗi này trên bản giả lập):

- Cùng `Idempotency-Key` gửi hai lần **cùng lúc** chỉ tạo một đơn: lưu khóa ngay khi bắt đầu xử lý.
- Hai người giữ chỗ cuối cùng: một người được, người kia nhận 409.
- Trạng thái tiền chỉ đổi khi ngân hàng báo về (SePay, Casso).
- Lỗi trả `{"detail": "..."}` tiếng Việt; 5xx khiến web chuyển sang báo bảo trì.

## Cấu trúc

| Thư mục | Nội dung |
| --- | --- |
| `src/server/` | Máy chủ Express: giữ khóa, gọi xTravelOS, giới hạn lượt, dựng trang, SEO, báo đổi nội dung |
| `src/client/` | Giao diện React 19, Tailwind CSS 4; trang dựng phía máy chủ, phần đặt chỗ chạy trên trình duyệt |
| `src/shared/` | Hợp đồng dữ liệu (zod), định dạng tiền và ngày, bảng đường dẫn |
| `mock-xtravelos/` | xTravelOS giả lập để phát triển và kiểm thử |
| `brand/` | Cấu hình thương hiệu; doanh nghiệp khác chỉ cần tệp mới |
| `tests/`, `e2e/` | Kiểm thử tự động |

## Hai web, một mã nguồn

- `SITE_KIND=company`: web công ty cho khách lẻ, đại lý, cộng tác viên.
- `SITE_KIND=alliance`: cổng liên minh, mọi trang cần đăng nhập, thấy giá cost tạm tính, không cho Google đọc.

Đổi thương hiệu: tạo `brand/<ten>.json` (tên, logo, màu, câu mở đầu, đoàn tiêu biểu, liên hệ, Zalo) rồi đặt `BRAND_CONFIG`. Không sửa mã.

## Tính năng bán hàng

- Chọn nơi khởi hành ở đầu trang (nhớ cho lần sau); trang chủ và ô tìm kiếm ưu tiên tour đi từ đó.
- Lưới dịch vụ bằng biểu tượng (tour trong nước, nước ngoài, đoàn MICE, teambuilding, tour học sinh, visa, vé máy bay, SIM eSIM), khai báo trong `brand/*.json`.
- Ô tìm kiếm một dòng "Bạn muốn đi đâu?"; tháng, nơi khởi hành, ngân sách gấp sau nút "Bộ lọc" trên điện thoại; sắp xếp theo ngày đi hoặc giá.
- "Ưu đãi hôm nay" và "Khám phá điểm đến" vuốt ngang trên điện thoại.
- Bảng "Sắp khởi hành" ở trang chủ, thẻ tour hiện ngày đi gần nhất và "Còn N chỗ".
- Lịch khởi hành theo tháng kèm giá từng ngày; giữ chỗ có đếm ngược; danh sách khách; mã VietQR, chép số tài khoản và nội dung bằng một chạm; trạng thái tiền tự cập nhật.
- Khung đặt chỗ dính theo màn hình máy tính, thanh đặt chỗ dưới màn hình điện thoại.
- Tour cùng điểm đến, tour đã xem (lưu trong trình duyệt người xem), nút gọi hoặc Zalo nổi.
- Bài viết gắn tour có nút đặt chỗ ngay trong bài.

## Triển khai

Docker (Railway hoặc nơi khác):

```bash
docker build -t wondertour-web .
docker run --env-file .env -p 3000:3000 wondertour-web
```

Web thật đặt `APP_ENV=production`, `NODE_ENV=production`, `COOKIE_SECURE=true`. Lên web thật chỉ khi CEO đồng ý; giữ bản trước để quay lại ngay khi lỗi.

Biểu tượng: Solar Icon Set của 480 Design, giấy phép CC BY 4.0.
