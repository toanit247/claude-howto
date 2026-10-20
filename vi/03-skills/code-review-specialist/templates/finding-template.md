# Mẫu Ghi Nhận Phát Hiện Review Code

Sử dụng mẫu này khi ghi lại từng vấn đề được phát hiện trong quá trình review code.

---

## Vấn Đề: [TIÊU ĐỀ]

### Mức Độ Nghiêm Trọng
- [ ] Nguy Kịch (chặn việc triển khai)
- [ ] Cao (nên sửa trước khi merge)
- [ ] Trung Bình (nên sửa sớm)
- [ ] Thấp (có thì tốt)

### Danh Mục
- [ ] Bảo Mật
- [ ] Hiệu Suất
- [ ] Chất Lượng Code
- [ ] Khả Năng Bảo Trì
- [ ] Testing
- [ ] Design Pattern
- [ ] Tài Liệu

### Vị Trí
**File:** `src/components/UserCard.tsx`

**Dòng:** 45-52

**Hàm/Phương Thức:** `renderUserDetails()`

### Mô Tả Vấn Đề

**Cái gì:** Mô tả vấn đề là gì.

**Tại sao quan trọng:** Giải thích tác động và lý do cần sửa vấn đề này.

**Hành vi hiện tại:** Trình bày đoạn code hoặc hành vi có vấn đề.

**Hành vi mong đợi:** Mô tả điều nên xảy ra thay vào đó.

### Ví Dụ Code

#### Hiện Tại (Có Vấn Đề)

```typescript
// Minh họa vấn đề truy vấn N+1
const users = fetchUsers();
users.forEach(user => {
  const posts = fetchUserPosts(user.id); // Mỗi user một truy vấn!
  renderUserPosts(posts);
});
```

#### Đề Xuất Khắc Phục

```typescript
// Đã tối ưu bằng truy vấn JOIN
const usersWithPosts = fetchUsersWithPosts();
usersWithPosts.forEach(({ user, posts }) => {
  renderUserPosts(posts);
});
```

### Phân Tích Tác Động

| Khía Cạnh | Tác Động | Mức Độ |
|--------|--------|----------|
| Hiệu Suất | Hơn 100 truy vấn cho 20 user | Cao |
| Trải Nghiệm Người Dùng | Tải trang chậm | Cao |
| Khả Năng Mở Rộng | Hỏng khi quy mô lớn | Nguy Kịch |
| Khả Năng Bảo Trì | Khó debug | Trung Bình |

### Vấn Đề Liên Quan

- Vấn đề tương tự trong `AdminUserList.tsx` dòng 120
- PR liên quan: #456
- Issue liên quan: #789

### Tài Nguyên Bổ Sung

- [N+1 Query Problem](https://en.wikipedia.org/wiki/N%2B1_problem)
- [Database Join Documentation](https://docs.example.com/joins)

### Ghi Chú Của Reviewer

- Đây là một pattern phổ biến trong codebase này
- Cân nhắc bổ sung điều này vào hướng dẫn phong cách code
- Có thể đáng để tạo một hàm helper

### Phản Hồi Của Tác Giả (cho feedback)

*Do tác giả code điền:*

- [ ] Đã sửa trong commit: `abc123`
- [ ] Trạng thái sửa: Hoàn Thành / Đang Thực Hiện / Cần Thảo Luận
- [ ] Câu hỏi hoặc băn khoăn: (mô tả)

---

## Thống Kê Phát Hiện (cho Reviewer)

Khi review nhiều phát hiện, hãy theo dõi:

- **Tổng Số Vấn Đề Phát Hiện:** X
- **Nguy Kịch:** X
- **Cao:** X
- **Trung Bình:** X
- **Thấp:** X

**Khuyến Nghị:** ✅ Chấp Thuận / ⚠️ Yêu Cầu Thay Đổi / 🔄 Cần Thảo Luận

**Chất Lượng Code Tổng Thể:** 1-5 sao

---

**Cập Nhật Lần Cuối**: Ngày 4 tháng 8 năm 2026
**Phiên Bản Claude Code**: 2.1.220
**Nguồn**:
- https://code.claude.com/docs/en/skills
**Các Mô Hình Tương Thích**: Claude Fable 5, Claude Opus 5, Claude Sonnet 5, Claude Sonnet 4.6, Claude Opus 4.8, Claude Haiku 4.5
