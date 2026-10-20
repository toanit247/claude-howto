<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../../resources/logos/claude-howto-logo-dark.svg">
  <img alt="Claude How To" src="../../resources/logos/claude-howto-logo.svg">
</picture>

# Claude How To - Tài nguyên thương hiệu

Bộ sưu tập đầy đủ logo, icon và favicon cho dự án Claude How To. Tất cả tài nguyên đều dùng thiết kế V3.0: một chiếc la bàn kết hợp ký hiệu ngoặc code (`>`), tượng trưng cho việc dẫn đường xuyên suốt code, với bảng màu Đen/Trắng/Xám và điểm nhấn Xanh lá tươi (#22C55E).

## Cấu trúc thư mục

```
resources/
├── logos/
│   ├── claude-howto-logo.svg       # Logo chính - Chế độ sáng (520×120px)
│   └── claude-howto-logo-dark.svg  # Logo chính - Chế độ tối (520×120px)
├── icons/
│   ├── claude-howto-icon.svg       # Icon ứng dụng - Chế độ sáng (256×256px)
│   └── claude-howto-icon-dark.svg  # Icon ứng dụng - Chế độ tối (256×256px)
└── favicons/
    ├── favicon-16.svg              # Favicon - 16×16px
    ├── favicon-32.svg              # Favicon - 32×32px (chính)
    ├── favicon-64.svg              # Favicon - 64×64px
    ├── favicon-128.svg             # Favicon - 128×128px
    └── favicon-256.svg             # Favicon - 256×256px
```

Các tài nguyên bổ sung trong `assets/logo/`:
```
assets/logo/
├── logo-full.svg       # Biểu tượng + chữ (nằm ngang)
├── logo-mark.svg       # Chỉ biểu tượng la bàn (120×120px)
├── logo-wordmark.svg   # Chỉ phần chữ
├── logo-icon.svg       # Icon ứng dụng (512×512, bo góc)
├── favicon.svg         # Tối ưu cho 16×16
├── logo-white.svg      # Phiên bản trắng cho nền tối
└── logo-black.svg      # Phiên bản đơn sắc đen
```

## Tổng quan tài nguyên

### Ý tưởng thiết kế (V3.0)

**La bàn với ngoặc code**: sự dẫn đường gặp gỡ code:
- **Vòng la bàn** = Điều hướng, tìm đường đi của bạn
- **Kim hướng Bắc (Xanh lá)** = Phương hướng, tiến độ trên lộ trình học
- **Kim hướng Nam (Đen)** = Sự vững vàng, nền tảng chắc chắn
- **Ngoặc `>`** = Dấu nhắc terminal, code, ngữ cảnh CLI
- **Vạch chia** = Sự chính xác, học tập có cấu trúc

### Logo

**File**:
- `logos/claude-howto-logo.svg` (Chế độ sáng)
- `logos/claude-howto-logo-dark.svg` (Chế độ tối)

**Thông số**:
- **Kích thước**: 520×120 px
- **Mục đích**: Logo chính cho header/thương hiệu, kèm phần chữ
- **Cách dùng**:
  - Header website
  - Badge trong README
  - Tài liệu marketing
  - Ấn phẩm in
- **Định dạng**: SVG (co giãn hoàn toàn)
- **Chế độ**: Sáng (nền trắng) & Tối (nền #0A0A0A)

### Icon

**File**:
- `icons/claude-howto-icon.svg` (Chế độ sáng)
- `icons/claude-howto-icon-dark.svg` (Chế độ tối)

**Thông số**:
- **Kích thước**: 256×256 px
- **Mục đích**: Icon ứng dụng, ảnh đại diện, ảnh thu nhỏ
- **Cách dùng**:
  - Icon ứng dụng
  - Ảnh đại diện hồ sơ
  - Ảnh thu nhỏ trên mạng xã hội
  - Header tài liệu
- **Định dạng**: SVG (co giãn hoàn toàn)
- **Chế độ**: Sáng (nền trắng) & Tối (nền #0A0A0A)

**Các thành phần thiết kế**:
- Vòng la bàn với vạch chia hướng chính và hướng phụ
- Kim hướng Bắc màu xanh lá (phương hướng/dẫn đường)
- Kim hướng Nam màu đen (nền tảng)
- Ngoặc code `>` ở trung tâm (terminal/CLI)
- Điểm nhấn chấm tròn xanh lá ở tâm

### Favicon

Các phiên bản tối ưu ở nhiều kích thước cho web:

| File | Kích thước | DPI | Cách dùng |
|------|------|-----|-------|
| `favicon-16.svg` | 16×16 px | 1x | Tab trình duyệt (trình duyệt cũ) |
| `favicon-32.svg` | 32×32 px | 1x | Favicon trình duyệt tiêu chuẩn |
| `favicon-64.svg` | 64×64 px | 1x-2x | Màn hình DPI cao |
| `favicon-128.svg` | 128×128 px | 2x | Apple touch icon, bookmark |
| `favicon-256.svg` | 256×256 px | 4x | Trình duyệt hiện đại, icon PWA |

**Ghi chú tối ưu**:
- 16px: Hình học tối giản, chỉ gồm vòng, kim và chevron
- 32px: Thêm vạch chia hướng chính
- 64px+: Đầy đủ chi tiết với vạch chia hướng phụ
- Tất cả đều giữ sự nhất quán thị giác với icon chính
- Định dạng SVG đảm bảo hiển thị sắc nét ở mọi kích thước

## Tích hợp HTML

### Thiết lập favicon cơ bản

```html
<!-- Favicon trình duyệt -->
<link rel="icon" type="image/svg+xml" href="/resources/favicons/favicon-32.svg">
<link rel="icon" type="image/svg+xml" href="/resources/favicons/favicon-16.svg" sizes="16x16">

<!-- Apple touch icon (màn hình chính trên di động) -->
<link rel="apple-touch-icon" href="/resources/favicons/favicon-128.svg">

<!-- PWA & trình duyệt hiện đại -->
<link rel="icon" type="image/svg+xml" href="/resources/favicons/favicon-256.svg" sizes="256x256">
```

### Thiết lập đầy đủ

```html
<head>
  <!-- Favicon chính -->
  <link rel="icon" type="image/svg+xml" href="/resources/favicons/favicon-32.svg" sizes="32x32">
  <link rel="icon" type="image/svg+xml" href="/resources/favicons/favicon-16.svg" sizes="16x16">

  <!-- Apple touch icon -->
  <link rel="apple-touch-icon" href="/resources/favicons/favicon-128.svg">

  <!-- Icon PWA -->
  <link rel="icon" type="image/svg+xml" href="/resources/favicons/favicon-256.svg" sizes="256x256">

  <!-- Android -->
  <link rel="shortcut icon" href="/resources/favicons/favicon-256.svg">

  <!-- Tham chiếu PWA manifest (nếu dùng manifest.json) -->
  <meta name="theme-color" content="#000000">
</head>
```

## Bảng màu

### Màu chính
- **Đen**: `#000000` (Chữ chính, nét vẽ, kim hướng Nam)
- **Trắng**: `#FFFFFF` (Nền sáng)
- **Xám**: `#6B7280` (Chữ phụ, vạch chia nhỏ)

### Màu nhấn
- **Xanh lá tươi**: `#22C55E` (Kim hướng Bắc, chấm tâm, đường nhấn; chỉ dùng làm điểm nhấn, không bao giờ làm nền)

### Chế độ tối
- **Nền**: `#0A0A0A` (Gần đen)

### Biến CSS
```css
--color-primary: #000000;
--color-secondary: #6B7280;
--color-accent: #22C55E;
--color-bg-light: #FFFFFF;
--color-bg-dark: #0A0A0A;
```

### Cấu hình Tailwind
```js
colors: {
  brand: {
    primary: '#000000',
    secondary: '#6B7280',
    accent: '#22C55E',
  }
}
```

### Nguyên tắc sử dụng
- Dùng màu đen cho chữ chính và các thành phần cấu trúc
- Dùng màu xám cho các thành phần phụ/hỗ trợ
- **Chỉ** dùng màu xanh lá cho điểm nhấn: kim, chấm, đường nhấn
- Không bao giờ dùng xanh lá làm màu nền
- Duy trì độ tương phản WCAG AA (tối thiểu 4.5:1)

## Nguyên tắc thiết kế

### Sử dụng logo
- Dùng trên nền trắng hoặc nền tối (#0A0A0A)
- Co giãn theo đúng tỷ lệ
- Chừa khoảng trống quanh logo (tối thiểu: chiều cao logo / 2)
- Dùng biến thể sáng/tối được cung cấp cho nền phù hợp

### Sử dụng icon
- Dùng ở các kích thước chuẩn: 16, 32, 64, 128, 256px
- Giữ nguyên tỷ lệ của la bàn
- Co giãn theo đúng tỷ lệ

### Sử dụng favicon
- Dùng kích thước phù hợp với ngữ cảnh
- 16-32px: Tab trình duyệt, bookmark
- 64px: Icon trang web dạng favicon
- 128px+: Màn hình chính Apple/Android

## Tối ưu SVG

Tất cả file SVG đều là thiết kế phẳng, không có gradient hay filter:
- Hình học dựa trên nét vẽ, gọn gàng
- Không nhúng ảnh raster
- Path đã được tối ưu
- ViewBox linh hoạt (responsive)

Để tối ưu cho web:
```bash
# Nén SVG mà vẫn giữ chất lượng
svgo --config='{
  "js2svg": {
    "indent": 2
  },
  "plugins": [
    "convertStyleToAttrs",
    "removeRasterImages"
  ]
}' input.svg -o output.svg
```

## Chuyển đổi sang PNG

Để chuyển SVG sang PNG nhằm hỗ trợ trình duyệt cũ:

```bash
# Dùng ImageMagick
convert -density 300 -background none favicon-256.svg favicon-256.png

# Dùng Inkscape
inkscape -D -z --file=favicon-256.svg --export-png=favicon-256.png
```

## Khả năng tiếp cận

- Tỷ lệ tương phản màu cao (tuân thủ WCAG AA, tối thiểu 4.5:1)
- Hình khối hình học gọn gàng, dễ nhận diện ở mọi kích thước
- Định dạng vector co giãn được
- Không có chữ trong icon (chữ được thêm riêng ở phần wordmark)
- Không phụ thuộc vào cặp màu đỏ-xanh lá để truyền tải ý nghĩa

## Ghi công

Các tài nguyên này là một phần của dự án Claude How To.

**Giấy phép**: MIT (xem file LICENSE của dự án)

## Lịch sử phiên bản

- **v3.0** (Tháng 2/2026): Thiết kế la bàn-ngoặc với bảng màu Đen/Trắng/Xám + điểm nhấn Xanh lá
- **v2.0** (Tháng 1/2026): Thiết kế hình sao 12 tia lấy cảm hứng từ Claude với bảng màu xanh ngọc lục bảo
- **v1.0** (Tháng 1/2026): Thiết kế icon tiến trình gốc dựa trên hình lục giác

---

**Cập nhật lần cuối**: Tháng 2/2026
**Phiên bản hiện tại**: 3.0 (La bàn-Ngoặc)
**Tất cả tài nguyên**: SVG sẵn sàng cho production, co giãn hoàn toàn, đạt chuẩn tiếp cận WCAG AA
