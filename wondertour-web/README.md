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
| `toan` | `matkhau123` | Nhân viên xTravelOS vai trò CEO, vào được /quan-tri |
| `marketing01` | `matkhau123` | Nhân viên vai trò Marketing, vào được /quan-tri |
| `sale01` | `matkhau123` | Nhân viên vai trò Sale, bị chặn ở /quan-tri |
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
| `ai/skills/` | Kỹ năng tư vấn tour cho trợ lý AI (SKILL.md) |
| `tests/`, `e2e/` | Kiểm thử tự động |

## Hai web, một mã nguồn

- `SITE_KIND=company`: web công ty cho khách lẻ, đại lý, cộng tác viên.
- `SITE_KIND=alliance`: cổng liên minh, mọi trang cần đăng nhập, thấy giá cost tạm tính, không cho Google đọc.

Đổi thương hiệu: tạo `brand/<ten>.json` (tên, logo, màu, câu mở đầu, đoàn tiêu biểu, liên hệ, Zalo) rồi đặt `BRAND_CONFIG`. Không sửa mã.

## Trợ lý AI tư vấn tour

Khung chat ở góc dưới bên trái, nhìn giống trợ lý trong xTravelOS (khung 360×480, màu thương hiệu, bong bóng trắng viền xám). Hai chế độ:

- Có `ANTHROPIC_API_KEY`: gọi Claude (`AI_MODEL`, mặc định `claude-opus-5-5`) với bốn công cụ tra dữ liệu thật qua máy chủ web: `search_tours`, `get_departures`, `list_tickets`, `group_options`. Chữ hiện dần (stream). Lời dẫn hệ thống lấy từ `ai/skills/tu-van-tour/SKILL.md` (kỹ năng tư vấn: hỏi ít, hỏi đúng, không bịa giá, không xác nhận thanh toán, không nhận giấy tờ qua chat, đoàn thì dẫn sang đề xuất riêng). Đã bật `fallbacks: "default"` để khi bộ lọc an toàn từ chối, hệ thống tự thử mô hình dự phòng.
- Không có khóa: chế độ gợi ý cơ bản khớp từ khóa với danh mục (điểm đến, đi cùng ai, tháng, ngân sách, vé), đủ để chạy thử và kiểm thử tự động.

Máy chủ web không lưu hội thoại; nhật ký không ghi nội dung khách gõ. Hội thoại giữ trong `sessionStorage` của trình duyệt khách. Giới hạn 30 tin mỗi 10 phút mỗi IP.

## Quản trị web (/quan-tri)

Đăng nhập bằng **tài khoản nhân viên xTravelOS** (web gọi `POST /public/v1/staff/login`); chỉ vai trò trong `ADMIN_ROLES` (viết đúng tên vai trò trong xTravelOS, mặc định `Quản trị,Quản lý,CEO,Marketing`) được vào. Nhân viên nghỉ việc thì khóa ở xTravelOS là hết quyền trên web. Tài khoản dự phòng trong biến môi trường (`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, tạo bằng `node scripts/hash-password.mjs`) chỉ dùng được khi xTravelOS chưa có đầu API này hoặc đang tắt; để trống nếu không cần.

Trang quản trị cho bật tắt từng khối (câu tìm tour, ưu đãi, bảng khởi hành, vé tham quan, tour đoàn, trợ lý AI…), sửa lưới dịch vụ, lựa chọn trong trang Tour đoàn, hotline, email, Zalo, tên và câu chào của trợ lý.

Cấu hình cất ở đâu do `SETTINGS_SOURCE` quyết:

- `xtravelos` (khuyên dùng): `GET/PUT /public/v1/site-settings` trên xTravelOS, web chỉ giữ bản tạm 60 giây; xTravelOS báo `site-settings.updated` qua webhook thì web tải lại ngay. Không cần Volume, khởi động lại web không mất gì, và sau này sửa ngay trong ERP cũng được.
- `file`: tệp JSON `SETTINGS_FILE` (mặc định `data/site-settings.json`); trên Railway gắn Volume vào `data/`.

Trang quản trị không đụng sản phẩm, giá, đơn hàng: những thứ đó ở xTravelOS.

## Tính năng bán hàng

- **Tour đoàn** (`/tour-doan`): gộp doanh nghiệp, hội nghị MICE, teambuilding, học sinh, nhóm riêng vào một cửa; mỗi lựa chọn dẫn tới tour có sẵn hoặc form đề xuất riêng.
- **Vé tham quan** (`/ve-tham-quan`): vé khu vui chơi từ xTravelOS (`GET /tickets`, `POST /ticket-orders`), chọn ngày, số vé, thanh toán VietQR, trạng thái tiền tự cập nhật.

- **Câu tìm tour** thay cho ô tìm kiếm và bộ lọc: "Tôi muốn đi [đâu đó] vào [tháng nào] cùng [ai], ngân sách [bao nhiêu]". Bấm từng chỗ trống để chọn; nút hiện ngay số tour khớp; "đi cùng ai" tự điền số khách khi đặt chỗ; web nhớ câu lần trước trong trình duyệt người xem.
- Chọn nơi khởi hành ở đầu trang (nhớ cho lần sau); trang chủ ưu tiên tour đi từ đó.
- Lưới dịch vụ bằng biểu tượng (tour trong nước, nước ngoài, đoàn MICE, teambuilding, tour học sinh, visa, vé máy bay, SIM eSIM), khai báo trong `brand/*.json`.
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
