<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../resources/logos/claude-howto-logo-dark.svg">
  <img alt="Claude How To" src="../resources/logos/claude-howto-logo.svg">
</picture>

<p align="center">
  <a href="https://github.com/trending">
    <img src="https://img.shields.io/badge/GitHub-🔥%20%231%20Trending-purple?style=for-the-badge&logo=github"/>
  </a>
</p>

[![GitHub Stars](https://img.shields.io/github/stars/luongnv89/claude-howto?style=flat&color=gold)](https://github.com/luongnv89/claude-howto/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/luongnv89/claude-howto?style=flat)](https://github.com/luongnv89/claude-howto/network/members)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.1.302-brightgreen)](CHANGELOG.md)
[![Claude Code](https://img.shields.io/badge/Claude_Code-2.1+-purple)](https://code.claude.com)

🌐 **Language / Ngôn ngữ / 语言 / Мова:** [English](../README.md) | [Tiếng Việt](README.md) | [中文](../zh/README.md) | [Українська](../uk/README.md) | [日本語](../ja/README.md)

> Đây là bản tiếng Việt của [Claude Code How-To Guide](../README.md). Xem [TRANSLATION_NOTES.md](TRANSLATION_NOTES.md) để biết glossary thuật ngữ và quy tắc dịch, và [TRANSLATION_QUEUE.md](TRANSLATION_QUEUE.md) để theo dõi tiến độ dịch.

# Làm Chủ Claude Code Trong Một Cuối Tuần

Từ việc gõ `claude` đến điều phối tác nhân, hook, skill và MCP server, với hướng dẫn trực quan, template sao chép là dùng được và một lộ trình học có hướng dẫn.

**[Bắt Đầu Trong 15 Phút](#bắt-đầu-trong-15-phút)** | **[Tìm Cấp Độ Của Bạn](#chưa-biết-bắt-đầu-từ-đâu)** | **[Xem Danh Mục Tính Năng](CATALOG.md)**

---

## Mục Lục

- [Vấn Đề](#vấn-đề)
- [Claude How To Giải Quyết Vấn Đề Này Như Thế Nào](#claude-how-to-giải-quyết-vấn-đề-này-như-thế-nào)
- [Cách Hoạt Động](#cách-hoạt-động)
- [Chưa Biết Bắt Đầu Từ Đâu?](#chưa-biết-bắt-đầu-từ-đâu)
- [Bắt Đầu Trong 15 Phút](#bắt-đầu-trong-15-phút)
- [Bạn Có Thể Xây Dựng Gì Với Hướng Dẫn Này?](#bạn-có-thể-xây-dựng-gì-với-hướng-dẫn-này)
- [Câu Hỏi Thường Gặp](#câu-hỏi-thường-gặp)
- [Đóng Góp](#đóng-góp)
- [Giấy Phép](#giấy-phép)

---

## Vấn Đề

Bạn đã cài Claude Code. Bạn đã chạy thử vài prompt. Tiếp theo là gì?

- **Tài liệu chính thức mô tả các tính năng, nhưng không chỉ cho bạn cách kết hợp chúng.** Bạn biết lệnh slash tồn tại, nhưng không biết cách nối chúng với hook, bộ nhớ và tác nhân con thành một workflow thực sự tiết kiệm hàng giờ làm việc.
- **Không có lộ trình học rõ ràng.** Nên học MCP trước hook? Skill trước tác nhân con? Cuối cùng bạn lướt qua mọi thứ mà không làm chủ được gì.
- **Ví dụ quá cơ bản.** Một lệnh slash kiểu "hello world" không giúp bạn xây dựng một pipeline review code cho môi trường production có dùng bộ nhớ, giao việc cho các tác nhân chuyên biệt và tự động chạy quét bảo mật.

Bạn đang bỏ phí 90% sức mạnh của Claude Code, và bạn không biết mình đang bỏ lỡ những gì.

---

## Claude How To Giải Quyết Vấn Đề Này Như Thế Nào

Đây không phải là một tài liệu tham chiếu tính năng khác. Đây là một **hướng dẫn có cấu trúc, trực quan, xoay quanh ví dụ** giúp bạn sử dụng mọi tính năng của Claude Code với các template thực tế mà bạn có thể sao chép vào dự án ngay hôm nay.

| | Tài liệu chính thức | Hướng dẫn này |
|--|---------------|------------|
| **Định dạng** | Tài liệu tham chiếu | Hướng dẫn trực quan với sơ đồ Mermaid |
| **Độ sâu** | Mô tả tính năng | Cách hoạt động bên trong |
| **Ví dụ** | Đoạn code cơ bản | Template sẵn sàng cho production, dùng được ngay |
| **Cấu trúc** | Sắp xếp theo tính năng | Lộ trình học tăng dần (từ người mới đến nâng cao) |
| **Làm quen** | Tự tìm hiểu | Lộ trình có hướng dẫn kèm ước tính thời gian |
| **Tự đánh giá** | Không có | Bài quiz tương tác giúp tìm lỗ hổng kiến thức và xây dựng lộ trình riêng |

### Bạn nhận được gì:

- **10 module hướng dẫn** bao quát mọi tính năng của Claude Code, từ lệnh slash đến đội tác nhân tùy chỉnh
- **Cấu hình sao chép là dùng được**: lệnh slash, template CLAUDE.md, script hook, cấu hình MCP, định nghĩa tác nhân con và trọn bộ plugin
- **Sơ đồ Mermaid** cho thấy cách mỗi tính năng hoạt động bên trong, để bạn hiểu *tại sao*, không chỉ *làm thế nào*
- **Một lộ trình học có hướng dẫn** đưa bạn từ người mới thành người dùng thành thạo trong 11-13 giờ
- **Tự đánh giá tích hợp sẵn**: chạy `/self-assessment` hoặc `/lesson-quiz hooks` trực tiếp trong Claude Code để xác định lỗ hổng kiến thức

**[Bắt Đầu Lộ Trình Học  ->](LEARNING-ROADMAP.md)**

---

## Cách Hoạt Động

### 1. Tìm cấp độ của bạn

Làm [bài quiz tự đánh giá](LEARNING-ROADMAP.md#-tìm-cấp-độ-của-bạn) hoặc chạy `/self-assessment` trong Claude Code. Bạn sẽ nhận được lộ trình cá nhân hóa dựa trên những gì bạn đã biết.

### 2. Đi theo lộ trình có hướng dẫn

Học lần lượt 10 module theo thứ tự, mỗi module được xây dựng dựa trên module trước. Sao chép template trực tiếp vào dự án của bạn trong lúc học.

### 3. Kết hợp các tính năng thành workflow

Sức mạnh thực sự nằm ở việc kết hợp các tính năng. Hãy học cách nối lệnh slash + bộ nhớ + tác nhân con + hook thành các pipeline tự động xử lý review code, triển khai và tạo tài liệu.

### 4. Kiểm tra mức độ hiểu bài

Chạy `/lesson-quiz [topic]` sau mỗi module. Bài quiz chỉ ra chính xác những gì bạn còn thiếu để bạn lấp đầy nhanh chóng.

**[Bắt Đầu Trong 15 Phút](#bắt-đầu-trong-15-phút)**

---

## Được Các Lập Trình Viên Tin Dùng

- **GitHub stars** từ các lập trình viên dùng Claude Code hằng ngày
- **Forks** từ các nhóm điều chỉnh hướng dẫn này cho workflow riêng của họ
- **Được duy trì tích cực**: đồng bộ với mọi bản phát hành của Claude Code (mới nhất: v2.1.302, tháng 10/2026)
- **Do cộng đồng phát triển**: đóng góp từ các lập trình viên chia sẻ cấu hình thực tế của họ

[![Star History Chart](https://api.star-history.com/svg?repos=luongnv89/claude-howto&type=Date)](https://star-history.com/#luongnv89/claude-howto&Date)

---

## Chưa Biết Bắt Đầu Từ Đâu?

Làm bài tự đánh giá hoặc chọn cấp độ của bạn:

| Cấp độ | Bạn có thể... | Bắt đầu tại đây | Thời gian |
|-------|-----------|------------|------|
| **Người mới** | Khởi động Claude Code và trò chuyện | [Lệnh Slash](01-slash-commands/) | ~2,5 giờ |
| **Trung cấp** | Dùng CLAUDE.md và lệnh tùy chỉnh | [Skills](03-skills/) | ~3,5 giờ |
| **Nâng cao** | Cấu hình MCP server và hook | [Tính Năng Nâng Cao](09-advanced-features/) | ~5 giờ |

**Lộ trình học đầy đủ với cả 10 module:**

| Thứ tự | Module | Cấp độ | Thời gian |
|-------|--------|-------|------|
| 1 | [Lệnh Slash](01-slash-commands/) | Người mới | 30 phút |
| 2 | [Bộ Nhớ](02-memory/) | Người mới+ | 45 phút |
| 3 | [Checkpoints](08-checkpoints/) | Trung cấp | 45 phút |
| 4 | [CLI Cơ Bản](10-cli/) | Người mới+ | 30 phút |
| 5 | [Skills](03-skills/) | Trung cấp | 1 giờ |
| 6 | [Hooks](06-hooks/) | Trung cấp | 1 giờ |
| 7 | [MCP](05-mcp/) | Trung cấp+ | 1 giờ |
| 8 | [Tác Nhân Con](04-subagents/) | Trung cấp+ | 1,5 giờ |
| 9 | [Tính Năng Nâng Cao](09-advanced-features/) | Nâng cao | 2-3 giờ |
| 10 | [Plugins](07-plugins/) | Nâng cao | 2 giờ |

**[Lộ Trình Học Hoàn Chỉnh ->](LEARNING-ROADMAP.md)**

---

## Bắt Đầu Trong 15 Phút

> **Lưu ý cài đặt**: Từ v2.1.113, Claude Code được phân phối dưới dạng binary native riêng cho từng nền tảng (macOS/Linux/Windows). Cách cài đặt được khuyến nghị là trình cài đặt native (`curl -fsSL https://claude.ai/install.sh | bash`); cài đặt qua npm đã bị đánh dấu deprecated trong README chính thức, nên hãy ưu tiên trình cài đặt native, Homebrew (`brew install --cask claude-code`) hoặc WinGet (`winget install Anthropic.ClaudeCode`). Để tham khảo, `npm install -g @anthropic-ai/claude-code` tải về cùng binary native đó thông qua một optional dependency theo từng nền tảng khi cài đặt. Từ v2.1.116, các bản tải về đến từ `https://downloads.claude.ai/claude-code-releases`, vì vậy proxy doanh nghiệp phải đưa host này vào allowlist.

```bash
# 1. Clone hướng dẫn
git clone https://github.com/luongnv89/claude-howto.git
cd claude-howto

# 2. Sao chép lệnh slash đầu tiên của bạn
mkdir -p /path/to/your-project/.claude/commands
cp 01-slash-commands/optimize.md /path/to/your-project/.claude/commands/

# 3. Dùng thử: trong Claude Code, gõ:
# /optimize

# 4. Sẵn sàng cho nhiều hơn? Thiết lập bộ nhớ dự án:
cp 02-memory/project-CLAUDE.md /path/to/your-project/CLAUDE.md

# 5. Cài đặt một skill:
cp -r 03-skills/code-review-specialist ~/.claude/skills/
```

Muốn thiết lập đầy đủ? Đây là **bộ thiết lập thiết yếu trong 1 giờ**:

```bash
# Lệnh slash (15 phút)
cp 01-slash-commands/*.md .claude/commands/

# Bộ nhớ dự án (15 phút)
cp 02-memory/project-CLAUDE.md ./CLAUDE.md

# Cài đặt một skill (15 phút)
cp -r 03-skills/code-review-specialist ~/.claude/skills/

# Mục tiêu cuối tuần: thêm hook, tác nhân con, MCP và plugin
# Làm theo lộ trình học để được hướng dẫn thiết lập
```

**[Xem Tham Chiếu Cài Đặt Đầy Đủ](#bắt-đầu-trong-15-phút)**

---

## Bạn Có Thể Xây Dựng Gì Với Hướng Dẫn Này?

| Tình huống sử dụng | Các tính năng bạn sẽ kết hợp |
|----------|------------------------|
| **Review code tự động** | Lệnh Slash + Tác Nhân Con + Bộ Nhớ + MCP |
| **Hướng dẫn thành viên mới** | Bộ Nhớ + Lệnh Slash + Plugins |
| **Tự động hóa CI/CD** | Tham Chiếu CLI + Hooks + Tác Vụ Nền |
| **Tạo tài liệu** | Skills + Tác Nhân Con + Plugins |
| **Kiểm tra bảo mật** | Tác Nhân Con + Skills + Hooks (chế độ chỉ đọc) |
| **Pipeline DevOps** | Plugins + MCP + Hooks + Tác Vụ Nền |
| **Refactor phức tạp** | Checkpoints + Chế Độ Lập Kế Hoạch + Hooks |

---

## Câu Hỏi Thường Gặp

**Hướng dẫn này có miễn phí không?**
Có. Giấy phép MIT, miễn phí mãi mãi. Bạn có thể dùng trong dự án cá nhân, ở nơi làm việc, trong nhóm của bạn, không có giới hạn nào ngoài việc giữ lại thông báo giấy phép.

**Hướng dẫn này có được duy trì không?**
Có, một cách tích cực. Hướng dẫn được đồng bộ với mọi bản phát hành của Claude Code. Phiên bản hiện tại: v2.1.302 (tháng 10/2026), tương thích với Claude Code 2.1+.

**Hướng dẫn này khác gì so với tài liệu chính thức?**
Tài liệu chính thức là tài liệu tham chiếu tính năng. Hướng dẫn này là một tutorial có sơ đồ, template sẵn sàng cho production và lộ trình học tăng dần. Hai nguồn bổ trợ cho nhau: hãy bắt đầu ở đây để học, và tra cứu tài liệu chính thức khi cần chi tiết cụ thể.

**Mất bao lâu để học hết mọi thứ?**
11-13 giờ cho toàn bộ lộ trình. Nhưng bạn sẽ thấy giá trị ngay trong 15 phút: chỉ cần sao chép một template lệnh slash và dùng thử.

**Tôi có thể dùng hướng dẫn này với Claude Sonnet / Haiku / Opus không?**
Có. Tất cả template đều hoạt động với Claude Fable 5.1, Claude Fable 5, Claude Opus 5.5, Claude Opus 5, Claude Sonnet 5.5, Claude Sonnet 5, Claude Sonnet 4.6, Claude Opus 4.8, Claude Haiku 5.5 và Claude Haiku 4.5.

**Tôi có thể đóng góp không?**
Hoàn toàn được. Xem [CONTRIBUTING.md](CONTRIBUTING.md) để biết hướng dẫn. Chúng tôi hoan nghênh ví dụ mới, sửa lỗi, cải thiện tài liệu và template từ cộng đồng.

**Tôi có thể đọc offline không?**
Có. Chạy `uv run scripts/build_epub.py` để tạo ebook EPUB chứa toàn bộ nội dung và các sơ đồ đã được render.

---

## Bắt Đầu Làm Chủ Claude Code Ngay Hôm Nay

Bạn đã cài Claude Code. Điều duy nhất ngăn cách bạn với năng suất gấp 10 lần là biết cách sử dụng nó. Hướng dẫn này cho bạn lộ trình có cấu trúc, các giải thích trực quan và template sao chép là dùng được để đạt được điều đó.

Giấy phép MIT. Miễn phí mãi mãi. Hãy clone, fork và biến nó thành của bạn.

**[Bắt Đầu Lộ Trình Học ->](LEARNING-ROADMAP.md)** | **[Xem Danh Mục Tính Năng](CATALOG.md)** | **[Bắt Đầu Trong 15 Phút](#bắt-đầu-trong-15-phút)**

---

<details>
<summary>Điều Hướng Nhanh: Tất Cả Tính Năng</summary>

| Tính năng | Mô tả | Thư mục |
|---------|-------------|--------|
| **Danh Mục Tính Năng** | Tham chiếu đầy đủ kèm lệnh cài đặt | [CATALOG.md](CATALOG.md) |
| **Lệnh Slash** | Phím tắt do người dùng gọi | [01-slash-commands/](01-slash-commands/) |
| **Bộ Nhớ** | Ngữ cảnh lưu trữ lâu dài | [02-memory/](02-memory/) |
| **Skills** | Khả năng có thể tái sử dụng | [03-skills/](03-skills/) |
| **Tác Nhân Con** | Trợ lý AI chuyên biệt | [04-subagents/](04-subagents/) |
| **Giao Thức MCP** | Truy cập công cụ bên ngoài | [05-mcp/](05-mcp/) |
| **Hooks** | Tự động hóa theo sự kiện | [06-hooks/](06-hooks/) |
| **Plugins** | Tính năng được đóng gói | [07-plugins/](07-plugins/) |
| **Checkpoints** | Snapshot phiên làm việc và rewind | [08-checkpoints/](08-checkpoints/) |
| **Tính Năng Nâng Cao** | Lập kế hoạch, suy luận, tác vụ nền | [09-advanced-features/](09-advanced-features/) |
| **Tham Chiếu CLI** | Lệnh, cờ và tùy chọn | [10-cli/](10-cli/) |
| **Bài Viết Blog** | Ví dụ sử dụng thực tế | [Bài Viết Blog](https://medium.com/@luongnv89) |

</details>

<details>
<summary>So Sánh Tính Năng</summary>

| Tính năng | Cách gọi | Tính lưu trữ | Phù hợp nhất cho |
|---------|-----------|------------|----------|
| **Lệnh Slash** | Thủ công (`/cmd`) | Chỉ trong phiên | Phím tắt nhanh |
| **Bộ Nhớ** | Tự động nạp | Xuyên phiên | Ghi nhớ dài hạn |
| **Skills** | Tự động gọi | Hệ thống file | Workflow tự động |
| **Tác Nhân Con** | Tự động giao việc | Ngữ cảnh tách biệt | Phân chia tác vụ |
| **Giao Thức MCP** | Tự động truy vấn | Thời gian thực | Truy cập dữ liệu trực tiếp |
| **Hooks** | Kích hoạt theo sự kiện | Theo cấu hình | Tự động hóa và kiểm tra |
| **Plugins** | Một lệnh | Mọi tính năng | Giải pháp trọn gói |
| **Checkpoints** | Thủ công/Tự động | Theo phiên | Thử nghiệm an toàn |
| **Chế Độ Lập Kế Hoạch** | Thủ công/Tự động | Giai đoạn lập kế hoạch | Triển khai phức tạp |
| **Tác Vụ Nền** | Thủ công | Trong thời gian chạy tác vụ | Tác vụ chạy lâu |
| **Tham Chiếu CLI** | Lệnh terminal | Phiên/Script | Tự động hóa và viết script |

</details>

<details>
<summary>Tham Chiếu Nhanh Cài Đặt</summary>

```bash
# Lệnh slash
cp 01-slash-commands/*.md .claude/commands/

# Bộ nhớ
cp 02-memory/project-CLAUDE.md ./CLAUDE.md

# Skills
cp -r 03-skills/code-review-specialist ~/.claude/skills/

# Tác nhân con
cp 04-subagents/*.md .claude/agents/

# MCP
claude mcp add --transport http github https://api.githubcopilot.com/mcp/ --header "Authorization: Bearer YOUR_GITHUB_PAT"

# Hooks
mkdir -p ~/.claude/hooks
cp 06-hooks/*.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/*.sh

# Plugins (nạp một plugin cục bộ từ thư mục gốc của repo)
claude --plugin-dir ./07-plugins/pr-review

# Checkpoints (tự động bật, cấu hình trong settings)
# Xem 08-checkpoints/README.md

# Tính năng nâng cao (cấu hình trong settings)
# Xem 09-advanced-features/config-examples.json

# Tham chiếu CLI (không cần cài đặt)
# Xem 10-cli/README.md để có ví dụ sử dụng
```

</details>

<details>
<summary>01. Lệnh Slash</summary>

**Vị trí**: [01-slash-commands/](01-slash-commands/)

**Là gì**: Phím tắt do người dùng gọi, được lưu dưới dạng file Markdown

**Ví dụ**:
- `optimize.md` - Phân tích tối ưu hóa code
- `pr.md` - Chuẩn bị pull request
- `generate-api-docs.md` - Trình tạo tài liệu API

**Cài đặt**:
```bash
cp 01-slash-commands/*.md /path/to/project/.claude/commands/
```

**Sử dụng**:
```
/optimize
/pr
/generate-api-docs
```

**Tìm hiểu thêm**: [Discovering Claude Code Slash Commands](https://medium.com/@luongnv89/discovering-claude-code-slash-commands-cdc17f0dfb29)

</details>

<details>
<summary>02. Bộ Nhớ</summary>

**Vị trí**: [02-memory/](02-memory/)

**Là gì**: Ngữ cảnh được lưu giữ xuyên suốt các phiên

**Ví dụ**:
- `project-CLAUDE.md` - Tiêu chuẩn dự án cho toàn nhóm
- `directory-api-CLAUDE.md` - Quy tắc riêng cho từng thư mục
- `personal-CLAUDE.md` - Tùy chọn cá nhân

**Cài đặt**:
```bash
# Bộ nhớ dự án
cp 02-memory/project-CLAUDE.md /path/to/project/CLAUDE.md

# Bộ nhớ thư mục
cp 02-memory/directory-api-CLAUDE.md /path/to/project/src/api/CLAUDE.md

# Bộ nhớ cá nhân
cp 02-memory/personal-CLAUDE.md ~/.claude/CLAUDE.md
```

**Sử dụng**: Claude tự động nạp

</details>

<details>
<summary>03. Skills</summary>

**Vị trí**: [03-skills/](03-skills/)

**Là gì**: Các khả năng có thể tái sử dụng, được gọi tự động, kèm hướng dẫn và script

**Ví dụ**:
- `code-review-specialist/` - Review code toàn diện kèm script
- `brand-voice/` - Công cụ kiểm tra tính nhất quán giọng văn thương hiệu
- `doc-generator/` - Trình tạo tài liệu API

**Cài đặt**:
```bash
# Skill cá nhân
cp -r 03-skills/code-review-specialist ~/.claude/skills/

# Skill dự án
cp -r 03-skills/code-review-specialist /path/to/project/.claude/skills/
```

**Sử dụng**: Tự động được gọi khi phù hợp

</details>

<details>
<summary>04. Tác Nhân Con</summary>

**Vị trí**: [04-subagents/](04-subagents/)

**Là gì**: Các trợ lý AI chuyên biệt với ngữ cảnh tách biệt và prompt tùy chỉnh

**Ví dụ**:
- `code-reviewer.md` - Phân tích chất lượng code toàn diện
- `test-engineer.md` - Chiến lược kiểm thử và độ bao phủ
- `documentation-writer.md` - Tài liệu kỹ thuật
- `secure-reviewer.md` - Review tập trung vào bảo mật (chỉ đọc)
- `implementation-agent.md` - Triển khai tính năng hoàn chỉnh

**Cài đặt**:
```bash
cp 04-subagents/*.md /path/to/project/.claude/agents/
```

**Sử dụng**: Tác nhân chính tự động giao việc

</details>

<details>
<summary>05. Giao Thức MCP</summary>

**Vị trí**: [05-mcp/](05-mcp/)

**Là gì**: Model Context Protocol để truy cập công cụ và API bên ngoài

**Ví dụ**:
- `github-mcp.json` - Tích hợp GitHub
- `database-mcp.json` - Truy vấn cơ sở dữ liệu
- `filesystem-mcp.json` - Thao tác file
- `multi-mcp.json` - Nhiều MCP server

**Cài đặt**:
```bash
# Thiết lập biến môi trường
export DATABASE_URL="postgresql://..."

# Thêm MCP server qua CLI
claude mcp add --transport http github https://api.githubcopilot.com/mcp/ --header "Authorization: Bearer YOUR_GITHUB_PAT"

# Hoặc thêm thủ công vào .mcp.json của dự án (xem ví dụ trong 05-mcp/)
```

**Sử dụng**: Sau khi cấu hình, các công cụ MCP tự động sẵn sàng cho Claude

</details>

<details>
<summary>06. Hooks</summary>

**Vị trí**: [06-hooks/](06-hooks/)

**Là gì**: Các lệnh shell theo sự kiện, tự động thực thi khi có sự kiện của Claude Code

**Ví dụ**:
- `format-code.sh` - Tự động định dạng code sau khi ghi
- `pre-commit.sh` - Chạy test trước khi commit
- `security-scan.sh` - Quét các vấn đề bảo mật
- `log-bash.sh` - Ghi log mọi lệnh bash
- `validate-prompt.sh` - Kiểm tra prompt của người dùng
- `notify-team.sh` - Gửi thông báo khi có sự kiện

**Cài đặt**:
```bash
mkdir -p ~/.claude/hooks
cp 06-hooks/*.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/*.sh
```

Cấu hình hook trong `~/.claude/settings.json`:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          { "type": "command", "command": "~/.claude/hooks/format-code.sh" },
          { "type": "command", "command": "~/.claude/hooks/security-scan.sh" }
        ]
      }
    ]
  }
}
```

**Sử dụng**: Hook tự động thực thi khi có sự kiện

**Loại Hook** (5): `command`, `http`, `prompt`, `mcp_tool`, `agent`, quyết định cách hook chạy.

**Sự Kiện Hook** (33, chia thành 4 nhóm), quyết định khi nào hook chạy:
- **Hook công cụ**: `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`, `PermissionRequest`, `PermissionDenied`
- **Hook phiên**: `SessionStart`, `Setup`, `SessionEnd`, `Stop`, `StopFailure`, `SubagentStart`, `SubagentStop`
- **Hook tác vụ**: `UserPromptSubmit`, `UserPromptExpansion`, `MessageDisplay`, `TaskCompleted`, `TaskCreated`, `TeammateIdle`. Lưu ý: `TaskCompleted` và `TaskCreated` chỉ kích hoạt khi các công cụ todo được bật; mặc định chúng chỉ có trên các model Claude 3.x, Opus 4 đến 4.7, Sonnet 4 đến 4.6 và Haiku 4.5 (`CLAUDE_CODE_ENABLE_TODO_TOOLS=1` sẽ bật lại chúng)
- **Hook vòng đời**: `ConfigChange`, `CwdChanged`, `DirectoryAdded`, `FileChanged`, `PreCompact`, `PostCompact`, `PreModelSwitch`, `PostModelSwitch`, `WorktreeCreate`, `WorktreeRemove`, `Notification`, `InstructionsLoaded`, `Elicitation`, `ElicitationResult`

</details>

<details>
<summary>07. Plugins</summary>

**Vị trí**: [07-plugins/](07-plugins/)

**Là gì**: Bộ sưu tập đóng gói gồm lệnh, tác nhân, MCP và hook

**Ví dụ**:
- `pr-review/` - Workflow review PR hoàn chỉnh
- `devops-automation/` - Triển khai và giám sát
- `documentation/` - Tạo tài liệu

**Cài đặt**:
```bash
# Từ thư mục gốc của repo (repo này không có marketplace, nên /plugin install không áp dụng)
claude --plugin-dir ./07-plugins/pr-review
claude --plugin-dir ./07-plugins/devops-automation
claude --plugin-dir ./07-plugins/documentation
```

**Sử dụng**: Dùng các lệnh slash và tính năng đi kèm trong gói

</details>

<details>
<summary>08. Checkpoints và Rewind</summary>

**Vị trí**: [08-checkpoints/](08-checkpoints/)

**Là gì**: Lưu trạng thái cuộc hội thoại và quay lại các thời điểm trước đó để thử các hướng tiếp cận khác nhau

**Khái niệm chính**:
- **Checkpoint**: Snapshot trạng thái cuộc hội thoại
- **Rewind**: Quay lại checkpoint trước đó
- **Điểm rẽ nhánh (Branch Point)**: Thử nhiều hướng tiếp cận từ cùng một checkpoint

**Sử dụng**:
```
# Checkpoint được tạo tự động với mỗi prompt của người dùng
# Để rewind, nhấn Esc hai lần hoặc dùng:
/rewind

# Sau đó chọn một trong sáu tùy chọn:
# 1. Khôi phục code và cuộc hội thoại (Restore code and conversation)
# 2. Khôi phục cuộc hội thoại (Restore conversation)
# 3. Khôi phục code (Restore code)
# 4. Tóm tắt từ đây (Summarize from here)
# 5. Tóm tắt đến đây (Summarize up to here)
# 6. Bỏ qua (Never mind)
```

**Tình huống sử dụng**:
- Thử các cách triển khai khác nhau
- Khôi phục sau khi mắc lỗi
- Thử nghiệm an toàn
- So sánh các giải pháp thay thế
- A/B testing các thiết kế khác nhau

</details>

<details>
<summary>09. Tính Năng Nâng Cao</summary>

**Vị trí**: [09-advanced-features/](09-advanced-features/)

**Là gì**: Các khả năng nâng cao cho workflow phức tạp và tự động hóa

**Bao gồm**:
- **Chế độ lập kế hoạch (Planning Mode)**: Tạo kế hoạch triển khai chi tiết trước khi viết code
- **Suy luận mở rộng (Extended Thinking)**: Suy luận sâu cho các vấn đề phức tạp (bật/tắt bằng `Alt+T` / `Option+T`)
- **Tác vụ nền (Background Tasks)**: Chạy các tác vụ dài mà không bị chặn
- **Chế độ quyền (Permission Modes)**: `manual` (giá trị cấu hình `default`), `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`
- **Chế độ headless (Headless Mode)**: Chạy Claude Code trong CI/CD: `claude -p "Run tests and generate report"`
- **Quản lý phiên (Session Management)**: `/resume`, `/rename`, `/fork`, `/branch`, `claude -c`, `claude -r`
- **Cấu hình**: Tùy chỉnh hành vi trong `~/.claude/settings.json`

Xem [config-examples.json](09-advanced-features/config-examples.json) để có cấu hình đầy đủ.

</details>

<details>
<summary>10. Tham Chiếu CLI</summary>

**Vị trí**: [10-cli/](10-cli/)

**Là gì**: Tham chiếu đầy đủ giao diện dòng lệnh của Claude Code

**Ví dụ nhanh**:
```bash
# Chế độ tương tác
claude "explain this project"

# Chế độ print (không tương tác)
claude -p "review this code"

# Xử lý nội dung file
cat error.log | claude -p "explain this error"

# Xuất JSON cho script
claude -p --output-format json "list functions"

# Tiếp tục phiên
claude -r "feature-auth" "continue implementation"
```

**Tình huống sử dụng**: Tích hợp pipeline CI/CD, tự động hóa bằng script, xử lý hàng loạt, workflow nhiều phiên, cấu hình tác nhân tùy chỉnh

</details>

<details>
<summary>Ví Dụ Workflow</summary>

### Workflow Review Code Hoàn Chỉnh

```markdown
# Sử dụng: Lệnh Slash + Tác Nhân Con + Bộ Nhớ + MCP

User: /review-pr

Claude:
1. Nạp bộ nhớ dự án (tiêu chuẩn viết code)
2. Lấy PR qua GitHub MCP
3. Giao việc cho tác nhân con code-reviewer
4. Giao việc cho tác nhân con test-engineer
5. Tổng hợp kết quả
6. Đưa ra bản review toàn diện
```

### Tài Liệu Tự Động

```markdown
# Sử dụng: Skills + Tác Nhân Con + Bộ Nhớ

User: "Generate API documentation for the auth module"

Claude:
1. Nạp bộ nhớ dự án (tiêu chuẩn tài liệu)
2. Nhận diện yêu cầu tạo tài liệu
3. Tự động gọi skill doc-generator
4. Giao việc cho tác nhân con api-documenter
5. Tạo tài liệu toàn diện kèm ví dụ
```

### Triển Khai DevOps

```markdown
# Sử dụng: Plugins + MCP + Hooks

User: /deploy production

Claude:
1. Chạy hook pre-deploy (kiểm tra môi trường)
2. Giao việc cho tác nhân con deployment-specialist
3. Thực hiện triển khai qua Kubernetes MCP
4. Theo dõi tiến trình
5. Chạy hook post-deploy (kiểm tra sức khỏe hệ thống)
6. Báo cáo trạng thái
```

</details>

<details>
<summary>Cấu Trúc Thư Mục</summary>

```
├── 01-slash-commands/
│   ├── optimize.md
│   ├── pr.md
│   ├── generate-api-docs.md
│   └── README.md
├── 02-memory/
│   ├── project-CLAUDE.md
│   ├── directory-api-CLAUDE.md
│   ├── personal-CLAUDE.md
│   └── README.md
├── 03-skills/
│   ├── code-review-specialist/
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   └── templates/
│   ├── brand-voice/
│   │   ├── SKILL.md
│   │   └── templates/
│   ├── doc-generator/
│   │   ├── SKILL.md
│   │   └── generate-docs.py
│   └── README.md
├── 04-subagents/
│   ├── code-reviewer.md
│   ├── test-engineer.md
│   ├── documentation-writer.md
│   ├── secure-reviewer.md
│   ├── implementation-agent.md
│   └── README.md
├── 05-mcp/
│   ├── github-mcp.json
│   ├── database-mcp.json
│   ├── filesystem-mcp.json
│   ├── multi-mcp.json
│   └── README.md
├── 06-hooks/
│   ├── format-code.sh
│   ├── pre-commit.sh
│   ├── security-scan.sh
│   ├── log-bash.sh
│   ├── validate-prompt.sh
│   ├── notify-team.sh
│   └── README.md
├── 07-plugins/
│   ├── pr-review/
│   ├── devops-automation/
│   ├── documentation/
│   └── README.md
├── 08-checkpoints/
│   ├── checkpoint-examples.md
│   └── README.md
├── 09-advanced-features/
│   ├── config-examples.json
│   ├── planning-mode-examples.md
│   └── README.md
├── 10-cli/
│   └── README.md
└── README.md (file này)
```

</details>

<details>
<summary>Thực Hành Tốt Nhất</summary>

### Nên làm
- Bắt đầu đơn giản với lệnh slash
- Thêm tính năng từng bước
- Dùng bộ nhớ cho tiêu chuẩn của nhóm
- Kiểm thử cấu hình ở máy cục bộ trước
- Ghi tài liệu cho các triển khai tùy chỉnh
- Quản lý phiên bản cấu hình dự án
- Chia sẻ plugin với nhóm

### Không nên làm
- Đừng tạo các tính năng trùng lặp
- Đừng hardcode thông tin xác thực
- Đừng bỏ qua tài liệu
- Đừng làm phức tạp hóa các tác vụ đơn giản
- Đừng phớt lờ các thực hành bảo mật tốt nhất
- Đừng commit dữ liệu nhạy cảm

</details>

<details>
<summary>Khắc Phục Sự Cố</summary>

### Tính năng không được nạp
1. Kiểm tra vị trí và tên file
2. Xác minh cú pháp YAML frontmatter
3. Kiểm tra quyền truy cập file
4. Xem lại khả năng tương thích với phiên bản Claude Code

### Kết nối MCP thất bại
1. Xác minh biến môi trường
2. Kiểm tra cài đặt MCP server
3. Kiểm tra thông tin xác thực
4. Xem lại kết nối mạng

### Tác nhân con không nhận việc
1. Kiểm tra quyền của công cụ
2. Xác minh mô tả tác nhân có rõ ràng không
3. Xem lại độ phức tạp của tác vụ
4. Kiểm thử tác nhân một cách độc lập

</details>

<details>
<summary>Kiểm Thử</summary>

Dự án này có hệ thống kiểm thử tự động toàn diện:

- **Unit test**: Test Python dùng pytest (Python 3.10, 3.11, 3.12)
- **Chất lượng code**: Lint và định dạng với Ruff
- **Bảo mật**: Quét lỗ hổng với Bandit
- **Kiểm tra kiểu**: Phân tích kiểu tĩnh với mypy
- **Xác minh build**: Kiểm thử việc tạo EPUB
- **Theo dõi độ bao phủ**: Tích hợp Codecov

```bash
# Cài đặt dependencies cho môi trường phát triển
uv pip install -r scripts/requirements-dev.txt

# Chạy toàn bộ unit test
pytest scripts/tests/ -v

# Chạy test kèm báo cáo độ bao phủ
pytest scripts/tests/ -v --cov=scripts --cov-report=html

# Chạy kiểm tra chất lượng code
ruff check scripts/
ruff format --check scripts/

# Chạy quét bảo mật
bandit -c scripts/pyproject.toml -r scripts/ --exclude scripts/tests/

# Chạy kiểm tra kiểu
mypy scripts/ --ignore-missing-imports
```

Test tự động chạy trên mỗi lần push lên `main`/`develop` và mỗi PR vào `main`. Xem [TESTING.md](../.github/TESTING.md) để biết thông tin chi tiết.

</details>

<details>
<summary>Tạo EPUB</summary>

Muốn đọc hướng dẫn này offline? Hãy tạo ebook EPUB:

```bash
uv run scripts/build_epub.py
```

Lệnh này tạo file `claude-howto-guide.epub` với toàn bộ nội dung, bao gồm cả các sơ đồ Mermaid đã được render.

Xem [scripts/README.md](../scripts/README.md) để biết thêm tùy chọn.

</details>

<details>
<summary>Đóng Góp</summary>

Bạn phát hiện lỗi hoặc muốn đóng góp một ví dụ? Chúng tôi rất mong nhận được sự giúp đỡ của bạn!

**Vui lòng đọc [CONTRIBUTING.md](CONTRIBUTING.md) để có hướng dẫn chi tiết về:**
- Các loại đóng góp (ví dụ, tài liệu, tính năng, lỗi, phản hồi)
- Cách thiết lập môi trường phát triển
- Cấu trúc thư mục và cách thêm nội dung
- Hướng dẫn viết và thực hành tốt nhất
- Quy trình commit và PR

**Tiêu chuẩn cộng đồng của chúng tôi:**
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) - Cách chúng ta đối xử với nhau
- [SECURITY.md](SECURITY.md) - Chính sách bảo mật và báo cáo lỗ hổng

### Báo Cáo Vấn Đề Bảo Mật

Nếu bạn phát hiện lỗ hổng bảo mật, vui lòng báo cáo một cách có trách nhiệm:

1. **Dùng GitHub Private Vulnerability Reporting**: https://github.com/luongnv89/claude-howto/security/advisories
2. **Hoặc đọc** [.github/SECURITY_REPORTING.md](../.github/SECURITY_REPORTING.md) để có hướng dẫn chi tiết
3. **KHÔNG** mở issue công khai cho lỗ hổng bảo mật

Bắt đầu nhanh:
1. Fork và clone kho chứa
2. Tạo branch có tên mô tả rõ ràng (`add/feature-name`, `fix/bug`, `docs/improvement`)
3. Thực hiện thay đổi theo hướng dẫn
4. Gửi pull request kèm mô tả rõ ràng

**Cần trợ giúp?** Hãy mở một issue hoặc discussion, chúng tôi sẽ hướng dẫn bạn qua từng bước.

</details>

<details>
<summary>Tài Nguyên Bổ Sung</summary>

- [Tài liệu Claude Code](https://code.claude.com/docs/en/overview)
- [Đặc tả giao thức MCP](https://modelcontextprotocol.io)
- [Kho Skills](https://github.com/luongnv89/skills) - Bộ sưu tập skill sẵn sàng sử dụng
- [Anthropic Cookbook](https://github.com/anthropics/anthropic-cookbook)
- [Workflow Claude Code của Boris Cherny](https://x.com/bcherny/status/2007179832300581177) - Người tạo ra Claude Code chia sẻ workflow có hệ thống của mình: tác nhân chạy song song, CLAUDE.md dùng chung, Plan mode, lệnh slash, tác nhân con và hook xác minh cho các phiên tự động chạy dài.

</details>

---

## Đóng Góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng xem [Hướng Dẫn Đóng Góp](CONTRIBUTING.md) để biết cách bắt đầu.

---

## Giấy Phép

Giấy phép MIT, xem [LICENSE](LICENSE). Tự do sử dụng, chỉnh sửa và phân phối. Yêu cầu duy nhất là giữ lại thông báo giấy phép.

---

**Cập nhật lần cuối**: 18 tháng 10, 2026
**Phiên bản Claude Code**: 2.1.302
**Nguồn tham khảo**:
- https://code.claude.com/docs/en/tools-reference#task-tool-availability
- https://code.claude.com/docs/en/hooks
- https://code.claude.com/docs/en/overview
- https://code.claude.com/docs/en/changelog
- https://code.claude.com/docs/en/permission-modes
- https://platform.claude.com/docs/en/about-claude/models/overview
- https://github.com/anthropics/claude-code/releases
- https://github.com/anthropics/claude-code/releases/tag/v2.1.154
- https://code.claude.com/docs/en/model-config
- https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
- https://github.com/anthropics/claude-code/releases/tag/v2.1.296
- https://code.claude.com/docs/en/setup
- https://code.claude.com/docs/en/mcp
- https://code.claude.com/docs/en/plugins/install
- https://code.claude.com/docs/en/checkpointing
- https://github.com/anthropics/claude-code
- https://code.claude.com/docs/en/changelog#2-1-302
**Model tương thích**: Claude Fable 5.1, Claude Fable 5, Claude Opus 5, Claude Sonnet 5, Claude Sonnet 4.6, Claude Opus 4.8, Claude Haiku 4.5
**Ngôn ngữ**: Tiếng Việt (vi-VN)
