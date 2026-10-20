# Plugin WonderTour v1.0

> Bản công khai. Skill kiểm tra hoa hồng sales không có ở đây vì chứa cơ chế lương nội bộ.

Bộ công cụ AI nội bộ, dựng theo mẫu module 03 (skills), 04 (tác nhân con), 06 (hooks), 07 (plugins) của repo claude-howto.

## Có gì trong bộ này

| Thành phần | Tên | Gọi bằng | Ai dùng |
|---|---|---|---|
| Skill | `content-toan-duong-days` | `/wondertour:content-toan-duong-days` hoặc tự kích hoạt | CEO, người viết content cá nhân |
| Skill | `duyet-content` | `/wondertour:duyet-content` | Marketing, CEO duyệt thứ Năm |
| Skill | `bao-gia-tour` | `/wondertour:bao-gia-tour` | Sales, trưởng phòng |
| Skill | `bao-cao-ngay` | `/wondertour:bao-cao-ngay` | CEO, kế toán |
| Tác nhân | `kiem-soat-lai-gop` | Claude tự gọi hoặc yêu cầu đích danh | Kế toán, CEO |
| Tác nhân | `dieu-hanh-doan` | Claude tự gọi hoặc yêu cầu đích danh | Điều hành |
| Tác nhân | `soan-proposal-mice` | Claude tự gọi hoặc yêu cầu đích danh | Sales doanh nghiệp |
| Hook | `chan_du_lieu_nhay_cam.py` | Tự chạy trước mọi thao tác ghi file | Mọi người |
| Mẫu | `templates/CLAUDE-wondertour.md` | Chép làm bối cảnh dự án | Mọi người |

## Phải điền trước khi phát cho nhân sự

| File | Cần điền | Người điền | Hạn đề xuất |
|---|---|---|---|
| `skills/bao-gia-tour/SKILL.md` | Biên lãi gộp tối thiểu, dự phòng phát sinh, người duyệt | CEO | Trước tuần 2 |
| `skills/bao-cao-ngay/references/anh-xa-cot.md` | Tên cột thật trong file xuất ERP, kế hoạch tháng từng phòng | Người phụ trách dữ liệu, kế toán | Trước tuần 3 |

Các ô chưa điền không làm skill chạy sai: skill sẽ dừng hoặc ghi rõ "chưa kết luận được", không đoán.

## Cài đặt

**Claude Code (máy có terminal):**

```bash
claude --plugin-dir ./wondertour-plugin
```

Hoặc chép cả thư mục vào `~/.claude/skills/wondertour/` để tự nạp mỗi phiên (Claude Code từ bản 2.1.157).

**App Claude của tổ chức:** quản trị viên tổ chức tải bộ plugin này lên danh mục plugin của tổ chức, sau đó từng người bật trong app. Cách bấm cụ thể theo giao diện hiện hành của Anthropic.

Hook cần Python 3 trên máy.

## Kiểm tra nhanh sau khi cài

```bash
python3 skills/bao-gia-tour/scripts/tinh_bao_gia.py skills/bao-gia-tour/templates/bao-gia-mau.json
```

Lệnh trên báo thiếu đơn giá một hạng mục và chưa kết luận vì chưa có ngưỡng biên tối thiểu. Đó là hành vi đúng với dữ liệu mẫu.

## Quy tắc dữ liệu

Không đưa vào skill hoặc file trong plugin: bảng lương từng người, giá vốn chi tiết theo nhà cung cấp, danh sách khách doanh nghiệp, số thẻ, số tài khoản, số CCCD. Plugin cài trên máy nhân viên, coi như tài liệu có thể bị chép ra ngoài.

## Bảo trì

Người bảo trì: `[CEO chỉ định]`. Mỗi lần sửa, tăng `version` trong `.claude-plugin/plugin.json` và ghi một dòng vào bảng dưới.

| Phiên bản | Ngày | Thay đổi |
|---|---|---|
| 1.0.0 | 21/10/2026 | Bản công khai: 4 skill, 3 tác nhân (skill kiểm tra hoa hồng giữ nội bộ), 1 hook, 1 mẫu bối cảnh |
