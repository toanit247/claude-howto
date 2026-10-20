#!/usr/bin/env bash
# Hook SessionEnd: ghi lại các module đã học, sau đó nối thêm một bản ghi phiên
# vào ~/.claude-howto-progress.json để theo dõi tiến độ học tập lâu dài.
#
# Chạy một lần khi phiên Claude Code kết thúc, không chạy sau mỗi phản hồi.
# Hook chạy không có terminal điều khiển (/dev/tty không khả dụng), nên module và
# ghi chú được lấy từ các biến môi trường CLAUDE_HOWTO_MODULES / CLAUDE_HOWTO_NOTES.
#
# Cài đặt: thêm vào .claude/settings.json dưới sự kiện "SessionEnd" (xem bên dưới).

PROGRESS_FILE="$HOME/.claude-howto-progress.json"

# Bảo vệ: chỉ chạy bên trong repo này
if [[ "$CLAUDE_PROJECT_DIR" != *"claude-howto"* ]] && [[ "$PWD" != *"claude-howto"* ]]; then
  exit 0
fi

# Tạo file tiến độ nếu chưa tồn tại
if [ ! -f "$PROGRESS_FILE" ]; then
  echo '{"sessions":[]}' > "$PROGRESS_FILE"
fi

DATE=$(date +"%Y-%m-%d")
TIME=$(date +"%H:%M")

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Claude Code: Kết thúc phiên học"
echo " $DATE $TIME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
# Các module đã học, ví dụ khởi chạy bằng: CLAUDE_HOWTO_MODULES=06,07 claude
# 01=Slash  02=Memory  03=Skills  04=Subagents  05=MCP
# 06=Hooks  07=Plugins 08=Checkpoints 09=Advanced 10=CLI
INPUT="${CLAUDE_HOWTO_MODULES:-}"

if [ -z "$INPUT" ] || [ "$INPUT" = "skip" ]; then
  echo " Đã bỏ qua, không ghi lại phiên nào."
  echo ""
  exit 0
fi

# Ánh xạ số ngắn sang tên module (dùng vòng for thay cho pipeline+while, vì bash 3.2 không phân tích được)
IFS=',' read -ra PARTS <<< "$INPUT"
MODULES_JSON=""
for m in "${PARTS[@]}"; do
  m="${m// /}"  # bỏ khoảng trắng
  case "$m" in
    01) label='"01-slash-commands"' ;;
    02) label='"02-memory"' ;;
    03) label='"03-skills"' ;;
    04) label='"04-subagents"' ;;
    05) label='"05-mcp"' ;;
    06) label='"06-hooks"' ;;
    07) label='"07-plugins"' ;;
    08) label='"08-checkpoints"' ;;
    09) label='"09-advanced-features"' ;;
    10) label='"10-cli"' ;;
    *)  label="\"$m\"" ;;
  esac
  MODULES_JSON="${MODULES_JSON:+$MODULES_JSON,}$label"
done

# Ghi chú tùy chọn, ví dụ CLAUDE_HOWTO_NOTES="tried the pre-commit example"
NOTES="${CLAUDE_HOWTO_NOTES:-}"

# Truyền NOTES như một tham số riêng để Python xử lý việc escape JSON,
# tránh JSON bị hỏng khi ghi chú chứa dấu nháy hoặc dấu gạch chéo ngược.
python3 - "$PROGRESS_FILE" "$DATE" "$TIME" "$MODULES_JSON" "$NOTES" <<'PYEOF'
import sys, json

path, date, time_str, modules_raw, notes = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]

new_session = {
    "date": date,
    "time": time_str,
    "modules": json.loads(f"[{modules_raw}]") if modules_raw else [],
    "notes": notes,
}

with open(path, 'r') as f:
    data = json.load(f)

data.setdefault('sessions', []).append(new_session)

with open(path, 'w') as f:
    json.dump(data, f, indent=2)
PYEOF

echo ""
echo " Đã lưu vào $PROGRESS_FILE"
[ -n "$NOTES" ] && echo " Ghi chú: $NOTES"
echo ""

exit 0
