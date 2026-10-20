---
name: bao-gia-tour
description: Lập và kiểm tra báo giá tour, MICE, teambuilding, gala cho WonderTour. Tính giá vốn từng hạng mục, giá bán, lợi nhuận chênh và biên lãi gộp; cảnh báo deal dưới giá sàn hoặc dưới biên tối thiểu. Dùng khi sales cần lên báo giá, khi cần soát lại một báo giá trước khi gửi khách, hoặc khi khách ép giá và cần biết còn giảm được bao nhiêu.
argument-hint: "[thông tin đoàn: điểm đến, ngày, số khách, hạng mục] hoặc [file báo giá cần soát]"
---

# Báo giá tour WonderTour

Nguyên tắc: không bán rẻ bằng mọi giá. Giá sàn bằng giá vốn. Lợi nhuận chênh = giá bán trừ giá sàn, là lãi gộp thật của deal và là căn cứ tính hoa hồng sales.

## Thông số công ty (CEO điền trước khi phát hành plugin)

| Thông số | Giá trị | Ghi chú |
|---|---|---|
| Biên lãi gộp tối thiểu, tour doanh nghiệp/MICE | `[CEO điền, ví dụ 12%]` | Dưới mức này phải xin duyệt |
| Biên lãi gộp tối thiểu, khách lẻ/ghép | `[CEO điền]` | |
| Dự phòng phát sinh | `[CEO điền, ví dụ 3% giá vốn]` | Cộng vào giá vốn |
| Người duyệt deal dưới biên | `[CEO điền]` | |

Nếu ô nào còn ngoặc vuông, vẫn tính nhưng ghi rõ ở đầu kết quả: "Chưa có ngưỡng biên tối thiểu, chưa kết luận được deal đạt hay không."

## Quy trình

1. **Thu thập đầu vào.** Điểm đến, ngày đi, số đêm, số khách (người lớn, trẻ em, miễn phí), hạng khách sạn, phương tiện, bữa ăn, HDV, vé tham quan, sự kiện (gala, teambuilding), bảo hiểm, visa, VAT. Thiếu hạng mục chính thì hỏi một lần, gom tất cả câu hỏi vào một tin.
2. **Bảng giá vốn** theo từng hạng mục: đơn giá × số lượng × số ngày. Tách rõ chi phí theo đầu khách và chi phí cố định cả đoàn (xe, HDV, MC, âm thanh ánh sáng). Không tự bịa đơn giá nhà cung cấp; thiếu thì để `[cần giá NCC]`.
3. **Tính toán bằng script** `scripts/tinh_bao_gia.py` để tránh sai số học:

   ```bash
   python3 scripts/tinh_bao_gia.py bao-gia.json
   ```

   File JSON theo mẫu `templates/bao-gia-mau.json`.
4. **Kiểm tra** trước khi kết luận:
   - Tổng giá vốn khớp tổng từng dòng.
   - Chi phí cố định đã chia đúng số khách tính tiền (không chia cho khách miễn phí).
   - VAT tính một lần, đúng chỗ (trên giá bán hay đã gồm trong giá NCC).
   - Biên lãi gộp = lợi nhuận chênh / giá bán (không chia cho giá vốn).
5. **Kết luận** deal: Đạt / Cần duyệt / Không nên nhận, kèm lý do bằng con số.

## Khi khách ép giá

Tính ngược: giá bán thấp nhất còn giữ được biên tối thiểu. Đề xuất cắt hạng mục (đổi hạng khách sạn, bớt một bữa đặc biệt, gộp xe) trước khi cắt lãi. Mỗi phương án ghi rõ giảm bao nhiêu tiền mỗi khách và khách mất gì.

## Đầu ra

- Bảng giá vốn theo hạng mục.
- Bảng tóm tắt: tổng giá vốn, giá bán/khách, tổng giá bán, lợi nhuận chênh, biên lãi gộp, kết luận.
- Bản báo giá gửi khách: chỉ có giá bán và dịch vụ bao gồm/không bao gồm. **Không bao giờ để lộ giá vốn hay lợi nhuận trong bản gửi khách.**
- Với MICE từ 100 khách: gợi ý case đoàn tương tự từ danh sách đã xác nhận để đưa vào proposal (dùng tác nhân `soan-proposal-mice` nếu cần proposal đầy đủ).
