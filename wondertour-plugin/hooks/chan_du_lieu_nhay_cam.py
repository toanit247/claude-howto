#!/usr/bin/env python3
"""Hook PreToolUse: chặn ghi file có chứa số thẻ ngân hàng hoặc số tài khoản.

Đọc JSON sự kiện từ stdin. Thoát mã 2 kèm thông báo stderr để Claude Code chặn thao tác.
Thoát mã 0 để cho phép.

Phát hiện:
  - Số thẻ: 13 đến 19 chữ số (cho phép khoảng trắng hoặc gạch nối), qua kiểm tra Luhn.
  - Số tài khoản: các cụm "STK", "số tài khoản", "số TK", "account no" theo sau là 8 đến 19 chữ số.
  - CCCD: cụm "CCCD", "căn cước", "CMND" theo sau là 9 hoặc 12 chữ số.
"""

import json
import re
import sys

CARD_RE = re.compile(r"(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)")
ACCOUNT_RE = re.compile(
    r"(?i)(stk|s[ốo] t[àa]i kho[ảa]n|s[ốo] tk|account\s*(no|number))\s*[:.#]?\s*(\d[\d .-]{6,22}\d)"
)
ID_RE = re.compile(r"(?i)(cccd|c[ăa]n c[ưu][ớo]c|cmnd)\s*[:.#]?\s*(\d{12}|\d{9})(?!\d)")


def luhn_ok(digits: str) -> bool:
    total = 0
    for i, ch in enumerate(reversed(digits)):
        n = int(ch)
        if i % 2 == 1:
            n *= 2
            if n > 9:
                n -= 9
        total += n
    return total % 10 == 0


def find_issues(text: str) -> list[str]:
    issues = []
    for m in CARD_RE.finditer(text):
        digits = re.sub(r"\D", "", m.group(0))
        if 13 <= len(digits) <= 19 and luhn_ok(digits) and len(set(digits)) > 1:
            issues.append(f"số thẻ ngân hàng (đuôi {digits[-4:]})")
    for m in ACCOUNT_RE.finditer(text):
        digits = re.sub(r"\D", "", m.group(3))
        if 8 <= len(digits) <= 19:
            issues.append(f"số tài khoản (đuôi {digits[-4:]})")
    for m in ID_RE.finditer(text):
        issues.append(f"số CCCD/CMND (đuôi {m.group(2)[-3:]})")
    return issues


def main() -> int:
    try:
        event = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return 0  # Không đọc được sự kiện thì không chặn.

    ti = event.get("tool_input", {}) or {}
    parts = [ti.get("content", ""), ti.get("new_string", "")]
    for e in ti.get("edits", []) or []:
        parts.append(e.get("new_string", ""))
    text = "\n".join(p for p in parts if isinstance(p, str))

    issues = find_issues(text)
    if issues:
        path = ti.get("file_path", "file")
        uniq = sorted(set(issues))
        print(
            f"Đã chặn ghi vào {path}: nội dung có {', '.join(uniq)}. "
            "Quy định WonderTour: không lưu số thẻ, số tài khoản, số CCCD vào file. "
            "Hãy che bớt (ví dụ chỉ giữ 4 số cuối) rồi ghi lại.",
            file=sys.stderr,
        )
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
