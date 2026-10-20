#!/bin/bash
# Kiểm tra an toàn trước khi chạy lệnh Bash
# Hook: PreToolUse (matcher: Bash)
#
# Hook này chạy trước mỗi lần thực thi công cụ Bash và chặn hoặc cảnh báo
# các lệnh shell có khả năng phá hủy hoặc rủi ro cao.
#
# Cài đặt:
#   cp 06-hooks/pre-tool-check.sh ~/.claude/hooks/
#   chmod +x ~/.claude/hooks/pre-tool-check.sh
#
# Cấu hình trong ~/.claude/settings.json:
#   {
#     "hooks": {
#       "PreToolUse": [
#         {
#           "matcher": "Bash",
#           "hooks": [
#             {
#               "type": "command",
#               "command": "~/.claude/hooks/pre-tool-check.sh"
#             }
#           ]
#         }
#       ]
#     }
#   }
#
# Đầu vào: JSON qua stdin có dạng:
#   { "tool_name": "Bash", "tool_input": { "command": "..." } }
#
# Quy ước đầu ra (theo giao thức hook của Claude Code):
#   - exit 0 → cho phép. stdout có thể chứa JSON (hookSpecificOutput); stderr
#     bị bỏ qua âm thầm, nên các cảnh báo in ra stderr sẽ KHÔNG hiển thị.
#     Để quan sát các lệnh được cho phép, hãy ghi vào một file audit log.
#   - exit 2 → chặn. stderr được gửi lại cho Claude làm lý do chặn.
#     Mọi lệnh echo giải thích *vì sao* một lệnh bị chặn BẮT BUỘC phải chuyển hướng
#     sang stderr bằng `>&2`, nếu không Claude Code sẽ báo "No stderr output".
#
# Audit log: mọi lần gọi đều được ghi vào
#   $CLAUDE_PROJECT_DIR/.claude/hooks/audit.log
# kèm quyết định (BLOCK/WARN/ALLOW), nhờ đó bạn có thể quan sát các khớp mức WARN
# dù đầu ra stderr của chúng bị Claude Code bỏ đi.

# Đọc toàn bộ JSON đầu vào từ stdin
INPUT=$(cat)

# Trích xuất lệnh bằng sed tương thích đa nền tảng (macOS và Linux)
COMMAND=$(echo "$INPUT" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)

# Dùng đầu vào thô nếu trích xuất thất bại
if [ -z "$COMMAND" ]; then
  COMMAND="$INPUT"
fi

# ── Audit log ─────────────────────────────────────────────────────────────────
# Ghi lại mọi lần gọi kèm quyết định cuối cùng. Đây là cách đáng tin cậy duy nhất
# để quan sát mức WARN, vì Claude Code âm thầm bỏ stderr khi exit 0.
# Dùng $(pwd) khi hook được gọi bên ngoài Claude Code
# (ví dụ khi kiểm thử cục bộ).
LOG_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude/hooks"
LOG_FILE="$LOG_DIR/audit.log"
mkdir -p "$LOG_DIR" 2>/dev/null
log_decision() {
  echo "$(date -u +%FT%TZ) [$1] $COMMAND" >> "$LOG_FILE"
}

# ── Các mẫu bị chặn ───────────────────────────────────────────────────────────
# Các lệnh này bị chặn vô điều kiện vì chúng gần như luôn mang tính phá hủy
# và hiếm khi là chủ ý trong ngữ cảnh tự động.

BLOCKED_PATTERNS=(
  # Neo `rm -rf /` để `/` phải được theo sau bởi khoảng trắng hoặc cuối dòng,
  # nếu không việc khớp chuỗi con sẽ báo nhầm, ví dụ `rm -rf /tmp/foo`.
  "rm -rf /([[:space:]]|$)"
  "rm -rf \*"
  "dd if=/dev/zero"
  "dd if=/dev/random"
  ":\(\)\{:\|:&\};:"  # Fork bomb (đã escape các ký tự đặc biệt của regex)
  "mkfs\."           # Định dạng hệ thống file
  "format c:"        # Định dạng ổ đĩa Windows
)

for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    log_decision "BLOCK:$pattern"
    # Các lệnh echo này BẮT BUỘC phải ra stderr: Claude Code hiển thị stderr làm
    # lý do chặn khi exit 2. Ghi ra stdout sẽ hiện "No stderr output".
    echo "❌ Đã chặn: Phát hiện lệnh có khả năng phá hủy: $pattern" >&2
    echo "   Lệnh: $COMMAND" >&2
    exit 2
  fi
done

# ── Các mẫu cảnh báo ──────────────────────────────────────────────────────────
# Các mẫu này rủi ro nhưng có thể là chủ ý. Ghi cảnh báo và cho phép.

WARNING_PATTERNS=(
  "rm -rf"
  "git push --force"
  "git reset --hard"
  "git clean -f"
  "chmod -R 777"
  "sudo rm"
  "DROP TABLE"
  "DROP DATABASE"
  "truncate"
)

MATCHED_WARNINGS=""
for pattern in "${WARNING_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qi "$pattern"; then
    MATCHED_WARNINGS="${MATCHED_WARNINGS:+$MATCHED_WARNINGS,}$pattern"
    # In lại cảnh báo ra stderr cho người chạy hook thủ công.
    # Claude Code bỏ phần này khi exit 0, audit log mới là bản ghi
    # đáng tin cậy (xem các mục WARN).
    echo "⚠️  Cảnh báo: Phát hiện thao tác rủi ro cao: $pattern" >&2
  fi
done

if [ -n "$MATCHED_WARNINGS" ]; then
  log_decision "WARN:$MATCHED_WARNINGS"
  echo "   Lệnh: $COMMAND" >&2
  echo "   Tiếp tục thực thi, hãy xem lại các cảnh báo ở trên trước khi tiếp tục." >&2
else
  log_decision "ALLOW"
fi

# ── Cho phép ──────────────────────────────────────────────────────────────────
exit 0
