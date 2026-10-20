#!/usr/bin/env python3
"""Tính báo giá tour WonderTour từ file JSON.

Cách dùng:
    python3 tinh_bao_gia.py bao-gia.json

Logic:
    - Mỗi hạng mục có loai = "theo_khach" (nhân số khách tính tiền) hoặc "co_dinh" (cả đoàn).
    - Giá vốn = tổng các hạng mục + dự phòng phát sinh (% trên giá vốn).
    - Lợi nhuận chênh = tổng giá bán - tổng giá vốn.
    - Biên lãi gộp = lợi nhuận chênh / tổng giá bán.
    - Nếu chưa có gia_ban_moi_khach: tính giá bán tối thiểu để đạt biên tối thiểu.
"""

import json
import math
import sys


def vnd(x: float) -> str:
    return f"{x:,.0f}".replace(",", ".") + " đ"


def main(path: str) -> int:
    with open(path, encoding="utf-8") as f:
        d = json.load(f)

    khach_tinh_tien = d["so_khach_tinh_tien"]
    khach_mien_phi = d.get("so_khach_mien_phi", 0)
    tong_khach = khach_tinh_tien + khach_mien_phi
    if khach_tinh_tien <= 0:
        print("LỖI: số khách tính tiền phải lớn hơn 0")
        return 1

    thieu = []
    tong_von = 0.0
    print(f"{'Hạng mục':<38}{'Loại':<12}{'Đơn giá':>16}{'SL':>6}{'Ngày':>6}{'Thành tiền':>18}")
    for h in d["hang_muc"]:
        don_gia = h.get("don_gia")
        if don_gia is None:
            thieu.append(h["ten"])
            continue
        so_ngay = h.get("so_ngay", 1)
        if h["loai"] == "theo_khach":
            # Khách miễn phí vẫn phát sinh chi phí theo đầu người (phòng, ăn, vé).
            sl = h.get("so_luong", tong_khach)
        elif h["loai"] == "co_dinh":
            sl = h.get("so_luong", 1)
        else:
            print(f"LỖI: loại không hợp lệ ở '{h['ten']}': {h['loai']}")
            return 1
        tt = don_gia * sl * so_ngay
        tong_von += tt
        print(f"{h['ten'][:37]:<38}{h['loai']:<12}{vnd(don_gia):>16}{sl:>6}{so_ngay:>6}{vnd(tt):>18}")

    du_phong_pct = d.get("du_phong_phat_sinh_pct", 0) or 0
    du_phong = tong_von * du_phong_pct / 100
    gia_von = tong_von + du_phong
    print("-" * 96)
    print(f"Tổng hạng mục: {vnd(tong_von)}")
    print(f"Dự phòng phát sinh {du_phong_pct}%: {vnd(du_phong)}")
    print(f"GIÁ VỐN (giá sàn): {vnd(gia_von)}  |  {vnd(gia_von / khach_tinh_tien)}/khách tính tiền")

    bien_min = d.get("bien_lai_gop_toi_thieu_pct")
    if bien_min is not None:
        if bien_min >= 100:
            print("LỖI: biên tối thiểu phải nhỏ hơn 100%")
            return 1
        # Biên tính trên giá bán: gia_ban = gia_von / (1 - bien)
        gia_min_khach = math.ceil(gia_von / (1 - bien_min / 100) / khach_tinh_tien / 1000) * 1000
        print(f"Giá bán tối thiểu để đạt biên {bien_min}%: {vnd(gia_min_khach)}/khách")

    gia_ban = d.get("gia_ban_moi_khach")
    if gia_ban is not None:
        tong_ban = gia_ban * khach_tinh_tien
        loi_nhuan = tong_ban - gia_von
        bien = loi_nhuan / tong_ban * 100 if tong_ban else 0
        print(f"Giá bán: {vnd(gia_ban)}/khách  |  Tổng giá bán: {vnd(tong_ban)}")
        print(f"LỢI NHUẬN CHÊNH: {vnd(loi_nhuan)}  |  BIÊN LÃI GỘP: {bien:.1f}%")
        if loi_nhuan < 0:
            print("KẾT LUẬN: DƯỚI GIÁ SÀN. Không nhận nếu không có quyết định của CEO.")
        elif bien_min is None:
            print("KẾT LUẬN: Chưa có ngưỡng biên tối thiểu, chưa kết luận được.")
        elif bien < bien_min:
            print(f"KẾT LUẬN: CẦN DUYỆT (biên {bien:.1f}% < {bien_min}%).")
        else:
            print("KẾT LUẬN: ĐẠT.")

    if thieu:
        print("CẢNH BÁO: thiếu đơn giá, chưa tính vào giá vốn: " + ", ".join(thieu))
        return 2
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    sys.exit(main(sys.argv[1]))
