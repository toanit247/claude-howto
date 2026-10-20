# Bắt đầu nhanh - Tài nguyên thương hiệu

## Sao chép tài nguyên vào dự án của bạn

```bash
# Sao chép toàn bộ resources vào dự án web của bạn
cp -r resources/ /path/to/your/website/

# Hoặc chỉ sao chép favicon cho web
cp resources/favicons/* /path/to/your/website/public/
```

## Thêm vào HTML (Sao chép & Dán)

```html
<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/resources/favicons/favicon-32.svg" sizes="32x32">
<link rel="icon" type="image/svg+xml" href="/resources/favicons/favicon-16.svg" sizes="16x16">
<link rel="apple-touch-icon" href="/resources/favicons/favicon-128.svg">
<link rel="icon" type="image/svg+xml" href="/resources/favicons/favicon-256.svg" sizes="256x256">
<meta name="theme-color" content="#000000">
```

## Dùng trong Markdown/Tài liệu

```markdown
# Claude How To

![Claude How To Logo](resources/logos/claude-howto-logo.svg)

![Icon](resources/icons/claude-howto-icon.svg)
```

## Kích thước khuyến nghị

| Mục đích | Kích thước | File |
|---------|------|------|
| Header website | 520×120 | `logos/claude-howto-logo.svg` |
| Icon ứng dụng | 256×256 | `icons/claude-howto-icon.svg` |
| Tab trình duyệt | 32×32 | `favicons/favicon-32.svg` |
| Màn hình chính di động | 128×128 | `favicons/favicon-128.svg` |
| Ứng dụng desktop | 256×256 | `favicons/favicon-256.svg` |
| Ảnh đại diện nhỏ | 64×64 | `favicons/favicon-64.svg` |

## Giá trị màu

```css
/* Dùng các giá trị này trong CSS của bạn */
--color-primary: #000000;
--color-secondary: #6B7280;
--color-accent: #22C55E;
--color-bg-light: #FFFFFF;
--color-bg-dark: #0A0A0A;
```

## Ý nghĩa thiết kế icon

**La bàn với ngoặc code**:
- Vòng la bàn = Điều hướng, lộ trình học có cấu trúc
- Kim hướng Bắc xanh lá = Phương hướng, tiến độ, sự dẫn đường
- Kim hướng Nam đen = Sự vững vàng, nền tảng chắc chắn
- Ngoặc `>` = Dấu nhắc terminal, code, ngữ cảnh CLI
- Vạch chia = Sự chính xác, các bước có cấu trúc

Điều này tượng trưng cho "tìm đường xuyên suốt code với sự dẫn dắt rõ ràng."

## Dùng gì ở đâu

### Website
- **Header**: Logo (`logos/claude-howto-logo.svg`)
- **Favicon**: 32px (`favicons/favicon-32.svg`)
- **Ảnh xem trước trên mạng xã hội**: Icon (`icons/claude-howto-icon.svg`)

### GitHub
- **Badge trong README**: Icon (`icons/claude-howto-icon.svg`) ở kích thước 64-128px
- **Ảnh đại diện repository**: Icon (`icons/claude-howto-icon.svg`)

### Mạng xã hội
- **Ảnh hồ sơ**: Icon (`icons/claude-howto-icon.svg`)
- **Ảnh bìa**: Logo (`logos/claude-howto-logo.svg`)
- **Ảnh thu nhỏ**: Icon ở kích thước 256×256px

### Tài liệu
- **Header chương**: Logo hoặc icon (co giãn cho vừa)
- **Icon điều hướng**: Favicon (32-64px)

---

Xem [README.md](README.md) để có tài liệu đầy đủ.
