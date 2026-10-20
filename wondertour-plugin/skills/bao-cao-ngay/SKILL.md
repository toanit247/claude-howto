---
name: bao-cao-ngay
description: Đọc file báo cáo xuất từ ERP WonderTour (Excel/CSV) và tóm thành báo cáo điều hành một trang cho CEO: doanh số, lợi nhuận chênh, lead, booking, công nợ, đoàn sắp khởi hành, cảnh báo. Dùng khi có file xuất ERP trong ngày, khi CEO hỏi "hôm nay thế nào", hoặc khi chạy báo cáo hẹn giờ buổi sáng.
argument-hint: "[thư mục hoặc file xuất ERP hôm nay]"
---

# Báo cáo ngày cho CEO

Mục tiêu: CEO không phải mở ERP. Một trang, đọc trong 2 phút, biết hôm nay cần can thiệp vào đâu.

## Đầu vào

File xuất từ ERP (erp.wondertour.vn) đặt trong một thư mục theo ngày, ví dụ `bao-cao/2026-10-21/`. ERP chưa có API, nên file được xuất tay hoặc bốc qua trình duyệt.

Tên cột thực tế của từng file ghi trong `references/anh-xa-cot.md`. **File này chưa điền đủ**: người phụ trách dữ liệu cần mở một file xuất thật, ghi đúng tên cột vào bảng. Gặp cột không có trong bảng ánh xạ thì không đoán nghĩa; liệt kê ở cuối báo cáo mục "Cột chưa rõ".

## Quy trình

1. Liệt kê các file trong thư mục, nhận diện từng file thuộc loại nào (sales, tài chính, điều hành, công việc) theo bảng ánh xạ.
2. Đọc dữ liệu bằng code (pandas), không ước lượng bằng mắt. Mọi con số tổng phải ra từ phép tính.
3. Tính các chỉ số trong bảng đầu ra. Có dữ liệu hôm qua hoặc cùng kỳ tháng trước thì so sánh; không có thì để trống cột so sánh, không bịa.
4. Lọc cảnh báo theo quy tắc bên dưới.
5. Viết báo cáo theo đúng mẫu.

## Quy tắc cảnh báo

| Cảnh báo | Điều kiện |
|---|---|
| Deal dưới giá sàn | Lợi nhuận chênh âm |
| Deal biên thấp | Biên lãi gộp dưới ngưỡng tối thiểu (lấy từ skill `bao-gia-tour`) |
| Đoàn sắp đi chưa chốt dịch vụ | Khởi hành trong 7 ngày, còn hạng mục xe, khách sạn, vé chưa xác nhận |
| Công nợ quá hạn | Khách chưa thanh toán quá hạn hợp đồng |
| Lead bị bỏ quên | Lead quá 24 giờ chưa có người chăm |
| Lệnh chi bất thường | Một lệnh chi lớn hơn 3 lần trung bình 30 ngày của cùng hạng mục |

## Mẫu đầu ra

```text
BÁO CÁO NGÀY [dd/mm/yyyy]

1. CẦN ANH QUYẾT HÔM NAY (tối đa 3 việc, mỗi việc 1 dòng: việc gì, ai đang giữ, hạn)

2. CHỈ SỐ
| Chỉ số | Hôm nay | Lũy kế tháng | Kế hoạch tháng | % đạt |
| Doanh số ký mới | | | | |
| Lợi nhuận chênh | | | | |
| Lead mới / lead đã chăm | | | | |
| Booking mới | | | | |
| Thu tiền | | | | |
| Công nợ quá hạn | | | | |

3. THEO PHÒNG (KD1, KD2, Online, Doanh nghiệp, Chi nhánh): lợi nhuận chênh lũy kế so kế hoạch

4. ĐOÀN KHỞI HÀNH 7 NGÀY TỚI: mã đoàn | ngày | số khách | trạng thái dịch vụ

5. CẢNH BÁO: theo bảng quy tắc

6. CỘT CHƯA RÕ / DỮ LIỆU THIẾU
```

Không dùng dấu gạch ngang dài "—". Không kèm danh sách khách hàng chi tiết trong báo cáo gửi qua tin nhắn.
