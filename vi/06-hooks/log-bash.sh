#!/bin/bash
# Ghi log tất cả lệnh bash
# Hook: PostToolUse (matcher: Bash)
#
# Đọc lệnh đã thực thi từ JSON trên stdin và ghi log vào một file.
#
# Tương thích với: macOS, Linux, Windows (Git Bash)

# Đọc JSON đầu vào từ stdin (giao thức hook của Claude Code)
INPUT=$(cat)

# Trích xuất lệnh bash từ tool_input
# Lưu ý: sed [^"]* dừng tại dấu nháy kép đã escape trong JSON; với các lệnh có chuỗi
# trong nháy kép, chỉ phần trước dấu \" đầu tiên được lấy. Đây là giới hạn đã biết
# của cách phân tích JSON bằng sed và chấp nhận được cho mục đích ghi log.
COMMAND=$(echo "$INPUT" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)

if [ -z "$COMMAND" ]; then
  exit 0
fi

TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
LOGFILE="$HOME/.claude/bash-commands.log"

# Tạo thư mục log nếu chưa tồn tại
mkdir -p "$(dirname "$LOGFILE")"

# Ghi log lệnh
echo "[$TIMESTAMP] $COMMAND" >> "$LOGFILE"

exit 0
