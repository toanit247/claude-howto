# Danh Mục Code Smells

Tài liệu tham khảo toàn diện về code smells dựa trên cuốn *Refactoring* (ấn bản 2) của Martin Fowler. Code smells là triệu chứng của những vấn đề sâu hơn: chúng cho thấy có thể có điều gì đó không ổn trong thiết kế code của bạn.

> "Code smell là một dấu hiệu bề mặt, thường tương ứng với một vấn đề sâu hơn trong hệ thống." (Martin Fowler)

---

## Nhóm Phình To (Bloaters)

Các code smells thể hiện thứ gì đó đã phát triển quá lớn để có thể xử lý hiệu quả.

### Hàm Quá Dài (Long Method)

**Dấu hiệu:**
- Method vượt quá 30-50 dòng
- Phải cuộn màn hình mới xem hết method
- Có nhiều cấp lồng nhau
- Có comments giải thích từng đoạn làm gì

**Tại sao nó có hại:**
- Khó hiểu
- Khó test một cách độc lập
- Thay đổi gây ra hậu quả ngoài ý muốn
- Logic trùng lặp ẩn bên trong

**Các refactoring:**
- Extract Method
- Replace Temp with Query
- Introduce Parameter Object
- Replace Method with Method Object
- Decompose Conditional

**Ví dụ (Trước):**
```javascript
function processOrder(order) {
  // Xác thực đơn hàng (20 dòng)
  if (!order.items) throw new Error('No items');
  if (order.items.length === 0) throw new Error('Empty order');
  // ... thêm các bước xác thực khác

  // Tính tổng tiền (30 dòng)
  let subtotal = 0;
  for (const item of order.items) {
    subtotal += item.price * item.quantity;
  }
  // ... thuế, phí vận chuyển, giảm giá

  // Gửi thông báo (20 dòng)
  // ... logic gửi email
}
```

**Ví dụ (Sau):**
```javascript
function processOrder(order) {
  validateOrder(order);
  const totals = calculateOrderTotals(order);
  sendOrderNotifications(order, totals);
  return { order, totals };
}
```

---

### Lớp Quá Lớn (Large Class)

**Dấu hiệu:**
- Class có nhiều biến instance (>7-10)
- Class có nhiều methods (>15-20)
- Tên class mơ hồ (Manager, Handler, Processor)
- Các methods không dùng hết các biến instance

**Tại sao nó có hại:**
- Vi phạm Nguyên tắc Đơn Trách Nhiệm (Single Responsibility Principle)
- Khó test
- Thay đổi lan sang các tính năng không liên quan
- Khó tái sử dụng từng phần

**Các refactoring:**
- Extract Class
- Extract Subclass
- Extract Interface

**Phát hiện:**
```
Lines of code > 300
Number of methods > 15
Number of fields > 10
```

---

### Ám Ảnh Kiểu Nguyên Thủy (Primitive Obsession)

**Dấu hiệu:**
- Dùng kiểu nguyên thủy cho các khái niệm domain (string cho email, int cho tiền)
- Mảng các giá trị nguyên thủy thay vì objects
- Hằng chuỗi dùng làm mã kiểu (type code)
- Số/chuỗi "ma thuật" (magic numbers/strings)

**Tại sao nó có hại:**
- Không có xác thực ở cấp kiểu dữ liệu
- Logic rải rác khắp codebase
- Dễ truyền sai giá trị
- Thiếu các khái niệm domain

**Các refactoring:**
- Replace Primitive with Object
- Replace Type Code with Class
- Replace Type Code with Subclasses
- Replace Type Code with State/Strategy

**Ví dụ (Trước):**
```javascript
const user = {
  email: 'john@example.com',     // Chỉ là một chuỗi
  phone: '1234567890',           // Chỉ là một chuỗi
  status: 'active',              // Chuỗi ma thuật
  balance: 10050                 // Số xu dưới dạng số nguyên
};
```

**Ví dụ (Sau):**
```javascript
const user = {
  email: new Email('john@example.com'),
  phone: new PhoneNumber('1234567890'),
  status: UserStatus.ACTIVE,
  balance: Money.cents(10050)
};
```

---

### Danh Sách Tham Số Quá Dài (Long Parameter List)

**Dấu hiệu:**
- Methods có từ 4 parameters trở lên
- Các parameters luôn xuất hiện cùng nhau
- Cờ boolean làm thay đổi hành vi của method
- Thường xuyên phải truyền null/undefined

**Tại sao nó có hại:**
- Khó gọi đúng
- Dễ nhầm thứ tự parameters
- Cho thấy method đang làm quá nhiều việc
- Khó thêm parameters mới

**Các refactoring:**
- Introduce Parameter Object
- Preserve Whole Object
- Replace Parameter with Method Call
- Remove Flag Argument

**Ví dụ (Trước):**
```javascript
function createUser(firstName, lastName, email, phone,
                    street, city, state, zip,
                    isAdmin, isActive, createdBy) {
  // ...
}
```

**Ví dụ (Sau):**
```javascript
function createUser(personalInfo, address, options) {
  // personalInfo: { firstName, lastName, email, phone }
  // address: { street, city, state, zip }
  // options: { isAdmin, isActive, createdBy }
}
```

---

### Cụm Dữ Liệu (Data Clumps)

**Dấu hiệu:**
- Cùng một nhóm từ 3 fields trở lên lặp lại cùng nhau nhiều lần
- Các parameters luôn đi cùng nhau
- Các class có những nhóm fields con thuộc về nhau

**Tại sao nó có hại:**
- Logic xử lý bị trùng lặp
- Thiếu abstraction
- Khó mở rộng hơn
- Cho thấy có một class đang bị ẩn

**Các refactoring:**
- Extract Class
- Introduce Parameter Object
- Preserve Whole Object

**Ví dụ:**
```javascript
// Cụm dữ liệu: tọa độ (x, y, z)
function movePoint(x, y, z, dx, dy, dz) { }
function scalePoint(x, y, z, factor) { }
function distanceBetween(x1, y1, z1, x2, y2, z2) { }

// Extract class Point3D
class Point3D {
  constructor(x, y, z) { }
  move(delta) { }
  scale(factor) { }
  distanceTo(other) { }
}
```

---

## Nhóm Lạm Dụng Hướng Đối Tượng (Object-Orientation Abusers)

Các smells cho thấy việc áp dụng các nguyên tắc OOP chưa đầy đủ hoặc chưa đúng.

### Câu Lệnh Switch (Switch Statements)

**Dấu hiệu:**
- Chuỗi switch/case hoặc if/else dài
- Cùng một switch xuất hiện ở nhiều nơi
- Switch dựa trên mã kiểu (type code)
- Thêm case mới đòi hỏi thay đổi ở khắp nơi

**Tại sao nó có hại:**
- Vi phạm Nguyên tắc Đóng/Mở (Open/Closed Principle)
- Thay đổi lan đến mọi vị trí có switch
- Khó mở rộng
- Thường cho thấy đang thiếu polymorphism

**Các refactoring:**
- Replace Conditional with Polymorphism
- Replace Type Code with Subclasses
- Replace Type Code with State/Strategy

**Ví dụ (Trước):**
```javascript
function calculatePay(employee) {
  switch (employee.type) {
    case 'hourly':
      return employee.hours * employee.rate;
    case 'salaried':
      return employee.salary / 12;
    case 'commissioned':
      return employee.sales * employee.commission;
  }
}
```

**Ví dụ (Sau):**
```javascript
class HourlyEmployee {
  calculatePay() {
    return this.hours * this.rate;
  }
}

class SalariedEmployee {
  calculatePay() {
    return this.salary / 12;
  }
}
```

---

### Trường Tạm Thời (Temporary Field)

**Dấu hiệu:**
- Biến instance chỉ được dùng trong một số methods
- Fields được gán giá trị theo điều kiện
- Khởi tạo phức tạp cho một số trường hợp nhất định

**Tại sao nó có hại:**
- Gây khó hiểu: field tồn tại nhưng có thể là null
- Khó nắm bắt trạng thái của object
- Cho thấy logic điều kiện đang bị che giấu

**Các refactoring:**
- Extract Class
- Introduce Null Object
- Replace Temp Field with Local

---

### Từ Chối Di Sản (Refused Bequest)

**Dấu hiệu:**
- Subclass không dùng các methods/dữ liệu được kế thừa
- Subclass override để không làm gì cả
- Dùng kế thừa để tái sử dụng code, không phải cho quan hệ IS-A

**Tại sao nó có hại:**
- Abstraction sai
- Vi phạm Nguyên tắc Thay Thế Liskov (Liskov Substitution Principle)
- Hệ thống phân cấp gây hiểu lầm

**Các refactoring:**
- Push Down Method/Field
- Replace Subclass with Delegate
- Replace Inheritance with Delegation

---

### Các Lớp Thay Thế Với Interface Khác Nhau (Alternative Classes with Different Interfaces)

**Dấu hiệu:**
- Hai class làm những việc tương tự nhau
- Tên method khác nhau cho cùng một khái niệm
- Có thể dùng thay thế lẫn nhau

**Tại sao nó có hại:**
- Triển khai bị trùng lặp
- Không có interface chung
- Khó chuyển đổi qua lại

**Các refactoring:**
- Rename Method
- Move Method
- Extract Superclass
- Extract Interface

---

## Nhóm Cản Trở Thay Đổi (Change Preventers)

Các smells khiến việc thay đổi trở nên khó khăn: thay đổi một chỗ đòi hỏi thay đổi nhiều chỗ khác.

### Thay Đổi Phân Kỳ (Divergent Change)

**Dấu hiệu:**
- Một class bị thay đổi vì nhiều lý do khác nhau
- Thay đổi ở các khu vực khác nhau đều dẫn đến sửa cùng một class
- Class là một "God class"

**Tại sao nó có hại:**
- Vi phạm Nguyên tắc Đơn Trách Nhiệm
- Tần suất thay đổi cao
- Xung đột khi merge

**Các refactoring:**
- Extract Class
- Extract Superclass
- Extract Subclass

**Ví dụ:**
Một class `User` thay đổi vì:
- Thay đổi về xác thực
- Thay đổi về hồ sơ người dùng
- Thay đổi về thanh toán
- Thay đổi về thông báo

→ Extract: `AuthService`, `ProfileService`, `BillingService`, `NotificationService`

---

### Phẫu Thuật Bằng Súng Hoa Cải (Shotgun Surgery)

**Dấu hiệu:**
- Một thay đổi đòi hỏi sửa nhiều class
- Một tính năng nhỏ cũng cần chạm vào hơn 10 files
- Các thay đổi rải rác, khó tìm hết

**Tại sao nó có hại:**
- Dễ bỏ sót một chỗ
- Coupling cao
- Thay đổi dễ gây lỗi

**Các refactoring:**
- Move Method
- Move Field
- Inline Class

**Phát hiện:**
Tìm các trường hợp: thêm một field đòi hỏi thay đổi trong hơn 5 files.

---

### Hệ Thống Kế Thừa Song Song (Parallel Inheritance Hierarchies)

**Dấu hiệu:**
- Tạo subclass trong một hệ thống phân cấp đòi hỏi tạo subclass ở hệ thống khác
- Tiền tố tên class trùng nhau (ví dụ: `DatabaseOrder`, `DatabaseProduct`)

**Tại sao nó có hại:**
- Công sức bảo trì tăng gấp đôi
- Coupling giữa các hệ thống phân cấp
- Dễ quên cập nhật một phía

**Các refactoring:**
- Move Method
- Move Field
- Loại bỏ một hệ thống phân cấp

---

## Nhóm Không Cần Thiết (Dispensables)

Những thứ không cần thiết và nên được loại bỏ.

### Comments (Quá Mức)

**Dấu hiệu:**
- Comments giải thích code làm gì
- Code bị comment lại
- TODO/FIXME tồn tại mãi không được xử lý
- Lời xin lỗi trong comments

**Tại sao nó có hại:**
- Comments có thể sai sự thật (không đồng bộ với code)
- Code nên tự giải thích chính nó
- Dead code gây nhầm lẫn

**Các refactoring:**
- Extract Method (tên method giải thích nó làm gì)
- Rename (rõ ràng mà không cần comments)
- Xóa code bị comment lại
- Introduce Assertion

**Comments Tốt và Comments Xấu:**
```javascript
// XẤU: Giải thích code làm gì
// Lặp qua danh sách users và kiểm tra xem có active không
for (const user of users) {
  if (user.status === 'active') { }
}

// TỐT: Giải thích tại sao
// Chỉ lấy users active - users inactive được xử lý bởi cleanup job
const activeUsers = users.filter(u => u.isActive);
```

---

### Code Trùng Lặp (Duplicate Code)

**Dấu hiệu:**
- Cùng một đoạn code ở nhiều nơi
- Code tương tự với những khác biệt nhỏ
- Các mẫu copy-paste

**Tại sao nó có hại:**
- Phải sửa lỗi ở nhiều nơi
- Rủi ro thiếu nhất quán
- Codebase phình to

**Các refactoring:**
- Extract Method
- Extract Class
- Pull Up Method (trong hệ thống phân cấp)
- Form Template Method

**Quy tắc phát hiện:**
Bất kỳ đoạn code nào bị lặp từ 3 lần trở lên nên được extract.

---

### Lớp Lười Biếng (Lazy Class)

**Dấu hiệu:**
- Class không làm đủ việc để biện minh cho sự tồn tại của nó
- Wrapper không mang lại giá trị gì thêm
- Hệ quả của việc over-engineering

**Tại sao nó có hại:**
- Tăng chi phí bảo trì
- Tầng gián tiếp không cần thiết
- Phức tạp mà không có lợi ích

**Các refactoring:**
- Inline Class
- Collapse Hierarchy

---

### Code Chết (Dead Code)

**Dấu hiệu:**
- Code không thể chạy tới
- Biến/methods/classes không được sử dụng
- Code bị comment lại
- Code nằm sau các điều kiện không bao giờ xảy ra

**Tại sao nó có hại:**
- Gây nhầm lẫn
- Gánh nặng bảo trì
- Làm chậm việc hiểu code

**Các refactoring:**
- Remove Dead Code
- Safe Delete

**Phát hiện:**
```bash
# Tìm các exports không được sử dụng
# Tìm các hàm không được tham chiếu
# Cảnh báo "unused" của IDE
```

---

### Tổng Quát Hóa Suy Đoán (Speculative Generality)

**Dấu hiệu:**
- Abstract class chỉ có một subclass
- Parameters không dùng đến, để "dành cho tương lai"
- Methods chỉ làm nhiệm vụ ủy quyền (delegate)
- "Framework" chỉ phục vụ một use case

**Tại sao nó có hại:**
- Phức tạp mà không có lợi ích
- YAGNI (You Ain't Gonna Need It: bạn sẽ không cần đến nó)
- Khó hiểu hơn

**Các refactoring:**
- Collapse Hierarchy
- Inline Class
- Remove Parameter
- Rename Method

---

## Nhóm Kết Dính (Couplers)

Các smells thể hiện coupling quá mức giữa các class.

### Đố Kỵ Tính Năng (Feature Envy)

**Dấu hiệu:**
- Method dùng dữ liệu của class khác nhiều hơn dữ liệu của chính nó
- Gọi nhiều getter của một object khác
- Dữ liệu và hành vi bị tách rời

**Tại sao nó có hại:**
- Hành vi đặt sai chỗ
- Đóng gói kém
- Khó bảo trì

**Các refactoring:**
- Move Method
- Move Field
- Extract Method (rồi di chuyển)

**Ví dụ (Trước):**
```javascript
class Order {
  getDiscountedPrice(customer) {
    // Dùng dữ liệu của customer rất nhiều
    if (customer.loyaltyYears > 5) {
      return this.price * customer.discountRate;
    }
    return this.price;
  }
}
```

**Ví dụ (Sau):**
```javascript
class Customer {
  getDiscountedPriceFor(price) {
    if (this.loyaltyYears > 5) {
      return price * this.discountRate;
    }
    return price;
  }
}
```

---

### Thân Mật Không Phù Hợp (Inappropriate Intimacy)

**Dấu hiệu:**
- Các class truy cập phần private của nhau
- Tham chiếu hai chiều
- Subclass biết quá nhiều về class cha

**Tại sao nó có hại:**
- Coupling cao
- Thay đổi lan truyền dây chuyền
- Khó sửa một class mà không ảnh hưởng class kia

**Các refactoring:**
- Move Method
- Move Field
- Change Bidirectional to Unidirectional
- Extract Class
- Hide Delegate

---

### Chuỗi Thông Điệp (Message Chains)

**Dấu hiệu:**
- Chuỗi gọi method dài: `a.getB().getC().getD().getValue()`
- Client phụ thuộc vào cấu trúc điều hướng
- Code kiểu "đoàn tàu trật bánh" (train wreck)

**Tại sao nó có hại:**
- Dễ vỡ: bất kỳ thay đổi nào cũng làm gãy chuỗi
- Vi phạm Định luật Demeter (Law of Demeter)
- Coupling với cấu trúc

**Các refactoring:**
- Hide Delegate
- Extract Method
- Move Method

**Ví dụ:**
```javascript
// Xấu: Chuỗi thông điệp
const managerName = employee.getDepartment().getManager().getName();

// Tốt hơn: Ẩn việc ủy quyền
const managerName = employee.getManagerName();
```

---

### Người Trung Gian (Middle Man)

**Dấu hiệu:**
- Class chỉ ủy quyền cho class khác
- Một nửa số methods là ủy quyền
- Không mang lại giá trị gì thêm

**Tại sao nó có hại:**
- Tầng gián tiếp không cần thiết
- Tăng chi phí bảo trì
- Kiến trúc gây khó hiểu

**Các refactoring:**
- Remove Middle Man
- Inline Method

---

## Hướng Dẫn Mức Độ Nghiêm Trọng Của Smell

| Mức độ | Mô tả | Hành động |
|----------|-------------|--------|
| **Nguy Kịch** | Chặn phát triển, gây bugs | Sửa ngay lập tức |
| **Cao** | Gánh nặng bảo trì đáng kể | Sửa trong sprint hiện tại |
| **Trung Bình** | Dễ nhận thấy nhưng còn kiểm soát được | Lên kế hoạch trong thời gian gần |
| **Thấp** | Bất tiện nhỏ | Sửa khi có dịp |

---

## Checklist Phát Hiện Nhanh

Sử dụng checklist này khi rà soát code:

- [ ] Có method nào > 30 dòng không?
- [ ] Có class nào > 300 dòng không?
- [ ] Có method nào với > 4 parameters không?
- [ ] Có khối code nào bị trùng lặp không?
- [ ] Có switch/case nào dựa trên mã kiểu không?
- [ ] Có code nào không được sử dụng không?
- [ ] Có method nào dùng nhiều dữ liệu của class khác không?
- [ ] Có chuỗi gọi method dài nào không?
- [ ] Có comments nào giải thích "cái gì" thay vì "tại sao" không?
- [ ] Có kiểu nguyên thủy nào nên là object không?

---

## Đọc Thêm

- Fowler, M. (2018). *Refactoring: Improving the Design of Existing Code* (2nd ed.)
- Kerievsky, J. (2004). *Refactoring to Patterns*
- Feathers, M. (2004). *Working Effectively with Legacy Code*

---

**Cập Nhật Lần Cuối**: Ngày 4 tháng 8 năm 2026
**Phiên Bản Claude Code**: 2.1.220
**Nguồn**:
- https://code.claude.com/docs/en/skills
**Các Mô Hình Tương Thích**: Claude Fable 5, Claude Opus 5, Claude Sonnet 5, Claude Sonnet 4.6, Claude Opus 4.8, Claude Haiku 4.5
