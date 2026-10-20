---
name: doc-generator
description: Tạo tài liệu API toàn diện, chính xác từ mã nguồn. Sử dụng khi tạo hoặc cập nhật tài liệu API, tạo đặc tả OpenAPI, hoặc khi người dùng đề cập đến tài liệu API, endpoints, hoặc tài liệu.
---

# Skill Tạo Tài Liệu API

## Những Gì Được Tạo

- Đặc tả OpenAPI/Swagger
- Tài liệu endpoint API
- Ví dụ sử dụng SDK
- Hướng dẫn tích hợp
- Tham chiếu mã lỗi
- Hướng dẫn xác thực

## Cấu Trúc Tài Liệu

### Cho Mỗi Endpoint

````markdown
## GET /api/v1/users/:id

### Mô Tả
Giải thích ngắn gọn endpoint này làm gì

### Tham Số

| Tên | Kiểu | Bắt Buộc | Mô Tả |
|------|------|----------|-------------|
| id | string | Có | ID người dùng |

### Phản Hồi

**200 Success**
```json
{
  "id": "usr_123",
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2025-01-15T10:30:00Z"
}
```

**404 Not Found**
```json
{
  "error": "USER_NOT_FOUND",
  "message": "User does not exist"
}
```

### Ví Dụ

**cURL**
```bash
curl -X GET "https://api.example.com/api/v1/users/usr_123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**JavaScript**
```javascript
const user = await fetch('/api/v1/users/usr_123', {
  headers: { 'Authorization': 'Bearer token' }
}).then(r => r.json());
```

**Python**
```python
response = requests.get(
    'https://api.example.com/api/v1/users/usr_123',
    headers={'Authorization': 'Bearer token'}
)
user = response.json()
```
````

---

**Cập Nhật Lần Cuối**: Ngày 4 tháng 8 năm 2026
**Phiên Bản Claude Code**: 2.1.220
**Nguồn**:
- https://code.claude.com/docs/en/skills
**Các Mô Hình Tương Thích**: Claude Fable 5, Claude Opus 5, Claude Sonnet 5, Claude Sonnet 4.6, Claude Opus 4.8, Claude Haiku 4.5
