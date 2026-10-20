<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../../resources/logos/claude-howto-logo-dark.svg">
  <img alt="Claude How To" src="../../resources/logos/claude-howto-logo.svg">
</picture>

# Hooks

Hooks là các script tự động thực thi để phản hồi các sự kiện cụ thể trong các phiên Claude Code. Chúng cho phép tự động hóa, xác thực, quản lý quyền, và workflow tùy chỉnh.

## Tổng Quan

Hooks là các hành động tự động (lệnh shell, HTTP webhook, prompt LLM, lệnh gọi công cụ MCP, hoặc đánh giá bằng tác nhân con) thực thi tự động khi các sự kiện cụ thể xảy ra trong Claude Code. Chúng nhận đầu vào JSON và trả kết quả qua exit code và đầu ra JSON.

**Tính năng chính:**
- Tự động hóa dựa trên sự kiện
- Đầu vào/ra dựa trên JSON
- Hỗ trợ các loại hook `command`, `http`, `mcp_tool`, `prompt`, và `agent`
- Khớp mẫu cho các hook theo từng công cụ

## Cấu Hình

Hooks được cấu hình trong các file settings với cấu trúc cụ thể:

- `~/.claude/settings.json` - Cài đặt người dùng (tất cả project)
- `.claude/settings.json` - Cài đặt project (có thể chia sẻ, được commit)
- `.claude/settings.local.json` - Cài đặt project cục bộ (không được commit)
- Managed policy - Cài đặt toàn tổ chức
- Plugin `hooks/hooks.json` - Hook trong phạm vi plugin
- Skill/Agent frontmatter - Hook theo vòng đời component

### Cấu Trúc Cấu Hình Cơ Bản

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolPattern",
        "hooks": [
          {
            "type": "command",
            "command": "your-command-here",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

**Các trường chính:**

| Trường | Mô Tả | Ví Dụ |
|-------|-------------|---------|
| `matcher` | Mẫu để khớp tên công cụ (phân biệt hoa/thường) | `"Write"`, `"Edit\|Write"`, `"*"` |
| `hooks` | Mảng định nghĩa hook | `[{ "type": "command", ... }]` |
| `type` | Loại hook: `"command"` (bash), `"prompt"` (LLM), `"http"` (webhook), `"mcp_tool"` (gọi công cụ MCP, từ v2.1.118), hoặc `"agent"` (tác nhân con) | `"command"` |
| `command` | Lệnh shell để thực thi | `"$CLAUDE_PROJECT_DIR/.claude/hooks/format.sh"` |
| `timeout` | Timeout tùy chọn tính bằng giây. Mặc định: 600 cho command/http/mcp_tool, 30 cho prompt, 60 cho agent. | `30` |
| `once` | Nếu `true`, hook bị gỡ bỏ sau lần chạy thành công đầu tiên (lần chạy thất bại/bị chặn/hết thời gian vẫn giữ hook). Chỉ dùng trong frontmatter của skill; bị bỏ qua trong settings và frontmatter của agent | `true` |
| `async` | Nếu `true`, chạy nền mà không chặn | `true` |
| `asyncRewake` | Nếu `true`, chạy nền và đánh thức Claude khi exit code là 2. Ngầm bật `async`. | `true` |
| `shell` | Chấp nhận `"bash"` hoặc `"powershell"`. Mặc định `"bash"`, hoặc `"powershell"` trên Windows khi chưa cài Git Bash. | `"bash"` |
| `statusMessage` | Thông điệp spinner tùy chỉnh hiển thị khi hook đang chạy | `"Đang định dạng…"` |
| `onFailure` | Điều gì xảy ra với hành động khi một command hook hoặc HTTP hook thất bại (không khởi động được, hết thời gian, thoát với mã không mong đợi): `"continue"` (mặc định) hoặc `"block"` (từ v2.1.295) | `"block"` |

> **Lưu ý**: Một số sự kiện hạ thấp timeout mặc định. `UserPromptSubmit` hạ mặc định của `command`, `http` và `mcp_tool` xuống 30 giây, còn `MessageDisplay` hạ xuống 10 giây. Các hook `SessionEnd` dùng chung ngân sách 1,5 giây; nếu cài đặt của bạn khai báo `timeout` dài hơn cho một hook, Claude Code nâng ngân sách đó cho khớp, tối đa 60 giây.

### Các Mẫu Matcher

| Mẫu | Mô Tả | Ví Dụ |
|---------|-------------|---------|
| Chuỗi chính xác | Khớp một công cụ cụ thể | `"Write"` |
| Mẫu regex | Khớp nhiều công cụ | `"Edit\|Write"` |
| Phân tách bằng dấu phẩy | Khớp bất kỳ công cụ nào trong danh sách (từ v2.1.191) | `"Write,Edit"` |
| Wildcard | Khớp tất cả công cụ | `"*"` hoặc `""` |
| Công cụ MCP | Mẫu server và công cụ | `"mcp__memory__.*"` |

> **Matcher được khớp chính xác (từ v2.1.195).** Một định danh có dấu gạch nối (ví dụ tên công cụ MCP chứa dấu gạch nối) không còn vô tình khớp chuỗi con với một công cụ khác. Các matcher phân tách bằng dấu phẩy như `"Write,Edit"` kích hoạt với bất kỳ công cụ nào trong danh sách; các bản build trước đây âm thầm không bao giờ kích hoạt chúng.

**Các giá trị matcher của InstructionsLoaded:**

| Giá Trị Matcher | Mô Tả |
|---------------|-------------|
| `session_start` | Instructions được tải khi khởi động phiên |
| `nested_traversal` | Instructions được tải khi duyệt thư mục lồng nhau |
| `path_glob_match` | Instructions được tải qua khớp mẫu glob đường dẫn |

### Thu Hẹp Bằng Điều Kiện `if` (Đường Dẫn Trong Đối Số Công Cụ)

Trường `matcher` chọn hook theo **tên công cụ** (`"Write"`, `"Edit|Write"`, `"*"`). Để lọc hẹp hơn theo **đối số** của công cụ, ví dụ chỉ chạy hook khi một thao tác sửa chạm vào `src/`, hoặc để bảo vệ việc đọc các file bí mật, hãy thêm điều kiện `if` vào từng hook handler. Điều này khác với matcher theo tên công cụ: `matcher` quyết định *công cụ nào*, còn `if` quyết định *lệnh gọi nào*.

`if` dùng [cú pháp quy tắc quyền](https://code.claude.com/docs/en/permissions) (`ToolName(pattern)`), được đánh giá dựa trên tên công cụ **và** đối số của nó cùng lúc. Với `Read`/`Edit`/`Write`, mẫu đường dẫn tuân theo ngữ nghĩa gitignore, với cùng các điểm neo như quy tắc quyền: một tên trần như `.env` khớp ở mọi độ sâu, `src/**` tương đối với thư mục hiện tại, `/src/**` tương đối với thư mục gốc project, `~/...` tương đối với thư mục home của bạn, và `//...` là đường dẫn tuyệt đối trên hệ thống file.

Trường `if` nằm ở **cấp hook handler** (ngang hàng với `type` và `command`, bên trong mảng `hooks`), không nằm trên `matcher`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "if": "Edit(src/**)",
            "command": "./hooks/lint-src.sh"
          }
        ]
      },
      {
        "matcher": "Read",
        "hooks": [
          {
            "type": "command",
            "if": "Read(.env)",
            "command": "./hooks/block-secret-read.sh"
          }
        ]
      }
    ]
  }
}
```

Ví dụ các mẫu `if` hợp lệ: `Edit(src/**)` (các thao tác sửa bên trong `src/`), `Read(~/.ssh/**)` (đọc bất kỳ SSH key nào), `Read(.env)` (bất kỳ `.env` nào ở hoặc bên dưới thư mục hiện tại), `Bash(git push *)` (chỉ các lệnh con `git push`).

> **Cập nhật v2.1.214**: Một mẫu `dir/**` một đoạn trong điều kiện `if` của hook (như `Edit(src/**)`) giờ chỉ khớp `<cwd>/dir`, không còn khớp thư mục đó ở mọi độ sâu trong cây. Trước đây `src/**` cũng khớp `foo/src/**`. Dùng `**/dir/**` nếu bạn cần khớp ở mọi độ sâu. **Quan trọng**: việc thu hẹp này chỉ áp dụng cho điều kiện `if:` của hook và việc tự động phê duyệt theo quy tắc allow; các quy tắc quyền deny/ask vẫn khớp `dir/**` ở mọi độ sâu.

## Các Loại Hook

Claude Code hỗ trợ năm loại hook:

### Command Hooks

Loại hook mặc định. Thực thi một lệnh shell và giao tiếp qua JSON stdin/stdout và exit code.

```json
{
  "type": "command",
  "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/validate.py\"",
  "timeout": 60
}
```

#### Dạng Exec (`args`)

> Thêm vào từ v2.1.139.

Thay vì dạng shell `"command": "..."`, một command hook có thể khởi chạy trực tiếp một file thực thi qua `execve()` với mảng `args`. Không có bước phân tích shell, nên các placeholder đường dẫn không bao giờ cần đặt trong dấu nháy và cấu hình miễn nhiễm với lỗi shell injection.

```json
{
  "type": "command",
  "command": "python3",
  "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/validate.py", "--strict"],
  "timeout": 60
}
```

`command` luôn bắt buộc: khi đặt `args`, `command` là file thực thi cần khởi chạy (được tìm trên `PATH`) và `args` là vector đối số của nó. Bỏ `args` (dạng shell) khi bạn cần pipe, chuyển hướng, nối lệnh bằng `&&`, hoặc các phép mở rộng shell; dùng `args` khi bạn gọi một file thực thi với các đối số.

### HTTP Hooks

> Thêm vào từ v2.1.63.

Các endpoint webhook từ xa nhận cùng đầu vào JSON như command hook. HTTP hook gửi POST JSON đến URL và nhận phản hồi JSON. HTTP hook được định tuyến qua sandbox khi sandboxing được bật. Nội suy biến môi trường vào giá trị header yêu cầu danh sách `allowedEnvVars` rõ ràng để bảo mật.

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write",
      "hooks": [{
        "type": "http",
        "url": "https://my-webhook.example.com/hook"
      }]
    }]
  }
}
```

**Các thuộc tính chính:**
- `"type": "http"` -- xác định đây là một HTTP hook
- `"url"` -- URL endpoint webhook
- Được định tuyến qua sandbox khi sandbox được bật
- Yêu cầu danh sách `allowedEnvVars` rõ ràng cho bất kỳ nội suy biến môi trường nào trong giá trị `headers`

### Prompt Hooks

Prompt được đánh giá bởi LLM, trong đó nội dung hook là một prompt mà Claude đánh giá. Chủ yếu được sử dụng với các sự kiện `Stop` và `SubagentStop` để kiểm tra hoàn thành tác vụ một cách thông minh.

```json
{
  "type": "prompt",
  "prompt": "Evaluate if Claude completed all requested tasks.",
  "timeout": 30
}
```

LLM đánh giá prompt và trả về một quyết định có cấu trúc (xem [Hooks Dựa Trên Prompt](#hooks-dựa-trên-prompt) để biết chi tiết).

### MCP Tool Hooks

> Thêm vào từ v2.1.118.

Loại `mcp_tool` gọi trực tiếp một công cụ MCP đã được cấu hình; cấu hình tham chiếu đến tên MCP server và tên công cụ thay vì một lệnh shell hay URL. Hữu ích khi logic xác thực hoặc phản hồi đã nằm sẵn trong một MCP server bạn đã cấu hình.

```json
{
  "matcher": "Edit",
  "hooks": [{
    "type": "mcp_tool",
    "server": "my-mcp-server",
    "tool": "validate_edit",
    "input": { "file_path": "${tool_input.file_path}" }
  }]
}
```

**Các thuộc tính chính:**
- `"type": "mcp_tool"` -- xác định đây là một MCP tool hook
- `"server"` -- tên MCP server đã cấu hình
- `"tool"` -- tên công cụ cần gọi trên server đó
- `"input"` -- các đối số tùy chọn truyền cho công cụ; giá trị chuỗi hỗ trợ thay thế `${path}` từ đầu vào JSON của hook, ví dụ `"${tool_input.file_path}"`

Đối số của công cụ lấy từ `input` (có thay thế `${path}`), không lấy trực tiếp từ đầu vào của hook. Xem [thiết lập MCP server](../05-mcp/README.md) để cấu hình MCP server.

### Agent Hooks

Hook xác minh dựa trên tác nhân con, khởi chạy một tác nhân chuyên dụng để đánh giá điều kiện hoặc thực hiện các kiểm tra phức tạp. Khác với prompt hook (đánh giá LLM một lượt), agent hook có thể sử dụng công cụ và thực hiện suy luận nhiều bước.

> **Lưu ý**: Agent hook là tính năng thử nghiệm và có thể thay đổi.

> **Lưu ý**: Kể từ v2.1.280, agent hook không chạy trên `PermissionRequest`, vì câu trả lời của chúng không bao giờ có thể cho phép hoặc từ chối yêu cầu. Hãy dùng command hook hoặc HTTP hook trả về đối tượng quyết định ở đó (`ok: false` của prompt hook không có tác dụng trên `PermissionRequest`).

```json
{
  "type": "agent",
  "prompt": "Verify the code changes follow our architecture guidelines. Check the relevant design docs and compare.",
  "timeout": 120
}
```

**Các thuộc tính chính:**
- `"type": "agent"` -- xác định đây là một agent hook
- `"prompt"` -- mô tả nhiệm vụ cho tác nhân con
- Tác nhân có thể sử dụng các công cụ (Read, Grep, Bash, v.v.) để thực hiện đánh giá
- Trả về một quyết định có cấu trúc tương tự prompt hook

## Các Sự Kiện Hook

Claude Code hỗ trợ **33 sự kiện hook**:

| Sự Kiện | Khi Được Kích Hoạt | Đầu Vào Matcher | Có Thể Chặn | Sử Dụng Phổ Biến |
|-------|---------------|---------------|-----------|------------|
| **SessionStart** | Phiên bắt đầu/tiếp tục/xóa/dồn ngữ cảnh | startup/resume/clear/compact/fork | Không | Thiết lập môi trường |
| **Setup** | `--init-only`, hoặc `--init`/`--maintenance` cùng `-p` (chuẩn bị cho CI/script) | `init`/`maintenance` | Không | Cung cấp công cụ, cài dependencies |
| **InstructionsLoaded** | Sau khi CLAUDE.md hoặc file rules được tải | Lý do tải (`session_start`/`nested_traversal`/`path_glob_match`/`include`/`compact`) | Không | Ghi log kiểm tra/quan sát |
| **UserPromptSubmit** | Người dùng gửi prompt | (không có) | Có | Xác thực prompt |
| **UserPromptExpansion** | Lệnh slash do người dùng gõ hoặc MCP prompt được mở rộng thành prompt | Tên lệnh | Có | Biến đổi hoặc kiểm tra prompt đã mở rộng |
| **PreToolUse** | Trước khi thực thi công cụ | Tên công cụ | Có (allow/deny/ask/defer) | Xác thực, sửa đổi đầu vào |
| **PermissionRequest** | Hộp thoại quyền được hiển thị | Tên công cụ | Có | Tự động phê duyệt/từ chối |
| **PermissionDenied** | Auto mode từ chối một lệnh gọi công cụ | Tên công cụ | Không | Ghi log, phân tích, thực thi chính sách |
| **PostToolUse** | Sau khi công cụ chạy thành công | Tên công cụ | Không | Thêm ngữ cảnh, phản hồi |
| **PostToolUseFailure** | Thực thi công cụ thất bại | Tên công cụ | Không | Xử lý lỗi, ghi log |
| **PostToolBatch** | Sau khi một lô lệnh gọi công cụ hoàn tất | (không có) | Có | Báo cáo tổng hợp, xác thực theo lô |
| **Notification** | Thông báo được gửi | Loại thông báo | Không | Thông báo tùy chỉnh |
| **MessageDisplay** | Trong khi văn bản tin nhắn của assistant được hiển thị | (không có) | Không | Biến đổi hoặc ẩn văn bản tin nhắn hiển thị (v2.1.152) |
| **SubagentStart** | Tác nhân con được khởi chạy | Tên loại tác nhân | Không | Thiết lập tác nhân con |
| **SubagentStop** | Tác nhân con hoàn thành | Tên loại tác nhân | Có | Xác thực tác nhân con |
| **Stop** | Claude hoàn thành phản hồi | (không có) | Có | Kiểm tra hoàn thành tác vụ |
| **StopFailure** | Lỗi API kết thúc lượt | Loại lỗi (`rate_limit`, `overloaded`, `server_error`, …) | Không | Phục hồi lỗi, ghi log |
| **TeammateIdle** | Thành viên trong nhóm tác nhân đang rảnh | (không có) | Có | Phối hợp thành viên nhóm |
| **TaskCompleted** | Nhiệm vụ được đánh dấu hoàn thành | (không có) | Có | Hành động sau tác vụ |
| **TaskCreated** | Nhiệm vụ được tạo qua TaskCreate | (không có) | Có | Theo dõi nhiệm vụ, ghi log |
| **ConfigChange** | File config thay đổi | Nguồn config (`user_settings`/`project_settings`/`local_settings`/`policy_settings`/`skills`) | Có (trừ policy) | Phản ứng với cập nhật config |
| **CwdChanged** | Thư mục làm việc thay đổi | (không có) | Không | Thiết lập theo thư mục |
| **DirectoryAdded** | Thư mục làm việc mới được đăng ký giữa phiên qua `/add-dir` hoặc control request `register_repo_root` của SDK (v2.1.219) | `slash_command`/`register_repo_root` | Không | Thiết lập công cụ cho thư mục vừa thêm |
| **FileChanged** | File được theo dõi thay đổi | Tên file cần theo dõi (ví dụ `.envrc\|.env`) | Không | Giám sát file, build lại |
| **PreCompact** | Trước khi dồn ngữ cảnh | manual/auto | Có | Hành động trước khi dồn |
| **PostCompact** | Sau khi dồn ngữ cảnh hoàn thành | (không có) | Không | Hành động sau khi dồn |
| **PreModelSwitch** | Trước khi Claude Code áp dụng một yêu cầu đổi model | Tên chuẩn của model sắp chuyển sang (từ `to_model`) | Có | Kiểm soát hoặc phủ quyết việc đổi model |
| **PostModelSwitch** | Sau khi model của phiên thay đổi, kể cả những thay đổi do chính Claude Code thực hiện (ví dụ khôi phục model khi tiếp tục phiên) | Tên chuẩn của model đã chuyển sang (từ `to_model`) | Không | Ghi log hoặc phản ứng với thay đổi model |
| **WorktreeCreate** | Worktree đang được tạo | (không có) | Có (trả về đường dẫn) | Khởi tạo worktree |
| **WorktreeRemove** | Worktree đang được xóa | (không có) | Có (exit khác 0 làm việc xóa thất bại) | Dọn dẹp worktree |
| **Elicitation** | MCP server yêu cầu người dùng nhập thông tin | Tên MCP server | Có | Xác thực đầu vào |
| **ElicitationResult** | Người dùng phản hồi elicitation | Tên MCP server | Có | Xử lý phản hồi |
| **SessionEnd** | Phiên kết thúc | Lý do kết thúc (`clear`/`resume`/`logout`/`prompt_input_exit`/`other`) | Không | Dọn dẹp, ghi log cuối |

`PreModelSwitch` và `PostModelSwitch` yêu cầu v2.1.251 trở lên. Cả hai đều nhận `from_model` và `to_model`; matcher được đánh giá dựa trên tên chuẩn suy ra từ `to_model` (ví dụ `claude-opus-5`, `.*opus.*`). Timeout mặc định của `command`, `http` và `mcp_tool` cho hai sự kiện này được hạ xuống 30 giây.

> **`TaskCreated` và `TaskCompleted` cần bật todo tools (v2.1.233).** Hai
> sự kiện này phát ra từ các công cụ todo/theo dõi tác vụ (`TaskCreate`/`Get`/`Update`/`List`,
> `TodoWrite`), vốn **chỉ khả dụng mặc định trên các model Claude 3.x, Opus 4 đến
> 4.7, Sonnet 4 đến 4.6, và Haiku 4.5**. Trên các model khác, hook vẫn là cấu hình
> hợp lệ nhưng đơn giản là không bao giờ kích hoạt: không có đầu ra và cũng không có lỗi. Đặt
> `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` để bật lại các công cụ này, và qua đó bật lại các sự kiện.

> **Thời lượng PostToolUse (v2.1.119):** Đầu vào của hook `PostToolUse` và `PostToolUseFailure` giờ bao gồm `duration_ms`. Xem mục [PostToolUse](#posttooluse) để biết chi tiết.

### PreToolUse

Chạy sau khi Claude tạo tham số công cụ và trước khi xử lý. Dùng hook này để xác thực hoặc sửa đổi đầu vào công cụ.

**Cấu hình:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/validate-bash.py"
          }
        ]
      }
    ]
  }
}
```

**Các matcher phổ biến:** `Agent`, `Bash`, `Glob`, `Grep`, `Read`, `Edit`, `Write`, `WebFetch`, `WebSearch`

**Điều khiển đầu ra:**
- `permissionDecision`: `"allow"`, `"deny"`, `"ask"`, hoặc `"defer"`
  - `"allow"` bỏ qua prompt xin quyền (trừ các công cụ yêu cầu tương tác người dùng, và các công cụ connector mà tổ chức của bạn đặt thành `ask`)
  - `"deny"` ngăn lệnh gọi công cụ
  - `"ask"` nhắc người dùng xác nhận; prompt này nêu tên plugin hoặc skill mà hook thuộc về (v2.1.301)
  - `"defer"` thoát êm để công cụ có thể được tiếp tục sau; `permissionDecisionReason`, `updatedInput` và `additionalContext` đều bị bỏ qua với giá trị này
  - Các quy tắc deny và ask vẫn được đánh giá bất kể hook trả về gì. Khi nhiều hook `PreToolUse` không thống nhất, thứ tự ưu tiên là `deny` > `defer` > `ask` > `allow`
- `permissionDecisionReason`: Giải thích cho quyết định. Hiển thị cho người dùng (không phải Claude) với `"ask"`; hiển thị cho Claude với `"deny"`; với `"allow"` và `"defer"`, chỉ được ghi vào debug log
- `updatedInput`: Đầu vào công cụ thay thế (thay toàn bộ đối tượng đầu vào). Từ v2.1.300, nó được xác thực giống như đầu vào của chính Claude: các khóa không xác định bị loại bỏ, và đầu vào bị công cụ từ chối sẽ khiến lệnh gọi bị từ chối.

### PostToolUse

Chạy ngay sau khi công cụ hoàn thành. Dùng để xác minh, ghi log, hoặc cung cấp ngữ cảnh trở lại cho Claude.

**Cấu hình:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/security-scan.py"
          }
        ]
      }
    ]
  }
}
```

**Điều khiển đầu ra:**
- Quyết định `"block"` nhắc Claude kèm phản hồi
- `additionalContext`: Ngữ cảnh được thêm vào cho Claude

**Các trường đầu vào bổ sung (v2.1.119):**

| Trường | Kiểu | Mô Tả |
|-------|------|-------------|
| `duration_ms` | number | Thời gian thực thi công cụ tính bằng mili giây. Không tính thời gian chờ ở prompt xin quyền và thời gian chạy hook PreToolUse. Có trên cả hook `PostToolUse` và `PostToolUseFailure`. |

#### Chặn Có Thể Phục Hồi (`continueOnBlock`, v2.1.139)

Một command hook trả về `"decision": "block"` trên `PostToolUse` sẽ thêm `reason` bên cạnh kết quả công cụ; Claude vẫn thấy đầu ra gốc. `continueOnBlock` là trường của **prompt** hook (command hook và agent hook không có trường này): mặc định, một prompt hook trả về `ok: false` trên `PostToolUse` sẽ kết thúc lượt và hiển thị lý do dưới dạng một dòng cảnh báo. Đặt `"continueOnBlock": true` trên prompt hook để thay vào đó đưa lý do trở lại cho Claude và tiếp tục lượt, giúp model đọc phản hồi rồi thử lại hoặc điều chỉnh.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check this edit against our write policy (for example, read-only paths). Hook input: $ARGUMENTS",
            "continueOnBlock": true
          }
        ]
      }
    ]
  }
}
```

Dùng tùy chọn này khi `reason` của hook là điều Claude có thể xử lý (ví dụ "file này chỉ đọc; hãy ghi vào chỗ khác"); bỏ nó đi khi một lần chặn phải dừng hẳn lượt.

### UserPromptSubmit

Chạy khi người dùng gửi prompt, trước khi Claude xử lý nó. Từ v2.1.299, hook chạy trước khi một skill hoặc lệnh tùy chỉnh được mở rộng, nên chặn prompt cũng sẽ dừng các dòng shell `!` của lệnh đó; `UserPromptExpansion` kích hoạt sau nó.

**Cấu hình:**
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/validate-prompt.py"
          }
        ]
      }
    ]
  }
}
```

**Điều khiển đầu ra:**
- `decision`: `"block"` để ngăn xử lý
- `reason`: Giải thích nếu bị chặn
- `additionalContext`: Ngữ cảnh được thêm vào prompt

### Stop Và SubagentStop

Chạy khi Claude hoàn thành phản hồi (Stop) hoặc một tác nhân con hoàn thành (SubagentStop). Hỗ trợ đánh giá dựa trên prompt để kiểm tra hoàn thành tác vụ một cách thông minh.

**Trường đầu vào bổ sung:** Cả hook `Stop` và `SubagentStop` đều nhận trường `last_assistant_message` trong đầu vào JSON, chứa tin nhắn cuối cùng của Claude hoặc tác nhân con trước khi dừng. Trường này hữu ích để đánh giá việc hoàn thành tác vụ.

**Cấu hình:**
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Evaluate if Claude completed all requested tasks.",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

> **Giới hạn an toàn cho số lần chặn liên tiếp (v2.1.143)**: Nếu một hook `Stop` trả về `"decision": "block"` (hoặc đặt `continue: false`) **8 lần liên tiếp** trong cùng một lượt, Claude Code sẽ ghi đè lần chặn tiếp theo và kết thúc lượt. Ghi đè ngưỡng này bằng biến môi trường `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP=<integer>` (đặt `0` để tắt hoàn toàn giới hạn). Điều này ngăn một hook Stop bị lỗi khiến lượt lặp vô hạn.

**Trường trả về (v2.1.163):** Một hook `Stop` hoặc `SubagentStop` có thể trả về `hookSpecificOutput.additionalContext` để gửi phản hồi cho Claude và **tiếp tục lượt mà không hiện nhãn lỗi**. Trước đây, việc tác động đến model từ một hook Stop khá vụng về; giờ hook có thể chèn ngữ cảnh một cách gọn gàng, tránh hành vi hiện nhãn lỗi của các cách phản hồi cũ (như `"decision": "block"`).

```json
{
  "hookSpecificOutput": {
    "hookEventName": "Stop",
    "additionalContext": "Reminder: run the test suite before declaring done."
  }
}
```

### SubagentStart

Chạy khi một tác nhân con bắt đầu thực thi. Đầu vào matcher là tên loại tác nhân, cho phép hook nhắm đến các loại tác nhân con cụ thể.

**Cấu hình:**
```json
{
  "hooks": {
    "SubagentStart": [
      {
        "matcher": "code-review",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/subagent-init.sh"
          }
        ]
      }
    ]
  }
}
```

### SessionStart

Chạy khi phiên bắt đầu hoặc tiếp tục. Có thể lưu giữ biến môi trường.

**Matchers:** `startup`, `resume`, `clear`, `compact`, `fork`

> **Cập nhật v2.1.214**: Một phiên được fork giờ báo cáo nguồn là `"fork"`; trước đây nó báo cáo `"resume"`.

**Tính năng đặc biệt:** Dùng `CLAUDE_ENV_FILE` để lưu giữ biến môi trường (cũng có sẵn trong các hook `CwdChanged` và `FileChanged`):

```bash
#!/bin/bash
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo 'export NODE_ENV=development' >> "$CLAUDE_ENV_FILE"
fi
exit 0
```

**Đầu ra theo phạm vi phiên (v2.1.152):** Một hook `SessionStart` có thể trả về JSON để quét lại skills và đặt tiêu đề phiên:

```json
{
  "reloadSkills": true,
  "hookSpecificOutput": {
    "sessionTitle": "Payments migration"
  }
}
```

`reloadSkills: true` ở cấp cao nhất kích hoạt việc quét lại skill ngay trong phiên hiện tại (cùng hành động với lệnh `/reload-skills`), giúp các skill mà hook vừa cài đặt có thể dùng ngay. `hookSpecificOutput.sessionTitle` đặt tiêu đề hiển thị của phiên khi khởi động và khi tiếp tục.

### SessionEnd

Chạy khi phiên kết thúc để thực hiện dọn dẹp hoặc ghi log cuối cùng. Không thể chặn việc kết thúc phiên.

**Các giá trị của trường reason:**
- `clear` - Người dùng xóa phiên
- `resume` - Phiên được chuyển qua `/resume` tương tác
- `logout` - Người dùng đăng xuất
- `prompt_input_exit` - Người dùng thoát qua ô nhập prompt
- `other` - Lý do khác

**Cấu hình:**
```json
{
  "hooks": {
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/session-cleanup.sh\""
          }
        ]
      }
    ]
  }
}
```

### Sự Kiện Notification

Các matcher được cập nhật cho sự kiện thông báo:
- `permission_prompt` - Thông báo yêu cầu quyền
- `idle_prompt` - Thông báo trạng thái rảnh
- `auth_success` - Xác thực thành công
- `elicitation_dialog` - MCP server mở một biểu mẫu elicitation
- `elicitation_url_dialog` - MCP server yêu cầu bạn mở một URL trong trình duyệt
- `elicitation_complete` - Elicitation ở chế độ URL báo đã hoàn tất
- `elicitation_response` - Phản hồi elicitation đã được gửi lại cho server
- `agent_needs_input` - Tác nhân chạy nền cần người dùng nhập thông tin (v2.1.198)
- `agent_completed` - Tác nhân chạy nền đã hoàn thành (v2.1.198)
- `quota_auto_resume_fired` / `quota_auto_resume_stale` / `quota_auto_resume_disabled` - Các kết quả của cơ chế tự động tiếp tục khi chạm giới hạn sử dụng (v2.1.234)

### PreModelSwitch

Chạy **trước khi** Claude Code áp dụng một yêu cầu đổi model, ví dụ khi bạn chạy `/model`, hoặc khi một component yêu cầu một model khác. Yêu cầu v2.1.251 trở lên.

**Matchers:** tên chuẩn của model sắp chuyển sang, suy ra từ `to_model`. Khớp một model chính xác (`claude-opus-5`) hoặc một dòng model bằng regex (`.*opus.*`).

**Các trường đầu vào:** ngoài các trường chung, hook nhận `from_model` (model đang dùng trước khi đổi) và `to_model` (model được yêu cầu).

**Có thể chặn:** có. Exit code `2` chặn việc đổi model và hiển thị stderr như một lỗi, nên phiên giữ nguyên model hiện tại. Dùng hook này để kiểm soát hoặc phủ quyết việc đổi model, ví dụ để giữ một project nhạy cảm về chi phí tránh xa model đắt nhất.

**Timeout:** sự kiện này hạ timeout mặc định của `command`, `http` và `mcp_tool` xuống 30 giây.

**Cấu hình:**
```json
{
  "hooks": {
    "PreModelSwitch": [
      {
        "matcher": ".*opus.*",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/gate-model-switch.sh"
          }
        ]
      }
    ]
  }
}
```

```bash
#!/bin/bash
# gate-model-switch.sh - từ chối việc chuyển sang Opus trong project này
input=$(cat)
to_model=$(echo "$input" | jq -r '.to_model')

if [[ "$to_model" == *opus* ]]; then
  echo "This project is budgeted for Sonnet; staying on the current model." >&2
  exit 2
fi

exit 0
```

### PostModelSwitch

Chạy **sau khi** model của phiên đã thay đổi. Hook cũng kích hoạt với các thay đổi do chính Claude Code thực hiện (ví dụ khôi phục model đã chọn trước đó khi bạn tiếp tục một phiên), không chỉ với các lần đổi do bạn yêu cầu. Yêu cầu v2.1.251 trở lên.

**Matchers:** giống `PreModelSwitch`, tức tên chuẩn suy ra từ `to_model`.

**Các trường đầu vào:** `from_model` và `to_model`, cùng với các trường chung.

**Có thể chặn:** không. Việc đổi model đã xảy ra; hook chỉ có thể quan sát và phản ứng.

**Timeout:** sự kiện này hạ timeout mặc định của `command`, `http` và `mcp_tool` xuống 30 giây.

**Cấu hình:**
```json
{
  "hooks": {
    "PostModelSwitch": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/log-model-switch.sh"
          }
        ]
      }
    ]
  }
}
```

```bash
#!/bin/bash
# log-model-switch.sh - ghi thêm mọi lần đổi model vào log của phiên
input=$(cat)
from=$(echo "$input" | jq -r '.from_model')
to=$(echo "$input" | jq -r '.to_model')

echo "$(date -Iseconds) $from -> $to" >> ~/.claude/model-switches.log
exit 0
```

## Hook Theo Phạm Vi Component

Hook có thể được gắn vào các component cụ thể (skills, agents, commands) trong frontmatter của chúng:

**Trong SKILL.md, agent.md, hoặc command.md:**

```yaml
---
name: secure-operations
description: Perform operations with security checks
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/check.sh"
          once: true  # Chỉ trong frontmatter của skill: gỡ bỏ sau lần chạy thành công đầu tiên
---
```

**Các sự kiện được hỗ trợ:** mọi sự kiện hook. Hook của tác nhân con chỉ chạy khi tác nhân con đang hoạt động (`Stop` → `SubagentStop`); hook của skill được đăng ký khi skill được gọi và duy trì đến hết phiên.

Điều này cho phép định nghĩa hook trực tiếp trong component sử dụng chúng, giữ các đoạn code liên quan ở cùng một chỗ.

### Hook Trong Frontmatter Của Tác Nhân Con

Khi một hook `Stop` được định nghĩa trong frontmatter của một tác nhân con, nó tự động được chuyển thành hook `SubagentStop` trong phạm vi tác nhân con đó. Điều này đảm bảo hook stop chỉ kích hoạt khi chính tác nhân con đó hoàn thành, thay vì khi phiên chính dừng.

```yaml
---
name: code-review-agent
description: Automated code review subagent
hooks:
  Stop:
    - hooks:
        - type: prompt
          prompt: "Verify the code review is thorough and complete."
  # Hook Stop ở trên tự chuyển thành SubagentStop cho tác nhân con này
---
```

**Yêu cầu tin cậy workspace (v2.1.218):** Hook trong frontmatter của một tác nhân con cấp **project** giờ yêu cầu chấp nhận tin cậy workspace cho thư mục chứa file tác nhân trước khi chạy. Trước v2.1.218, các hook này có thể chạy từ những thư mục bạn chưa tin cậy. Xem [tài liệu về tác nhân con](https://code.claude.com/docs/en/sub-agents#hooks-in-subagent-frontmatter) để biết phạm vi nào được miễn.

## Sự Kiện PermissionRequest

Xử lý các yêu cầu quyền với định dạng đầu ra tùy chỉnh:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow|deny",
      "updatedInput": {},
      "message": "Custom message",
      "interrupt": false
    }
  }
}
```

## Đầu Vào Và Đầu Ra Của Hook

### Đầu Vào JSON (qua stdin)

Tất cả hook nhận đầu vào JSON qua stdin:

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/current/working/directory",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.js",
    "content": "..."
  },
  "tool_use_id": "toolu_01ABC123...",
  "agent_id": "agent-abc123",
  "agent_type": "security-reviewer",
  "worktree": "/path/to/worktree",
  "effort": { "level": "medium" }
}
```

**Các trường chung:**

| Trường | Mô Tả |
|-------|-------------|
| `session_id` | Định danh duy nhất của phiên |
| `transcript_path` | Đường dẫn đến file transcript hội thoại |
| `cwd` | Thư mục làm việc hiện tại |
| `prompt_id` | UUID của prompt đang được xử lý; tương ứng với thuộc tính OpenTelemetry `prompt.id` (v2.1.196) |
| `hook_event_name` | Tên của sự kiện kích hoạt hook |
| `agent_id` | Định danh của tác nhân đang chạy hook này |
| `agent_type` | Tên tác nhân (ví dụ `"Explore"` hoặc `"security-reviewer"`); chỉ có khi phiên dùng `--agent` hoặc hook kích hoạt bên trong một tác nhân con |
| `worktree` | Đường dẫn đến git worktree, nếu tác nhân đang chạy trong một worktree |
| `effort.level` | (từ v2.1.133) Mức effort đang dùng: `low`, `medium`, `high`, `xhigh`, hoặc `max` |

### Exit Codes

| Exit Code | Ý Nghĩa | Hành Vi |
|-----------|---------|----------|
| **0** | Thành công | Tiếp tục, phân tích JSON từ stdout |
| **2** | Lỗi chặn | Chặn thao tác, stderr được hiển thị như lỗi |
| **Khác** | Lỗi không chặn | Tiếp tục; một thông báo `<hook name> hook error` trong transcript hiển thị dòng đầu tiên của stderr |

### Đầu Ra JSON (stdout, exit code 0)

```json
{
  "continue": true,
  "stopReason": "Optional message if stopping",
  "suppressOutput": false,
  "systemMessage": "Optional warning message",
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "File is in allowed directory",
    "updatedInput": {
      "file_path": "/modified/path.js"
    }
  }
}
```

> **Phạm vi (từ v2.1.121):** `hookSpecificOutput.updatedToolOutput` giờ được áp dụng cho **mọi** công cụ, không chỉ công cụ MCP. Một hook `PostToolUse` trên `Bash`, `Edit`, `Read`, v.v. có thể viết lại đầu ra của công cụ trước khi Claude nhìn thấy, hữu ích để che thông tin bí mật, chuẩn hóa diff, hoặc lọc bớt đầu ra lệnh quá nhiễu. Giá trị phải khớp với cấu trúc đầu ra của công cụ: `Bash` trả về một đối tượng có `stdout`, `stderr`, `interrupted` và `isImage`; với công cụ tích hợp sẵn, giá trị không khớp sẽ bị bỏ qua và đầu ra gốc được dùng. Ví dụ (loại bỏ mã màu ANSI khỏi đầu ra `Bash`):
>
> ```json
> {
>   "hookSpecificOutput": {
>     "hookEventName": "PostToolUse",
>     "updatedToolOutput": {
>       "stdout": "<output with ANSI escapes removed>",
>       "stderr": "",
>       "interrupted": false,
>       "isImage": false
>     }
>   }
> }
> ```

> **`retry` (PermissionDenied)**: Dùng JSON `hookSpecificOutput.retry: true` để báo cho model biết nó có thể thử lại lệnh gọi công cụ đã bị từ chối.

> **Dạng quyết định `PreToolUse` đã lỗi thời**: Với `PreToolUse`, các trường `decision` và `reason` ở cấp cao nhất đã **lỗi thời**; hãy dùng `hookSpecificOutput.permissionDecision` (`allow` / `deny` / `ask` / `defer`) và `permissionDecisionReason` thay thế. Thứ tự ưu tiên giữa các quyết định là `deny` > `defer` > `ask` > `allow`. Lưu ý thêm rằng `suppressOutput` được chấp nhận nhưng **không có tác dụng**.

#### `terminalSequence` (v2.1.141)

Hook có thể phát ra chuỗi escape OSC (operating system command) thô bằng cách đặt `terminalSequence` trong đầu ra JSON. Host ghi chuỗi này ra terminal điều khiển của nó khi hook trả về, hữu ích cho thông báo desktop, cập nhật tiêu đề cửa sổ, và chuông terminal mà không cần TTY riêng.

| Trường | Kiểu | Mô Tả |
|-------|------|-------------|
| `terminalSequence` | string | Chuỗi escape thô (thường là OSC 9 / OSC 0 / OSC 777). Được ghi nguyên văn ra terminal của host. |

Ví dụ: phát thông báo desktop OSC 9 khi một tác vụ dài hoàn thành. Viết ESC và BEL dưới dạng escape JSON (`\u001b`, `\u0007`) hoặc tạo giá trị bằng `printf` và `jq`; byte điều khiển thô bên trong chuỗi JSON sẽ gây lỗi phân tích:

```json
{
  "terminalSequence": "\u001b]9;Task complete\u0007"
}
```

Cấu hình nó trên một hook `Stop` để thông báo kích hoạt khi Claude kết thúc một lượt. Khả năng hỗ trợ chuỗi phụ thuộc vào terminal; iTerm2, Windows Terminal và WezTerm hỗ trợ OSC 9, còn Kitty dùng OSC 99.

## Các Biến Môi Trường

| Biến | Khả Dụng | Mô Tả |
|----------|-------------|-------------|
| `CLAUDE_PROJECT_DIR` | Tất cả hook | Đường dẫn tuyệt đối đến thư mục gốc project |
| `CLAUDE_ENV_FILE` | SessionStart, CwdChanged, FileChanged | Đường dẫn file để lưu giữ biến môi trường |
| `CLAUDE_CODE_REMOTE` | Tất cả hook | `"true"` nếu chạy trong môi trường từ xa |
| `${CLAUDE_PLUGIN_ROOT}` | Hook của plugin | Đường dẫn đến thư mục plugin |
| `${CLAUDE_PLUGIN_DATA}` | Hook của plugin | Đường dẫn đến thư mục dữ liệu plugin |
| `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS` | Hook SessionEnd | Timeout có thể cấu hình tính bằng mili giây cho hook SessionEnd (ghi đè mặc định) |
| `CLAUDE_CODE_SESSION_ID` | Tiến trình con của công cụ Bash (từ v2.1.132) | UUID của phiên; khớp với trường `session_id` trong JSON đầu vào của hook. Dùng để đối chiếu log bash với telemetry của hook. |
| `CLAUDE_EFFORT` | Tiến trình con của công cụ Bash (từ v2.1.133) | Mức effort đang dùng (`low`/`medium`/`high`/`xhigh`/`max`); khớp với `effort.level` trong JSON đầu vào của hook. |
| `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` | Toàn tiến trình (từ v2.1.143) | Số lần chặn liên tiếp tối đa của hook Stop trước khi Claude Code ghi đè lần chặn tiếp theo và kết thúc lượt (mặc định `8`). Đặt `0` để tắt giới hạn. |

## Hooks Dựa Trên Prompt

Với các sự kiện `Stop` và `SubagentStop`, bạn có thể dùng đánh giá dựa trên LLM:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Review if all tasks are complete. Return your decision.",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

**Schema phản hồi của LLM:**
```json
{
  "ok": false,
  "reason": "Tests were not run after the last edit"
}
```

`ok: true` cho phép hành động; `reason` là bắt buộc khi `ok` là `false`.

## Ví Dụ

### Ví Dụ 1: Trình Xác Thực Lệnh Bash (PreToolUse)

**File:** `.claude/hooks/validate-bash.py`

```python
#!/usr/bin/env python3
import json
import sys
import re

BLOCKED_PATTERNS = [
    (r"\brm\s+-rf\s+/", "Blocking dangerous rm -rf / command"),
    (r"\bsudo\s+rm", "Blocking sudo rm command"),
]

def main():
    input_data = json.load(sys.stdin)

    tool_name = input_data.get("tool_name", "")
    if tool_name != "Bash":
        sys.exit(0)

    command = input_data.get("tool_input", {}).get("command", "")

    for pattern, message in BLOCKED_PATTERNS:
        if re.search(pattern, command):
            print(message, file=sys.stderr)
            sys.exit(2)  # Exit 2 = lỗi chặn

    sys.exit(0)

if __name__ == "__main__":
    main()
```

**Cấu hình:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/validate-bash.py\""
          }
        ]
      }
    ]
  }
}
```

### Ví Dụ 2: Bộ Quét Bảo Mật (PostToolUse)

**File:** `.claude/hooks/security-scan.py`

```python
#!/usr/bin/env python3
import json
import sys
import re

SECRET_PATTERNS = [
    (r"password\s*=\s*['\"][^'\"]+['\"]", "Potential hardcoded password"),
    (r"api[_-]?key\s*=\s*['\"][^'\"]+['\"]", "Potential hardcoded API key"),
]

def main():
    input_data = json.load(sys.stdin)

    tool_name = input_data.get("tool_name", "")
    if tool_name not in ["Write", "Edit"]:
        sys.exit(0)

    tool_input = input_data.get("tool_input", {})
    content = tool_input.get("content", "") or tool_input.get("new_string", "")
    file_path = tool_input.get("file_path", "")

    warnings = []
    for pattern, message in SECRET_PATTERNS:
        if re.search(pattern, content, re.IGNORECASE):
            warnings.append(message)

    if warnings:
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "additionalContext": f"Security warnings for {file_path}: " + "; ".join(warnings)
            }
        }
        print(json.dumps(output))

    sys.exit(0)

if __name__ == "__main__":
    main()
```

### Ví Dụ 3: Tự Động Format Code (PostToolUse)

**File:** `.claude/hooks/format-code.sh`

```bash
#!/bin/bash

# Đọc JSON từ stdin
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('tool_name', ''))")
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('tool_input', {}).get('file_path', ''))")

if [ "$TOOL_NAME" != "Write" ] && [ "$TOOL_NAME" != "Edit" ]; then
    exit 0
fi

# Format dựa trên phần mở rộng file
case "$FILE_PATH" in
    *.js|*.jsx|*.ts|*.tsx|*.json)
        command -v prettier &>/dev/null && prettier --write "$FILE_PATH" 2>/dev/null
        ;;
    *.py)
        command -v black &>/dev/null && black "$FILE_PATH" 2>/dev/null
        ;;
    *.go)
        command -v gofmt &>/dev/null && gofmt -w "$FILE_PATH" 2>/dev/null
        ;;
esac

exit 0
```

### Ví Dụ 4: Trình Xác Thực Prompt (UserPromptSubmit)

**File:** `.claude/hooks/validate-prompt.py`

```python
#!/usr/bin/env python3
import json
import sys
import re

BLOCKED_PATTERNS = [
    (r"delete\s+(all\s+)?database", "Dangerous: database deletion"),
    (r"rm\s+-rf\s+/", "Dangerous: root deletion"),
]

def main():
    input_data = json.load(sys.stdin)
    prompt = input_data.get("prompt", "")

    for pattern, message in BLOCKED_PATTERNS:
        if re.search(pattern, prompt, re.IGNORECASE):
            output = {
                "decision": "block",
                "reason": f"Blocked: {message}"
            }
            print(json.dumps(output))
            sys.exit(0)

    sys.exit(0)

if __name__ == "__main__":
    main()
```

### Ví Dụ 5: Stop Hook Thông Minh (Dựa Trên Prompt)

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Review if Claude completed all requested tasks. Check: 1) Were all files created/modified? 2) Were there unresolved errors? If incomplete, explain what's missing.",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### Ví Dụ 6: Theo Dõi Mức Sử Dụng Ngữ Cảnh (Cặp Hook)

Theo dõi lượng token tiêu thụ cho mỗi yêu cầu bằng cách dùng cùng lúc hook `UserPromptSubmit` (trước tin nhắn) và `Stop` (sau phản hồi).

**File:** `.claude/hooks/context-tracker.py`

```python
#!/usr/bin/env python3
"""
Context Usage Tracker - Theo dõi lượng token tiêu thụ cho mỗi yêu cầu.

Dùng UserPromptSubmit làm hook "trước tin nhắn" và Stop làm hook "sau phản hồi"
để tính phần chênh lệch token sử dụng cho mỗi yêu cầu.

Các phương pháp đếm token:
1. Ước lượng theo ký tự (mặc định): ~4 ký tự mỗi token, không cần dependencies
2. tiktoken (tùy chọn): Chính xác hơn (~90-95%), cần: pip install tiktoken
"""
import json
import os
import sys
import tempfile

# Cấu hình
CONTEXT_LIMIT = 1000000  # 1M trên Opus 5, Sonnet 5, Opus 4.8, Sonnet 4.6; 200000 trên Haiku 4.5 (điều chỉnh theo model của bạn)
USE_TIKTOKEN = False    # Đặt True nếu đã cài tiktoken để chính xác hơn


def get_state_file(session_id: str) -> str:
    """Lấy đường dẫn file tạm để lưu số token trước tin nhắn, tách riêng theo phiên."""
    return os.path.join(tempfile.gettempdir(), f"claude-context-{session_id}.json")


def count_tokens(text: str) -> int:
    """
    Đếm số token trong văn bản.

    Dùng tiktoken với encoding p50k_base nếu có (độ chính xác ~90-95%),
    nếu không thì quay về ước lượng theo ký tự (độ chính xác ~80-90%).
    """
    if USE_TIKTOKEN:
        try:
            import tiktoken
            enc = tiktoken.get_encoding("p50k_base")
            return len(enc.encode(text))
        except ImportError:
            pass  # Quay về ước lượng

    # Ước lượng theo ký tự: ~4 ký tự mỗi token với tiếng Anh
    return len(text) // 4


def read_transcript(transcript_path: str) -> str:
    """Đọc và nối toàn bộ nội dung từ file transcript."""
    if not transcript_path or not os.path.exists(transcript_path):
        return ""

    content = []
    with open(transcript_path, "r") as f:
        for line in f:
            try:
                entry = json.loads(line.strip())
                # Trích nội dung văn bản từ nhiều định dạng tin nhắn khác nhau
                if "message" in entry:
                    msg = entry["message"]
                    if isinstance(msg.get("content"), str):
                        content.append(msg["content"])
                    elif isinstance(msg.get("content"), list):
                        for block in msg["content"]:
                            if isinstance(block, dict) and block.get("type") == "text":
                                content.append(block.get("text", ""))
            except json.JSONDecodeError:
                continue

    return "\n".join(content)


def handle_user_prompt_submit(data: dict) -> None:
    """Hook trước tin nhắn: Lưu số token hiện tại trước yêu cầu."""
    session_id = data.get("session_id", "unknown")
    transcript_path = data.get("transcript_path", "")

    transcript_content = read_transcript(transcript_path)
    current_tokens = count_tokens(transcript_content)

    # Lưu vào file tạm để so sánh sau
    state_file = get_state_file(session_id)
    with open(state_file, "w") as f:
        json.dump({"pre_tokens": current_tokens}, f)


def handle_stop(data: dict) -> None:
    """Hook sau phản hồi: Tính và báo cáo phần chênh lệch token."""
    session_id = data.get("session_id", "unknown")
    transcript_path = data.get("transcript_path", "")

    transcript_content = read_transcript(transcript_path)
    current_tokens = count_tokens(transcript_content)

    # Tải số token trước tin nhắn
    state_file = get_state_file(session_id)
    pre_tokens = 0
    if os.path.exists(state_file):
        try:
            with open(state_file, "r") as f:
                state = json.load(f)
                pre_tokens = state.get("pre_tokens", 0)
        except (json.JSONDecodeError, IOError):
            pass

    # Tính phần chênh lệch
    delta_tokens = current_tokens - pre_tokens
    remaining = CONTEXT_LIMIT - current_tokens
    percentage = (current_tokens / CONTEXT_LIMIT) * 100

    # Báo cáo mức sử dụng
    method = "tiktoken" if USE_TIKTOKEN else "estimated"
    print(f"Context ({method}): ~{current_tokens:,} tokens ({percentage:.1f}% used, ~{remaining:,} remaining)", file=sys.stderr)
    if delta_tokens > 0:
        print(f"This request: ~{delta_tokens:,} tokens", file=sys.stderr)


def main():
    data = json.load(sys.stdin)
    event = data.get("hook_event_name", "")

    if event == "UserPromptSubmit":
        handle_user_prompt_submit(data)
    elif event == "Stop":
        handle_stop(data)

    sys.exit(0)


if __name__ == "__main__":
    main()
```

**Cấu hình:**
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/context-tracker.py\""
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/context-tracker.py\""
          }
        ]
      }
    ]
  }
}
```

**Cách hoạt động:**
1. `UserPromptSubmit` kích hoạt trước khi prompt của bạn được xử lý, lưu số token hiện tại
2. `Stop` kích hoạt sau khi Claude phản hồi, tính phần chênh lệch và báo cáo mức sử dụng
3. Mỗi phiên được tách riêng nhờ `session_id` trong tên file tạm

**Các phương pháp đếm token:**

| Phương Pháp | Độ Chính Xác | Dependencies | Tốc Độ |
|--------|----------|--------------|-------|
| Ước lượng theo ký tự | ~80-90% | Không có | <1ms |
| tiktoken (p50k_base) | ~90-95% | `pip install tiktoken` | <10ms |

> **Lưu ý:** Anthropic chưa phát hành tokenizer offline chính thức. Cả hai phương pháp đều là ước lượng. Transcript bao gồm prompt của người dùng, phản hồi của Claude và đầu ra của công cụ; từ v2.1.300 nó còn ghi lại system prompt, danh sách công cụ và tham số của mỗi yêu cầu API.

### Ví Dụ 7: Khởi Tạo Quyền Auto-Mode (Script Thiết Lập Một Lần)

Một script thiết lập chạy một lần, điền vào `~/.claude/settings.json` các quy tắc quyền an toàn tương đương mức cơ sở auto-mode của Claude Code (37 quy tắc mặc định, tối đa 63 khi bật mọi cờ danh mục), không dùng hook nào và không ghi nhớ các lựa chọn về sau. Chỉ cần chạy một lần; chạy lại vẫn an toàn (bỏ qua các quy tắc đã có).

**File:** `09-advanced-features/setup-auto-mode-permissions.py`

```bash
# Xem trước những gì sẽ được thêm
python3 09-advanced-features/setup-auto-mode-permissions.py --dry-run

# Áp dụng
python3 09-advanced-features/setup-auto-mode-permissions.py
```

**Những gì được thêm:**

| Danh Mục | Ví Dụ |
|----------|---------|
| Công cụ tích hợp sẵn | `Read(*)`, `Grep(*)`, `Agent(*)`, `WebSearch(*)` |
| Sửa file tùy chọn (--include-edits) | `Edit(*)` |
| Git đọc | `Bash(git status:*)`, `Bash(git log:*)`, `Bash(git diff:*)` |
| Git ghi (cục bộ) | `Bash(git add:*)`, `Bash(git commit:*)`, `Bash(git checkout:*)` |
| Trình quản lý package | `Bash(npm ci:*)`, `Bash(npm install:*)`, `Bash(pip install:*)`, `Bash(pip3 install:*)` |
| Build và test | `Bash(make:*)`, `Bash(pytest:*)`, `Bash(go test:*)` |
| Shell thông dụng | `Bash(ls:*)`, `Bash(cat:*)`, `Bash(find:*)` |
| GitHub CLI | `Bash(gh pr view:*)`, `Bash(gh pr create:*)`, `Bash(gh issue list:*)` |

**Những gì được cố ý loại trừ** (script này không bao giờ thêm):
- `rm -rf`, `sudo`, force push, `git reset --hard`
- `DROP TABLE`, `kubectl delete`, `terraform destroy`
- `npm publish`, `curl | bash`, triển khai production

### Ví Dụ 8: Ghi Log Tiến Độ Học Tập (SessionEnd)

Ghi lại các module bạn đã học vào cuối mỗi phiên Claude Code. Tiến độ được lưu
trong `~/.claude-howto-progress.json`, nằm ngoài repo, nên vẫn còn nguyên sau `git pull` mà
không bị ghi đè.

**Vì sao dùng `SessionEnd` mà không dùng `Stop`?**
`Stop` kích hoạt sau *mỗi* phản hồi của Claude. `SessionEnd` kích hoạt một lần khi phiên
kết thúc, đúng thứ bạn cần cho một mục nhật ký cuối phiên.

**Vì sao không có prompt tương tác?**
Hook chạy không có terminal điều khiển, nên `/dev/tty` không khả dụng và hook không thể
hỏi bạn. Hãy truyền các module (và ghi chú tùy chọn) dưới dạng biến môi trường khi bạn
khởi chạy Claude Code, ví dụ `CLAUDE_HOWTO_MODULES=06,07 claude`.

**File:** `06-hooks/session-end.sh`

```bash
#!/usr/bin/env bash
# Hook SessionEnd: ghi nhận các module đã học, sau đó thêm một bản ghi phiên
# vào ~/.claude-howto-progress.json để theo dõi tiến độ học tập lâu dài.

PROGRESS_FILE="$HOME/.claude-howto-progress.json"

# Điều kiện bảo vệ: chỉ chạy bên trong repo này
if [[ "$CLAUDE_PROJECT_DIR" != *"claude-howto"* ]] && [[ "$PWD" != *"claude-howto"* ]]; then
  exit 0
fi

if [ ! -f "$PROGRESS_FILE" ]; then
  echo '{"sessions":[]}' > "$PROGRESS_FILE"
fi

DATE=$(date +"%Y-%m-%d")
TIME=$(date +"%H:%M")

# Các module đã học, ví dụ khởi chạy bằng: CLAUDE_HOWTO_MODULES=06,07 claude
# 01=Slash  02=Memory  03=Skills  04=Subagents  05=MCP
# 06=Hooks  07=Plugins 08=Checkpoints 09=Advanced 10=CLI
INPUT="${CLAUDE_HOWTO_MODULES:-}"

if [ -z "$INPUT" ] || [ "$INPUT" = "skip" ]; then
  exit 0
fi

MODULES_JSON=$(echo "$INPUT" | tr ',' '\n' | tr -d ' ' | while read -r m; do
  case "$m" in
    01) echo '"01-slash-commands"' ;;
    02) echo '"02-memory"' ;;
    03) echo '"03-skills"' ;;
    04) echo '"04-subagents"' ;;
    05) echo '"05-mcp"' ;;
    06) echo '"06-hooks"' ;;
    07) echo '"07-plugins"' ;;
    08) echo '"08-checkpoints"' ;;
    09) echo '"09-advanced-features"' ;;
    10) echo '"10-cli"' ;;
    *)  echo "\"$m\"" ;;
  esac
done | paste -sd ',' -)

# Ghi chú tùy chọn, ví dụ CLAUDE_HOWTO_NOTES="tried the pre-commit example"
NOTES="${CLAUDE_HOWTO_NOTES:-}"

# Truyền NOTES như một đối số riêng để Python xử lý việc escape JSON,
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

echo " Saved to $PROGRESS_FILE"
```

**Cài đặt**: sao chép script vào thư mục hook của project để đường dẫn trong `settings.json` trỏ đúng:

```bash
mkdir -p .claude/hooks
cp 06-hooks/session-end.sh .claude/hooks/
chmod +x .claude/hooks/session-end.sh
```

**Cấu hình** (trong `.claude/settings.json`):

```json
{
  "hooks": {
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/session-end.sh\"",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

Hook SessionEnd có ngân sách mặc định 1,5 giây. Đặt `"timeout"` riêng cho hook (tính bằng giây) sẽ nâng ngân sách cho khớp, tối đa 60 giây; một hook không có `timeout` riêng sẽ bị hủy sau 1,5 giây.

**Đầu ra: `~/.claude-howto-progress.json`:**

```json
{
  "sessions": [
    {
      "date": "2026-04-18",
      "time": "14:32",
      "modules": ["06-hooks", "07-plugins"],
      "notes": "Installed first hook, tried pre-commit example"
    }
  ]
}
```

**Các pattern chính được minh họa:**

| Pattern | Vì sao quan trọng |
|---------|----------------|
| Sự kiện `SessionEnd` | Kích hoạt một lần khi thoát, không phải sau mỗi phản hồi như `Stop` |
| `INPUT="${CLAUDE_HOWTO_MODULES:-}"` | Hook không có terminal (`/dev/tty` không khả dụng), nên đầu vào lấy từ biến môi trường |
| `"timeout": 10` | Hook SessionEnd bị hủy sau 1,5 giây trừ khi tự đặt `timeout` riêng |
| `$CLAUDE_PROJECT_DIR` | Đường dẫn di động, không bao giờ hardcode `/Users/yourname/...` |
| Điều kiện bảo vệ ở đầu script | Ngăn hook chạy trong các project không liên quan nếu được cài toàn cục |
| Lưu bên ngoài repo | Đường dẫn `~/` vẫn còn nguyên sau `git pull` mà không ghi đè dữ liệu của bạn |

**Công cụ đi kèm: trình theo dõi tiến độ trực quan**

Để có giao diện dạng checkbox đầy đủ cho cả 10 module, hãy mở trình theo dõi đi kèm trong trình duyệt:

```bash
open local-progress/index.html
```

Tiến độ được lưu trong `localStorage` của trình duyệt (không bao giờ ghi ra đĩa bên trong repo).
Dùng nút **Export** để lưu một bản chụp dưới dạng JSON, và **Import** để khôi phục.

## Hooks Của Plugin

Plugin có thể bao gồm hook trong file `hooks/hooks.json` của chúng:

**File:** `plugins/hooks/hooks.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}\"/scripts/validate.sh"
          }
        ]
      }
    ]
  }
}
```

**Các biến môi trường trong hook của plugin:**
- `${CLAUDE_PLUGIN_ROOT}` - Đường dẫn đến thư mục plugin
- `${CLAUDE_PLUGIN_DATA}` - Đường dẫn đến thư mục dữ liệu plugin

Điều này cho phép plugin bao gồm các hook xác thực và tự động hóa tùy chỉnh.

## Hooks Cho Công Cụ MCP

Các công cụ MCP tuân theo mẫu `mcp__<server>__<tool>`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__memory__.*",
        "hooks": [
          {
            "type": "command",
            "command": "echo '{\"systemMessage\": \"Memory operation logged\"}'"
          }
        ]
      }
    ]
  }
}
```

## Cân Nhắc Bảo Mật

### Tuyên Bố Miễn Trừ Trách Nhiệm

**SỬ DỤNG VỚI RỦI RO CỦA RIÊNG BẠN**: Hook thực thi các lệnh shell tùy ý. Bạn hoàn toàn chịu trách nhiệm về:
- Các lệnh bạn cấu hình
- Quyền truy cập/sửa đổi file
- Nguy cơ mất dữ liệu hoặc hư hại hệ thống
- Việc test hook trong môi trường an toàn trước khi dùng cho production

### Ghi Chú Bảo Mật

- **Yêu cầu tin cậy workspace:** Các lệnh xuất đầu ra của hook `statusLine` và `fileSuggestion` giờ yêu cầu chấp nhận tin cậy workspace trước khi có hiệu lực.
- **Kích thước terminal cho status line (v2.1.153):** Các script lệnh của status line giờ nhận biến môi trường `COLUMNS` và `LINES`, nên script có thể điều chỉnh đầu ra theo chiều rộng/chiều cao terminal (ví dụ `[ "$COLUMNS" -lt 80 ] && short_output`).
- **HTTP hook và biến môi trường:** HTTP hook yêu cầu danh sách `allowedEnvVars` rõ ràng để dùng nội suy biến môi trường trong giá trị header. Điều này ngăn việc vô tình làm lộ các biến môi trường nhạy cảm cho endpoint từ xa.
- **Phân cấp managed settings:** Cài đặt `disableAllHooks` giờ tuân theo phân cấp managed settings, nghĩa là cài đặt cấp tổ chức có thể bắt buộc vô hiệu hóa hook mà người dùng cá nhân không thể ghi đè.
- **Tự động phê duyệt PowerShell (v2.1.119):** Lệnh của công cụ PowerShell có thể được tự động phê duyệt trong chế độ quyền, giống như Bash. Điều này mang lại sự tương đồng cho người dùng Windows chạy Claude Code với các công cụ shell dựa trên PowerShell.
- **Đóng lỗ hổng tự động phê duyệt biến môi trường trần trong Bash (v2.1.145):** Trước v2.1.145, một lệnh Bash dạng `FOO=bar somecommand` (một phép gán biến trần nằm cùng dòng với một lệnh không có trong allowlist) có thể được tự động phê duyệt khi chỉ riêng `FOO=bar` nằm trong allowlist. v2.1.145 đã đóng lỗ hổng này: các lệnh như vậy giờ sẽ hiện prompt xin quyền. Các script dựa vào việc cho phép ngầm định sẽ bắt đầu hiện prompt; hãy cho phép lại chúng một cách tường minh bằng một quy tắc quyền `Bash(...)` bao trọn cả lệnh, không chỉ phép gán biến.

### Thực Hành Tốt Nhất

| Nên | Không Nên |
|-----|-------|
| Xác thực và làm sạch mọi đầu vào | Tin tưởng dữ liệu đầu vào một cách mù quáng |
| Đặt biến shell trong dấu nháy: `"$VAR"` | Dùng không có dấu nháy: `$VAR` |
| Chặn path traversal (`..`) | Cho phép đường dẫn tùy ý |
| Dùng đường dẫn tuyệt đối với `$CLAUDE_PROJECT_DIR` | Hardcode đường dẫn |
| Bỏ qua các file nhạy cảm (`.env`, `.git/`, keys) | Xử lý tất cả các file |
| Test hook riêng lẻ trước | Triển khai hook chưa được test |
| Dùng `allowedEnvVars` rõ ràng cho HTTP hook | Để lộ toàn bộ biến môi trường cho webhook |

## Gỡ Lỗi

### Bật Chế Độ Debug

Chạy Claude với cờ debug để xem log chi tiết của hook:

```bash
claude --debug
```

### Chế Độ Verbose

Dùng `Ctrl+O` trong Claude Code để bật chế độ verbose và xem tiến trình thực thi hook.

### Test Hook Độc Lập

```bash
# Test với đầu vào JSON mẫu
echo '{"tool_name": "Bash", "tool_input": {"command": "ls -la"}}' | python3 .claude/hooks/validate-bash.py

# Kiểm tra exit code
echo $?
```

## Ví Dụ Cấu Hình Hoàn Chỉnh

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/validate-bash.py\"",
            "timeout": 10
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/format-code.sh\"",
            "timeout": 30
          },
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/security-scan.py\"",
            "timeout": 10
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/validate-prompt.py\""
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/session-init.sh\""
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Verify all tasks are complete before stopping.",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

## Chi Tiết Thực Thi Hook

| Khía Cạnh | Hành Vi |
|--------|----------|
| **Timeout** | Mặc định 600 giây cho command/http/mcp_tool (30 cho prompt, 60 cho agent); có thể cấu hình cho từng hook |
| **Chạy song song** | Tất cả hook khớp đều chạy song song; từ v2.1.302, tối đa 12 prompt hook hoặc agent hook của cùng một sự kiện chạy cùng lúc, số còn lại chờ đến lượt. |
| **Loại bỏ trùng lặp** | Các lệnh hook giống hệt nhau được loại bỏ trùng lặp |
| **Môi trường** | Chạy trong thư mục hiện tại với môi trường của Claude Code |

## Khắc Phục Sự Cố

### Hook Không Thực Thi
- Xác minh cú pháp cấu hình JSON là đúng
- Kiểm tra mẫu matcher có khớp với tên công cụ
- Đảm bảo script tồn tại và có quyền thực thi: `chmod +x script.sh`
- Chạy `claude --debug` để xem log thực thi hook
- Xác minh hook đọc JSON từ stdin (không phải từ đối số lệnh)

### Hook Chặn Ngoài Dự Kiến
- Test hook với JSON mẫu: `echo '{"tool_name": "Write", ...}' | ./hook.py`
- Kiểm tra exit code: phải là 0 để cho phép, 2 để chặn
- Kiểm tra đầu ra stderr (được hiển thị khi exit code là 2)

### Lỗi Phân Tích JSON
- Luôn đọc từ stdin, không đọc từ đối số lệnh
- Dùng trình phân tích JSON đúng cách (không thao tác chuỗi thủ công)
- Xử lý êm các trường bị thiếu

## Cài Đặt

### Bước 1: Tạo Thư Mục Hooks
```bash
mkdir -p ~/.claude/hooks
```

### Bước 2: Sao Chép Các Hook Ví Dụ
```bash
cp 06-hooks/*.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/*.sh
```

### Bước 3: Cấu Hình Trong Settings
Chỉnh sửa `~/.claude/settings.json` hoặc `.claude/settings.json` với cấu hình hook được trình bày ở trên.

## Các Khái Niệm Liên Quan

- **[Checkpoints và Rewind](../08-checkpoints/)** - Lưu và khôi phục trạng thái hội thoại
- **[Lệnh Slash](../01-slash-commands/)** - Tạo các lệnh slash tùy chỉnh
- **[Skills](../03-skills/)** - Các khả năng tự động có thể tái sử dụng
- **[Tác Nhân Con](../04-subagents/)** - Ủy quyền thực thi nhiệm vụ
- **[Plugins](../07-plugins/)** - Các gói mở rộng được đóng gói sẵn
- **[Tính Năng Nâng Cao](../09-advanced-features/)** - Khám phá các khả năng nâng cao của Claude Code

## Tài Nguyên Bổ Sung

- **[Tài Liệu Hooks Chính Thức](https://code.claude.com/docs/en/hooks)** - Tài liệu tham chiếu đầy đủ về hooks
- **[CLI Reference](https://code.claude.com/docs/en/cli-reference)** - Tài liệu giao diện dòng lệnh
- **[Hướng Dẫn Bộ Nhớ](../02-memory/)** - Cấu hình ngữ cảnh lâu dài

---

**Cập Nhật Lần Cuối**: Ngày 18 tháng 10 năm 2026
**Phiên Bản Claude Code**: 2.1.302
**Nguồn**:
- https://code.claude.com/docs/en/hooks
- https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/permissions
- https://code.claude.com/docs/en/tools-reference#task-tool-availability
- https://code.claude.com/docs/en/plugins/manifest-reference#quoting-and-path-separators
- https://github.com/anthropics/claude-code/releases/tag/v2.1.295
- https://code.claude.com/docs/en/hooks#pretooluse
- https://code.claude.com/docs/en/hooks#pretooluse-decision-control
- https://code.claude.com/docs/en/hooks#hook-lifecycle
- https://code.claude.com/docs/en/hooks#userpromptsubmit-input
- https://code.claude.com/docs/en/changelog#2-1-299
- https://code.claude.com/docs/en/changelog#2-1-300
- https://code.claude.com/docs/en/changelog#2-1-301
- https://code.claude.com/docs/en/changelog#2-1-302
**Các Mô Hình Tương Thích**: Claude Fable 5, Claude Opus 5, Claude Sonnet 5, Claude Sonnet 4.6, Claude Opus 4.8, Claude Haiku 4.5
