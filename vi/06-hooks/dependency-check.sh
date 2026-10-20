#!/bin/bash
# Kiểm tra các lỗ hổng đã biết trong dependencies sau khi các file manifest bị sửa đổi.
# Hook: PostToolUse (matcher: Write)
#
# Đọc đường dẫn file đích từ JSON trên stdin (giao thức hook của Claude Code).
# Nguồn: https://code.claude.com/docs/en/hooks

# Đọc JSON đầu vào từ stdin (giao thức hook của Claude Code)
INPUT=$(cat)

# Trích xuất file_path bằng sed (tương thích mọi nền tảng)
FILE=$(echo "$INPUT" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)

if [ -z "$FILE" ]; then
  exit 0
fi

# Dùng basename để so khớp, vì file_path có thể là đường dẫn tuyệt đối
BASENAME=$(basename "$FILE")

# Chỉ chạy khi một file manifest dependency được ghi
case "$BASENAME" in
  package.json|package-lock.json|yarn.lock|pnpm-lock.yaml| \
  requirements.txt|Pipfile|Pipfile.lock|pyproject.toml| \
  go.mod|go.sum| \
  Cargo.toml|Cargo.lock| \
  Gemfile|Gemfile.lock| \
  composer.json|composer.lock| \
  pom.xml|build.gradle|build.gradle.kts)
    echo "📦 Manifest dependency đã được cập nhật: $FILE, đang quét lỗ hổng..."
    ;;
  *)
    exit 0
    ;;
esac

ISSUES_FOUND=0

# ── npm / yarn / pnpm ────────────────────────────────────────────────────────
if [[ "$BASENAME" == package*.json || "$BASENAME" == yarn.lock || "$BASENAME" == pnpm-lock.yaml ]]; then
  if command -v npm &>/dev/null; then
    echo "🔍 Đang chạy npm audit..."
    if ! npm audit --audit-level=high --json 2>/dev/null | \
        python3 -c "
import sys, json
data = json.load(sys.stdin)
vulns = data.get('metadata', {}).get('vulnerabilities', {})
high = vulns.get('high', 0) + vulns.get('critical', 0)
if high:
    print(f'  ⚠️  Phát hiện {high} lỗ hổng npm mức high/critical. Chạy: npm audit fix')
    sys.exit(1)
" 2>/dev/null; then
      ISSUES_FOUND=1
    else
      echo "  ✅ Không có lỗ hổng npm mức high/critical"
    fi
  fi

  if command -v yarn &>/dev/null && [[ "$BASENAME" == yarn.lock ]]; then
    echo "🔍 Đang chạy yarn audit..."
    if ! yarn audit --level high --json 2>/dev/null | \
        grep -q '"type":"auditAdvisory"' 2>/dev/null; then
      echo "  ✅ Không có lỗ hổng yarn mức high"
    else
      echo "  ⚠️  yarn audit phát hiện lỗ hổng. Chạy: yarn audit --level high"
      ISSUES_FOUND=1
    fi
  fi
fi

# ── Python ───────────────────────────────────────────────────────────────────
if [[ "$BASENAME" == requirements.txt || "$BASENAME" == Pipfile* || "$BASENAME" == pyproject.toml ]]; then
  if command -v pip-audit &>/dev/null; then
    echo "🔍 Đang chạy pip-audit..."
    if pip-audit --format=json 2>/dev/null | \
        python3 -c "
import sys, json
data = json.load(sys.stdin)
vulns = [d for d in data.get('dependencies', []) if d.get('vulns')]
if vulns:
    for dep in vulns:
        for v in dep['vulns']:
            print(f'  ⚠️  {dep[\"name\"]} {dep[\"version\"]}: {v[\"id\"]} (bản sửa: {v[\"fix_versions\"]})')
    sys.exit(1)
" 2>/dev/null; then
      echo "  ✅ Không phát hiện lỗ hổng Python"
    else
      ISSUES_FOUND=1
      echo "  Chạy: pip-audit để xem chi tiết"
    fi
  elif command -v safety &>/dev/null; then
    echo "🔍 Đang chạy safety check..."
    OUTPUT=$(safety check --short-report 2>&1)
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 0 ]; then
      echo "  ✅ Không phát hiện lỗ hổng Python"
    elif echo "$OUTPUT" | grep -qiE "vulnerability|CVE|insecure"; then
      echo "$OUTPUT"
      ISSUES_FOUND=1
    else
      echo "  ⚠️  safety check không thể hoàn tất (lỗi mạng hoặc cấu hình)" >&2
    fi
  fi
fi

# ── Go ───────────────────────────────────────────────────────────────────────
if [[ "$BASENAME" == go.mod || "$BASENAME" == go.sum ]]; then
  if command -v govulncheck &>/dev/null; then
    echo "🔍 Đang chạy govulncheck..."
    OUTPUT=$(govulncheck ./... 2>&1)
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 0 ]; then
      echo "  ✅ Không phát hiện lỗ hổng Go"
    elif echo "$OUTPUT" | grep -q "Vulnerability #"; then
      echo "$OUTPUT"
      ISSUES_FOUND=1
    else
      echo "  ⚠️  govulncheck không thể hoàn tất: $OUTPUT" >&2
    fi
  fi
fi

# ── Rust ─────────────────────────────────────────────────────────────────────
if [[ "$BASENAME" == Cargo.toml || "$BASENAME" == Cargo.lock ]]; then
  if command -v cargo-audit &>/dev/null; then
    echo "🔍 Đang chạy cargo audit..."
    if ! cargo audit 2>/dev/null; then
      ISSUES_FOUND=1
    else
      echo "  ✅ Không phát hiện lỗ hổng Rust"
    fi
  fi
fi

# ── Ruby ─────────────────────────────────────────────────────────────────────
if [[ "$BASENAME" == Gemfile || "$BASENAME" == Gemfile.lock ]]; then
  if command -v bundler-audit &>/dev/null; then
    echo "🔍 Đang chạy bundler-audit..."
    bundler-audit check --update 2>/dev/null || ISSUES_FOUND=1
  fi
fi

# ── Phương án dự phòng chung: trivy ──────────────────────────────────────────
if command -v trivy &>/dev/null; then
  echo "🔍 Đang chạy trivy fs scan..."
  if ! trivy fs --exit-code 1 --severity HIGH,CRITICAL --quiet . 2>/dev/null; then
    ISSUES_FOUND=1
  else
    echo "  ✅ trivy không phát hiện vấn đề HIGH/CRITICAL nào"
  fi
fi

if [ "$ISSUES_FOUND" -eq 0 ]; then
  echo "✅ Kiểm tra dependency đạt: không phát hiện lỗ hổng"
else
  echo ""
  echo "⚠️  Phát hiện lỗ hổng. Hãy xem xét và cập nhật dependencies trước khi commit."
  echo "   Hook này chỉ mang tính khuyến nghị và sẽ không chặn workflow của bạn."
fi

# Luôn exit 0: hook này cảnh báo nhưng không chặn
exit 0
