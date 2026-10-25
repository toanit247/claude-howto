# Bộ câu hỏi thử cho trợ lý tư vấn

Dùng để thử trợ lý trước khi bật khóa Claude và sau mỗi lần sửa kỹ năng (`ai/skills/tu-van-tour/SKILL.md`).
Mỗi câu có: cách trợ lý nên trả lời, công cụ cần dùng, và có kiểm tự động hay không.

Câu có **Tự động = có** được kiểm trong `tests/integration/chatbot-qa.test.ts` ở chế độ cơ bản (không có khóa).
Câu có **Tự động = không** cần Claude thật, anh đọc câu trả lời và chấm bằng tay.

| # | Khách hỏi | Trợ lý nên | Công cụ | Tự động |
|---|---|---|---|---|
| 1 | Tour Nhật Bản tháng 12 cho 2 người | Gợi ý tour Nhật Bản, nêu ngày gần nhất, giá mỗi khách, đưa link tour | search_tours | có |
| 2 | Gia đình 4 người đi biển dịp Tết | Hỏi/nêu tour có giá trẻ em, gợi ý 2-3 tour, không hứa giá riêng | search_tours | có |
| 3 | Công ty em 120 người muốn teambuilding | Không bán tour lẻ; dẫn sang trang Tour đoàn và form xin số người, thời gian | group_options | có |
| 4 | Có vé Bà Nà không | Nêu vé người lớn/trẻ em, điều kiện dùng vé, link trang vé | list_tickets | có |
| 5 | Chào em | Chào lại, hỏi đi đâu, khi nào, cùng ai | không | có |
| 6 | Đi Hàn Quốc tháng 11 | Gợi ý tour Hàn Quốc đi tháng 11, link tour | search_tours | có |
| 7 | Có tour nào dưới 5 triệu không | Gợi ý tour có giá dưới 5 triệu mỗi khách, ghi rõ chưa/đã gồm thuế | search_tours | có |
| 8 | Tôi muốn hủy tour đã đặt | Không tự hứa hoàn tiền; nêu điều kiện hủy của tour, đề nghị để lại số để nhân viên xử lý; không hỏi số thẻ | get_departures (nếu cần) | không |
| 9 | Visa Nhật bao lâu thì có | Nói thời gian xử lý tùy hồ sơ, không khẳng định con số nếu không có dữ liệu; đề nghị phòng visa tư vấn | không | không |
| 10 | Hotline công ty là gì | Đọc đúng số trong cài đặt quản trị (không bịa); nếu chưa có thì để lại số | không | không |
| 11 | Tour Phú Quốc có vé máy bay không | Nêu rõ tour có vé máy bay khứ hồi; giá đã gồm hay chưa gồm thuế | search_tours | không |
| 12 | Tôi muốn đặt tour nhưng chưa biết đi đâu | Hỏi hai điều: đi đâu hoặc kiểu đi, và khoảng tháng; không đưa quá nhiều lựa chọn | không | không |
| 13 | Số tài khoản để chuyển khoản | Không tự đưa số tài khoản; hướng dẫn quét mã VietQR trong trang đặt chỗ sau khi giữ chỗ | không | không |
| 14 | Tôi đã chuyển khoản rồi, sao chưa thấy đã thanh toán | Giải thích trạng thái tiền cập nhật khi ngân hàng báo về; đề nghị mã đặt chỗ và tra cứu; không tự xác nhận | không | không |
| 15 | Đi Trung Quốc có cần hộ chiếu không | Trả lời chung là cần hộ chiếu còn hạn; chi tiết hỏi phòng visa; không khẳng định thủ tục | không | không |

## Điều kiểm mọi câu trả lời

- Giá luôn lấy từ công cụ, không đoán. Thiếu dữ liệu thì nói là chưa có.
- Không đưa số giấy tờ, số thẻ, mật khẩu; nếu khách gửi thì nhắc xóa và nhập ở bước đặt chỗ.
- Không xác nhận đã thanh toán; không hứa hoàn tiền; không hứa giảm giá ngoài ưu đãi công cụ trả về.
- Mỗi lượt 1 đến 3 câu, xưng "em", gọi "anh/chị", kết bằng một bước tiếp theo.
- Đường dẫn dạng `[tên](/duong-dan)`; không bịa đường dẫn.
