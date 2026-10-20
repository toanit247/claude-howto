# Mẫu Kế Hoạch Refactoring

Sử dụng mẫu này để ghi lại và theo dõi công việc refactoring của bạn.

---

## Thông Tin Dự Án

| Trường | Giá trị |
|-------|-------|
| **Dự Án/Module** | [Tên dự án] |
| **Các File Mục Tiêu** | [Danh sách các file cần refactor] |
| **Ngày Tạo** | [Ngày] |
| **Tác Giả** | [Tên] |
| **Trạng Thái** | Bản nháp / Đang review / Đã duyệt / Đang thực hiện / Hoàn thành |

---

## Tóm Tắt Tổng Quan

### Mục Tiêu
- [ ] [Mục tiêu chính: ví dụ, Cải thiện khả năng đọc của phần xử lý thanh toán]
- [ ] [Mục tiêu phụ: ví dụ, Giảm code trùng lặp]
- [ ] [Mục tiêu thứ ba: ví dụ, Cải thiện khả năng test]

### Ràng Buộc
- [ ] [Ràng buộc 1: ví dụ, Không được thay đổi public API]
- [ ] [Ràng buộc 2: ví dụ, Phải duy trì tương thích ngược]
- [ ] [Ràng buộc 3: ví dụ, Không thay đổi database schema]

### Mức Độ Rủi Ro
- [ ] Thấp: Thay đổi nhỏ, code đã được test kỹ
- [ ] Trung bình: Thay đổi vừa phải, có một số rủi ro
- [ ] Cao: Thay đổi đáng kể, cần chú ý cẩn thận

---

## Checklist Trước Khi Refactoring

### Đánh Giá Phủ Vùng Test

| Chỉ số | Hiện tại | Mục tiêu | Trạng thái |
|--------|---------|--------|--------|
| Phủ Vùng Unit Test | __%  | ≥80% | |
| Integration Tests | Có/Không | Có | |
| Tất Cả Tests Pass | Có/Không | Có | |

### Yêu Cầu Trước Khi Bắt Đầu
- [ ] Tất cả tests pass
- [ ] Code đã được review và hiểu rõ
- [ ] Đã có bản sao lưu/version control
- [ ] Đã nhận được sự chấp thuận của người dùng

---

## Các Code Smells Đã Xác Định

### Tóm Tắt

| # | Smell | Vị trí | Mức độ nghiêm trọng | Ưu tiên |
|---|-------|----------|----------|----------|
| 1 | [ví dụ, Long Method] | [file:dòng] | Cao | P1 |
| 2 | [ví dụ, Duplicate Code] | [file:dòng] | Trung bình | P2 |
| 3 | [ví dụ, Feature Envy] | [file:dòng] | Thấp | P3 |

### Phân Tích Chi Tiết

#### Smell #1: [Tên]

**Vị trí**: `path/to/file.js:45-120`

**Mô tả**: [Mô tả chi tiết vấn đề]

**Tác động**:
- [Tác động 1]
- [Tác động 2]

**Giải pháp đề xuất**: [Tổng quan ngắn gọn về cách khắc phục]

---

## Các Giai Đoạn Refactoring

### Giai Đoạn A: Quick Wins (Rủi Ro Thấp)

**Mục tiêu**: Các cải tiến đơn giản mang lại giá trị ngay lập tức

**Thay đổi ước tính**: [X files, Y methods]

**Cần chấp thuận của người dùng**: Có / Không

| # | Nhiệm vụ | File | Refactoring | Trạng thái |
|---|------|------|-------------|--------|
| A1 | Đổi tên biến `x` thành `userCount` | utils.js:15 | Rename Variable | [ ] |
| A2 | Xóa `oldHandler()` không được sử dụng | api.js:89 | Remove Dead Code | [ ] |
| A3 | Extract phần xác thực bị trùng lặp | form.js:23,67 | Extract Method | [ ] |

**Kế hoạch hoàn tác**: Revert các commit A1-A3

---

### Giai Đoạn B: Cải Tiến Cấu Trúc (Rủi Ro Trung Bình)

**Mục tiêu**: Cải thiện cách tổ chức và độ rõ ràng của code

**Thay đổi ước tính**: [X files, Y methods]

**Cần chấp thuận của người dùng**: Có

**Phụ thuộc**: Giai Đoạn A phải hoàn thành

| # | Nhiệm vụ | File | Refactoring | Trạng thái |
|---|------|------|-------------|--------|
| B1 | Extract `calculatePrice()` từ method dài | order.js:45 | Extract Method | [ ] |
| B2 | Introduce parameter object `OrderDetails` | order.js:12 | Introduce Parameter Object | [ ] |
| B3 | Di chuyển `formatAddress()` sang class Address | customer.js:78 | Move Method | [ ] |

**Kế hoạch hoàn tác**: Revert về commit sau Giai Đoạn A

---

### Giai Đoạn C: Thay Đổi Kiến Trúc (Rủi Ro Cao Hơn)

**Mục tiêu**: Giải quyết các vấn đề cấu trúc sâu hơn

**Thay đổi ước tính**: [X files, Y methods]

**Cần chấp thuận của người dùng**: Có

**Phụ thuộc**: Giai Đoạn A và B phải hoàn thành

| # | Nhiệm vụ | File | Refactoring | Trạng thái |
|---|------|------|-------------|--------|
| C1 | Thay switch tính giá bằng polymorphism | pricing.js:30 | Replace Conditional with Polymorphism | [ ] |
| C2 | Extract class `NotificationService` | user.js:100 | Extract Class | [ ] |

**Kế hoạch hoàn tác**: Revert về commit sau Giai Đoạn B

---

## Các Bước Refactoring Chi Tiết

### Nhiệm Vụ [ID]: [Tên Nhiệm Vụ]

**Smell được giải quyết**: [Tên smell]

**Kỹ thuật refactoring**: [Tên kỹ thuật]

**Mức độ rủi ro**: Thấp / Trung bình / Cao

#### Bối Cảnh

**Trước** (Trạng thái hiện tại):
```javascript
// Dán code hiện tại vào đây
```

**Sau** (Trạng thái mong đợi):
```javascript
// Dán code mong đợi vào đây
```

#### Cơ Chế Từng Bước

1. [ ] **Bước 1**: [Mô tả]
   - Test: Chạy tests sau bước này
   - Mong đợi: Tất cả tests pass

2. [ ] **Bước 2**: [Mô tả]
   - Test: Chạy tests sau bước này
   - Mong đợi: Tất cả tests pass

3. [ ] **Bước 3**: [Mô tả]
   - Test: Chạy tests sau bước này
   - Mong đợi: Tất cả tests pass

#### Xác Minh

- [ ] Tất cả tests pass
- [ ] Hành vi không thay đổi
- [ ] Code biên dịch được
- [ ] Không có cảnh báo mới

#### Thông Điệp Commit
```
refactor: [Describe the refactoring]
```

---

## Theo Dõi Tiến Độ

### Trạng Thái Các Giai Đoạn

| Giai đoạn | Trạng thái | Bắt đầu | Hoàn thành | Tests Pass |
|-------|--------|---------|-----------|---------------|
| A | Chưa bắt đầu / Đang thực hiện / Xong | | | |
| B | Chưa bắt đầu / Đang thực hiện / Xong | | | |
| C | Chưa bắt đầu / Đang thực hiện / Xong | | | |

### Các Vấn Đề Gặp Phải

| # | Vấn đề | Cách giải quyết | Trạng thái |
|---|-------|------------|--------|
| 1 | [Mô tả] | [Cách đã giải quyết] | Mở / Đã giải quyết |

---

## So Sánh Metrics

### Trước Khi Refactoring

| Chỉ số | File 1 | File 2 | Tổng |
|--------|--------|--------|-------|
| Số Dòng Code | | | |
| Độ Phức Tạp Vòng (Cyclomatic Complexity) | | | |
| Chỉ Số Khả Năng Bảo Trì (Maintainability Index) | | | |
| Số Lượng Methods | | | |
| Độ Dài Method Trung Bình | | | |

### Sau Khi Refactoring

| Chỉ số | File 1 | File 2 | Tổng | Thay đổi |
|--------|--------|--------|-------|--------|
| Số Dòng Code | | | | |
| Độ Phức Tạp Vòng (Cyclomatic Complexity) | | | | |
| Chỉ Số Khả Năng Bảo Trì (Maintainability Index) | | | | |
| Số Lượng Methods | | | | |
| Độ Dài Method Trung Bình | | | | |

---

## Checklist Sau Khi Refactoring

- [ ] Tất cả tests pass
- [ ] Không có cảnh báo hoặc lỗi mới
- [ ] Code biên dịch thành công
- [ ] Đã hoàn tất xác minh thủ công
- [ ] Tài liệu đã được cập nhật (nếu cần)
- [ ] Code đã được review
- [ ] Metrics đã được cải thiện
- [ ] Đã nhận được xác nhận của người dùng

---

## Bài Học Kinh Nghiệm

### Những Gì Làm Tốt
- [Mục 1]
- [Mục 2]

### Những Gì Có Thể Cải Thiện
- [Mục 1]
- [Mục 2]

### Khuyến Nghị Cho Tương Lai
- [Mục 1]
- [Mục 2]

---

## Phê Duyệt

| Vai trò | Tên | Ngày | Chữ ký |
|------|------|------|-----------|
| Người Lập Kế Hoạch | | | |
| Trưởng Nhóm Kỹ Thuật | | | |
| Product Owner | | | |

---

## Phụ Lục

### A. Tài Liệu Liên Quan
- [Liên kết đến các tài liệu liên quan]

### B. Tài Liệu Tham Khảo
- [Liên kết đến danh mục code smells]
- [Liên kết đến danh mục refactoring]

### C. Công Cụ Sử Dụng
- [Framework testing]
- [Công cụ linting]
- [Công cụ phân tích độ phức tạp]

---

**Cập Nhật Lần Cuối**: Ngày 4 tháng 8 năm 2026
**Phiên Bản Claude Code**: 2.1.220
**Nguồn**:
- https://code.claude.com/docs/en/skills
**Các Mô Hình Tương Thích**: Claude Fable 5, Claude Opus 5, Claude Sonnet 5, Claude Sonnet 4.6, Claude Opus 4.8, Claude Haiku 4.5
