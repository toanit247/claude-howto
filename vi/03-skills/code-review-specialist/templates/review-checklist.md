# Danh Sách Kiểm Tra Review Code

## Danh Sách Kiểm Tra Bảo Mật
- [ ] Không có thông tin đăng nhập hoặc secrets được hardcode
- [ ] Xác thực đầu vào cho mọi dữ liệu người dùng nhập
- [ ] Ngăn chặn SQL injection (truy vấn tham số hóa)
- [ ] Bảo vệ CSRF cho các thao tác thay đổi trạng thái
- [ ] Ngăn chặn XSS bằng cách escape đúng cách
- [ ] Kiểm tra xác thực trên các endpoint được bảo vệ
- [ ] Kiểm tra ủy quyền trên các tài nguyên
- [ ] Băm mật khẩu an toàn (bcrypt, argon2)
- [ ] Không có dữ liệu nhạy cảm trong log
- [ ] Bắt buộc dùng HTTPS

## Danh Sách Kiểm Tra Hiệu Suất
- [ ] Không có truy vấn N+1
- [ ] Sử dụng index phù hợp
- [ ] Triển khai caching ở những nơi có lợi
- [ ] Không có thao tác chặn (blocking) trên main thread
- [ ] Sử dụng async/await đúng cách
- [ ] Phân trang cho các tập dữ liệu lớn
- [ ] Dùng pool cho các kết nối cơ sở dữ liệu
- [ ] Biểu thức chính quy được tối ưu hóa
- [ ] Không tạo object không cần thiết
- [ ] Ngăn chặn rò rỉ bộ nhớ

## Danh Sách Kiểm Tra Chất Lượng
- [ ] Hàm < 50 dòng
- [ ] Đặt tên biến rõ ràng
- [ ] Không có code trùng lặp
- [ ] Xử lý lỗi đúng cách
- [ ] Comment giải thích TẠI SAO, không phải CÁI GÌ
- [ ] Không có console.log trong production
- [ ] Kiểm tra kiểu (TypeScript/JSDoc)
- [ ] Tuân thủ các nguyên tắc SOLID
- [ ] Áp dụng design pattern đúng cách
- [ ] Code tự mô tả (self-documenting)

## Danh Sách Kiểm Tra Testing
- [ ] Đã viết unit test
- [ ] Bao phủ các trường hợp biên
- [ ] Đã test các kịch bản lỗi
- [ ] Có integration test
- [ ] Độ bao phủ > 80%
- [ ] Không có test chập chờn (flaky)
- [ ] Mock các dependencies bên ngoài
- [ ] Tên test rõ ràng

---

**Cập Nhật Lần Cuối**: Ngày 4 tháng 8 năm 2026
**Phiên Bản Claude Code**: 2.1.220
**Nguồn**:
- https://code.claude.com/docs/en/skills
**Các Mô Hình Tương Thích**: Claude Fable 5, Claude Opus 5, Claude Sonnet 5, Claude Sonnet 4.6, Claude Opus 4.8, Claude Haiku 4.5
