# Claude How To - Hệ thống thiết kế

## Nhận diện thị giác

### Ý tưởng thiết kế icon: La bàn với ngoặc code

Icon của Claude How To dùng **một chiếc la bàn với ngoặc code `>`** để thể hiện sự dẫn đường xuyên suốt code:

```
     N (xanh lá)
     ▲
     │
W ───>─── E     La bàn = Dẫn đường/Phương hướng
     │          Ngoặc > = Code/Terminal/CLI
     ▼
     S (đen)
```

Thiết kế này mang lại:
- **Rõ ràng về thị giác**: Ngay lập tức truyền đạt ý "hướng dẫn điều hướng code"
- **Ý nghĩa biểu tượng**: La bàn = tìm đường đi của bạn; `>` = code/terminal
- **Khả năng co giãn**: Hoạt động ở mọi kích thước từ 16px đến 512px
- **Nhất quán thương hiệu**: Phù hợp với thẩm mỹ của công cụ dành cho lập trình viên với bảng màu tối giản

---

## Hệ thống màu

### Bảng màu

| Màu | Hex | RGB | Cách dùng |
|-------|-----|-----|-------|
| Đen (Chính) | `#000000` | 0, 0, 0 | Nét vẽ chính, chữ, kim hướng Nam |
| Trắng (Nền) | `#FFFFFF` | 255, 255, 255 | Nền sáng |
| Xám (Phụ) | `#6B7280` | 107, 114, 128 | Vạch chia nhỏ, chữ phụ |
| Xanh lá tươi (Nhấn) | `#22C55E` | 34, 197, 94 | Kim hướng Bắc, chấm tâm, đường nhấn |
| Gần đen (Nền tối) | `#0A0A0A` | 10, 10, 10 | Nền chế độ tối |

### Tỷ lệ tương phản (WCAG)

- Đen trên Trắng: **21:1** AAA
- Xám trên Trắng: **4.6:1** AA
- Xanh lá trên Trắng: **3.2:1** (chỉ để trang trí, không dùng cho chữ)
- Trắng trên nền Tối: **19.5:1** AAA

### Quy tắc màu nhấn

**Xanh lá tươi (#22C55E) chỉ dành riêng cho điểm nhấn:**
- Kim hướng Bắc của la bàn
- Chấm tâm
- Gạch chân/viền nhấn
- Không bao giờ làm màu nền
- Không bao giờ dùng cho chữ nội dung

---

## Typography

### Font logo
- **Họ font**: Inter, SF Pro Display, -apple-system, Segoe UI, sans-serif
- **"Claude"**: 42px, độ đậm 700 (bold), Đen
- **"How-To"**: 32px, độ đậm 500 (medium), Xám (#6B7280)
- **Phụ đề**: 10px, độ đậm 500, Xám, letter-spacing 1.5px, chữ in hoa

### Font giao diện
- **Họ font**: Inter, SF Pro, font hệ thống (sans-serif)
- **Độ đậm**: 400-600
- **Phong cách**: Gọn gàng, dễ đọc

---

## Chi tiết icon

### Thông số la bàn

Biểu tượng la bàn được dựng từ các thành phần hình học sau:

```
Thành phần          | Nét/Tô         | Màu
--------------------|----------------|------------------
Vòng ngoài          | nét 3px        | Đen / Trắng (chế độ tối)
Vạch hướng Bắc      | nét 2.5px      | Đen / Trắng (chế độ tối)
Vạch hướng chính khác| nét 2px       | Xám / Trắng 50% (chế độ tối)
Vạch hướng phụ      | nét 1.5px      | Xám / Trắng 40% (chế độ tối)
Kim hướng Bắc       | đa giác tô màu | #22C55E (luôn xanh lá)
Kim hướng Nam       | đa giác tô màu | Đen / Trắng (chế độ tối)
Ngoặc >             | nét 3px        | Đen / Trắng (chế độ tối)
Chấm tâm            | hình tròn tô màu| #22C55E (luôn xanh lá)
```

### Mức độ chi tiết theo kích thước

```
16px  → Chỉ có vòng + kim + chevron (tối giản)
32px  → Thêm vạch chia hướng chính
64px  → Thêm vạch chia hướng phụ
128px → Đầy đủ chi tiết, mọi thành phần sắc nét
256px → Chi tiết tối đa, nét vẽ dày
```

---

## Nguyên tắc kích thước

### Kích thước logo

- **Tối thiểu**: chiều rộng 200px (cho web)
- **Khuyến nghị**: 520px (kích thước gốc)
- **Tối đa**: Không giới hạn (định dạng vector)
- **Tỷ lệ khung hình**: ~4.3:1 (rộng:cao)

### Kích thước icon

- **Tối thiểu**: 16px (favicon)
- **Khuyến nghị**: 64-256px (ứng dụng, ảnh đại diện)
- **Tối đa**: Không giới hạn (định dạng vector)
- **Tỷ lệ khung hình**: 1:1 (hình vuông)

---

## Khoảng cách & căn chỉnh

### Khoảng cách quanh logo

```
┌─────────────────────────────────────┐
│                                     │
│     Khoảng trống tối thiểu          │
│       (chiều cao logo / 2)          │
│                                     │
│    [COMPASS]  Claude                │
│               How-To                │
│                                     │
└─────────────────────────────────────┘
```

### Điểm tâm của icon

Mọi icon đều căn tâm tại điểm giữa của canvas:
- 128×128 cho canvas 256px
- 64×64 cho canvas 128px
- Giữ căn chỉnh với các thành phần UI khác

---

## Khả năng tiếp cận

### Độ tương phản màu
- Mọi chữ đều đạt WCAG AA (tối thiểu 4.5:1)
- Màu nhấn xanh lá chỉ để trang trí, không mang thông tin
- Không phụ thuộc vào cặp màu đỏ-xanh lá

### Khả năng co giãn
- Định dạng vector đảm bảo rõ nét ở mọi kích thước
- Các hình khối hình học vẫn dễ nhận diện ở 16px
- Mức chi tiết tăng dần theo kích thước khả dụng

---

## Ví dụ ứng dụng

### Header web
- Kích thước: logo 520×120px
- File: `logos/claude-howto-logo.svg`
- Nền: Trắng hoặc tối (#0A0A0A)
- Padding: tối thiểu 20px

### Icon ứng dụng
- Kích thước: 256×256px
- File: `icons/claude-howto-icon.svg`
- Nền: Trắng hoặc tối
- Cách dùng: Lối tắt ứng dụng, ảnh đại diện

### Favicon trình duyệt
- Kích thước: 32px (chính), 16px (dự phòng)
- File: `favicons/favicon-32.svg`
- Định dạng: SVG để hiển thị sắc nét

### Mạng xã hội
- Ảnh hồ sơ: icon 256×256px
- Ảnh bìa: logo 520×120px (căn giữa)

### Tài liệu
- Header chương: Logo co giãn cho vừa
- Icon mục: favicon 64×64px
- Trong dòng: favicon 32×32px

---

## Chi tiết định dạng file

### Cấu trúc SVG

Mọi file SVG đều là thiết kế phẳng:
- Không gradient (chỉ màu đặc)
- Không hiệu ứng filter (không blur, glow hay shadow)
- Hình học nét vẽ và tô màu gọn gàng
- ViewBox để co giãn linh hoạt
- Code dễ đọc, có chú thích

### Tương thích trình duyệt

- Chrome/Edge: Hỗ trợ đầy đủ
- Firefox: Hỗ trợ đầy đủ
- Safari: Hỗ trợ đầy đủ
- iOS Safari: Hỗ trợ đầy đủ
- Mọi trình duyệt hiện đại: Hỗ trợ đầy đủ

---

## Tùy biến

### Thay đổi màu nhấn

Để tạo biến thể với màu nhấn khác:

1. Thay mọi chỗ có `#22C55E` bằng màu nhấn của bạn
2. Đảm bảo tỷ lệ tương phản trên 3:1 cho các thành phần trang trí
3. Giữ nguyên cấu trúc đen/trắng/xám

### Co giãn

```css
svg {
  width: 256px;
  height: 256px;
}
```

SVG tự động co giãn nhờ viewBox, không cần transform.

---

## Quản lý phiên bản

Theo dõi các thay đổi thiết kế bằng git:
- Quản lý phiên bản file SVG như bình thường (chúng là văn bản)
- Gắn tag cho các release có thay đổi thiết kế
- Đưa DESIGN-SYSTEM.md vào các commit

---

**Cập nhật lần cuối**: Tháng 2/2026
**Phiên bản hệ thống thiết kế**: 3.0
