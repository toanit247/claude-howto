# Giao thức kết nối xTravelOS và nhà cung cấp

Tài liệu này mô tả cách một bên có API (vé tham quan, khách sạn, SIM, vé máy bay, đối tác khác) kết nối vào hệ thống bán hàng WonderTour. Bản này khớp với mã trong `wondertour-web` (phiên bản `/public/v1`).

## 1. Nguyên tắc

- **Dữ liệu nằm ở ERP (xTravelOS).** Web chỉ đọc và hiển thị; web không giữ sản phẩm, giá, tồn chỗ hay đơn.
- **Mỗi nhà cung cấp là một bộ điều hợp trong ERP.** Bộ điều hợp đọc API của nhà cung cấp, đổi về mô hình sản phẩm và lịch khởi hành của `/public/v1`, rồi báo web qua webhook.
- **Web không gọi thẳng API nhà cung cấp.** Mọi giá, tồn chỗ và đặt chỗ đi qua ERP để có một nơi chịu trách nhiệm.

## 2. Xác thực

| Hướng | Cách xác thực |
|---|---|
| Web → ERP (`/public/v1`) | Header `Authorization: Bearer <khóa dịch vụ>`. ERP cũng nhận `X-API-Key`. Khóa do ERP cấp ở **Marketing → Web bán hàng → Kết nối**, phạm vi `web:public`. |
| ERP → Web (webhook) | Chữ ký HMAC-SHA256 bằng khóa ký, xem mục 5. |
| Đại lý / liên minh | Đăng nhập qua `POST /public/v1/agents/login`, nhận mã phiên; web gửi mã phiên trong header `X-Session-Token`, không dùng khóa dịch vụ cho khách. |
| Nhân viên (quản trị web) | `POST /staff/login` trên ERP, chỉ vai trò được phép mới vào. |

Khóa không đi qua chat hay ảnh chụp. Khóa dịch vụ và khóa ký được đặt trực tiếp vào biến môi trường của dịch vụ web.

## 3. Endpoint `/public/v1`

Đọc (không cần phiên đại lý):

| Endpoint | Dùng để |
|---|---|
| `GET /products` | Danh sách tour. Tham số: `q`, `destination`, `month` (YYYY-MM), `category`, `party`, `promo`, `sort`, `minPrice`, `maxPrice`, `page`, `pageSize`. |
| `GET /products/{slug}` | Chi tiết tour. |
| `GET /products/{slug}/departures` | Lịch khởi hành và chỗ còn. |
| `GET /tickets`, `GET /tickets/{slug}` | Vé tham quan. |
| `GET /articles`, `GET /articles/{slug}` | Bài viết cẩm nang. |
| `GET /site-settings` | Cấu hình hiển thị của web. |
| `GET /public/v1/openapi.json` | Mô tả máy đọc được của API. Không cần khóa. |

Ghi (cần khóa dịch vụ; web luôn gửi `Idempotency-Key`):

| Endpoint | Dùng để |
|---|---|
| `POST /holds`, `POST /holds/{id}/release` | Giữ chỗ tạm, có đếm ngược. |
| `POST /bookings` | Đặt tour. |
| `GET /bookings/{code}` (header `X-Lookup-Phone`) | Tra cứu đơn bằng mã và số điện thoại. Web không ghi gì khi tra cứu. |
| `POST /ticket-orders` | Đặt vé tham quan. |
| `POST /leads` | Yêu cầu tư vấn từ form. Bắt buộc có `Idempotency-Key`. |

## 4. Chống trùng và lỗi

- `Idempotency-Key` là chuỗi duy nhất cho mỗi thao tác. Hiện ERP áp dụng cho `/holds`, `/bookings`, `/leads`, `/ticket-orders`.
  - Khóa được ghi ngay khi ERP bắt đầu xử lý. Gửi lại cùng khóa, kể cả đồng thời, nhận đúng kết quả của lần đầu, không tạo đơn thứ hai.
  - Cùng khóa nhưng nội dung khác: trả `422`.
  - `/leads` bắt buộc có khóa; các endpoint còn lại nhận khóa nhưng không bắt buộc.
- Lỗi trả về dạng `{"detail": "thông báo tiếng Việt"}`. Hiện ERP chưa có trường mã máy đọc (ví dụ `code`); web chỉ hiển thị `detail`. Khi ERP thêm trường `code`, tài liệu sẽ cập nhật.
- Mã HTTP: `401` sai hoặc thiếu khóa; `403` không đủ quyền; `404` không tìm thấy; `409` xung đột (ví dụ hết chỗ); `422` dữ liệu sai; `429` gọi quá nhiều, có `Retry-After`; `5xx` lỗi máy chủ.
- Web không tự thử lại lệnh ghi. Khi xTravelOS trả `5xx` hoặc không kết nối được, web tạm ngưng gọi và giữ bản dữ liệu đang có; người dùng gửi lại thao tác với cùng `Idempotency-Key`.

## 5. Webhook ERP → Web

ERP gửi `POST` tới `https://<web>/hooks/xtravelos` mỗi khi có thay đổi.

Header:
- `X-XTravel-Timestamp`: Unix time, 10 chữ số, tính bằng giây.
- `X-XTravel-Signature`: `sha256=` + hex(HMAC-SHA256(khóa ký, timestamp + "." + nội dung thô)).

Web từ chối nếu chữ ký sai hoặc lệch thời gian quá 300 giây.

Nội dung:

```json
{ "event": "product.updated", "slug": "phu-quoc-nghi-duong-3-ngay-2-dem" }
```

Các sự kiện web xử lý, và trạng thái trên ERP hiện nay:

| Sự kiện | Khi nào | Web làm gì | ERP hiện nay |
|---|---|---|---|
| `product.updated`, `product.deleted` | Tour đổi hoặc bị gỡ | Xóa bản tạm của tour và danh sách liên quan | Đã bắn |
| `departures.updated` | Lịch hoặc chỗ còn đổi | Xóa bản tạm lịch khởi hành | Chưa bắn; web chờ theo bản tạm 15 giây |
| `article.updated`, `article.deleted` | Bài viết đổi | Xóa bản tạm bài viết và sơ đồ trang | Chỉ có `article.updated` |
| `ticket.updated`, `ticket.deleted` | Vé tham quan đổi | Xóa bản tạm vé | Đã bắn |
| `site-settings.updated` | Cấu hình web đổi | Tải lại cấu hình ngay | Chưa có trong danh sách ERP |

Trạng thái đơn (đã thanh toán, đã xác nhận, đã hủy) chưa có sự kiện. Hiện web tra cứu lại `GET /bookings/{code}` khi cần. Nếu cần sự kiện `booking.*`, phía ERP phải bổ sung.

Ví dụ kiểm tra chữ ký (Node.js):

```js
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyXTravelWebhook(secret, timestamp, rawBody, signature) {
  if (!/^\d{10}$/.test(timestamp ?? "") || !signature) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(`${timestamp}.`).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
```

## 6. Bộ điều hợp nhà cung cấp (phía ERP)

Mỗi nhà cung cấp cần ghi rõ các mục sau trước khi nối:

1. **Nguồn dữ liệu:** API nào, khóa nào, giới hạn gọi bao nhiêu lần mỗi phút.
2. **Ánh xạ sản phẩm:** mã sản phẩm, tên, mô tả, ảnh, điểm đến, giá theo người lớn và trẻ em, VAT.
3. **Ánh xạ tồn chỗ:** cách đọc chỗ còn, khi nào giữ chỗ, khi nào trả chỗ.
4. **Đặt chỗ:** nhà cung cấp có xác nhận tức thì không; nếu không, trạng thái chờ và hạn xác nhận.
5. **Hủy và hoàn tiền:** điều kiện, phí, ai chịu.
6. **Lịch đồng bộ:** webhook của nhà cung cấp (nếu có) hoặc kéo định kỳ, và cách phát `product.updated` hay `departures.updated` tương ứng.

Bộ điều hợp không được ghi thẳng vào web. Mọi thay đổi đi qua ERP rồi mới tới web.

## 7. Checklist nối một đối tác mới

- [ ] Chạy công cụ kiểm tra: `XTRAVEL_URL=... XTRAVEL_KEY=... WEB_URL=... WEBHOOK_SECRET=... npm run kiem-tra-ket-noi` trong `wondertour-web`. Công cụ chỉ đọc, trừ việc gửi một webhook thử "site-settings.updated"; thoát mã 1 nếu có mục không đạt.
- [ ] ERP tạo khóa dịch vụ riêng cho đối tác (nếu đối tác cần gọi `/public/v1`).
- [ ] Bộ điều hợp chạy trên môi trường thử, đồng bộ được ít nhất một sản phẩm.
- [ ] Gửi webhook thử tới môi trường thử của web; web trả `204`.
- [ ] Đặt chỗ thử với cùng `Idempotency-Key` hai lần, chỉ tạo một đơn.
- [ ] Hết chỗ trả `409`, web hiện thông báo và gợi ý tour khác.
- [ ] Nhân sự đối tác được đào tạo quy trình xác nhận và hủy.
- [ ] Bật môi trường thật sau khi anh Toản duyệt.
