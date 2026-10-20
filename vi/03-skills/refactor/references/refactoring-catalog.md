# Catalog Refactoring

Một catalog chọn lọc các kỹ thuật refactoring từ cuốn *Refactoring* (ấn bản 2) của Martin Fowler. Mỗi refactoring gồm động cơ, cơ chế thực hiện từng bước, và ví dụ.

> "Một refactoring được định nghĩa bởi cơ chế của nó: chuỗi các bước chính xác mà bạn tuân theo để thực hiện thay đổi." (Martin Fowler)

---

## Cách Sử Dụng Catalog Này

1. **Xác định smell** bằng tài liệu tham khảo code smells
2. **Tìm refactoring phù hợp** trong catalog này
3. **Làm theo cơ chế** từng bước một
4. **Test sau mỗi bước** để đảm bảo hành vi được bảo toàn

**Quy Tắc Vàng**: Nếu bất kỳ bước nào mất hơn 10 phút, hãy chia nhỏ nó thành các bước nhỏ hơn.

---

## Các Refactoring Phổ Biến Nhất

### Tách Hàm (Extract Method)

**Khi nào sử dụng**: Hàm dài, code trùng lặp, cần đặt tên cho một khái niệm

**Động cơ**: Biến một đoạn code thành một hàm có tên giải thích mục đích của nó.

**Cơ chế**:
1. Tạo một hàm mới, đặt tên theo việc nó làm (không phải cách nó làm)
2. Sao chép đoạn code vào hàm mới
3. Rà soát các biến cục bộ được dùng trong đoạn code
4. Truyền các biến cục bộ dưới dạng tham số (hoặc khai báo trong hàm)
5. Xử lý giá trị trả về phù hợp
6. Thay thế đoạn code gốc bằng lời gọi đến hàm mới
7. Test

**Trước**:
```javascript
function printOwing(invoice) {
  let outstanding = 0;

  console.log("***********************");
  console.log("**** Customer Owes ****");
  console.log("***********************");

  // Tính số tiền còn nợ
  for (const order of invoice.orders) {
    outstanding += order.amount;
  }

  // In chi tiết
  console.log(`name: ${invoice.customer}`);
  console.log(`amount: ${outstanding}`);
}
```

**Sau**:
```javascript
function printOwing(invoice) {
  printBanner();
  const outstanding = calculateOutstanding(invoice);
  printDetails(invoice, outstanding);
}

function printBanner() {
  console.log("***********************");
  console.log("**** Customer Owes ****");
  console.log("***********************");
}

function calculateOutstanding(invoice) {
  return invoice.orders.reduce((sum, order) => sum + order.amount, 0);
}

function printDetails(invoice, outstanding) {
  console.log(`name: ${invoice.customer}`);
  console.log(`amount: ${outstanding}`);
}
```

---

### Gộp Hàm Nội Tuyến (Inline Method)

**Khi nào sử dụng**: Thân hàm rõ ràng như chính tên của nó, ủy quyền quá mức

**Động cơ**: Loại bỏ lớp gián tiếp không cần thiết khi hàm không mang lại giá trị.

**Cơ chế**:
1. Kiểm tra rằng hàm không có tính đa hình
2. Tìm tất cả lời gọi đến hàm
3. Thay thế mỗi lời gọi bằng thân hàm
4. Test sau mỗi lần thay thế
5. Xóa định nghĩa hàm

**Trước**:
```javascript
function getRating(driver) {
  return moreThanFiveLateDeliveries(driver) ? 2 : 1;
}

function moreThanFiveLateDeliveries(driver) {
  return driver.numberOfLateDeliveries > 5;
}
```

**Sau**:
```javascript
function getRating(driver) {
  return driver.numberOfLateDeliveries > 5 ? 2 : 1;
}
```

---

### Tách Biến (Extract Variable)

**Khi nào sử dụng**: Biểu thức phức tạp, khó hiểu

**Động cơ**: Đặt tên cho một phần của biểu thức phức tạp.

**Cơ chế**:
1. Đảm bảo biểu thức không có side effect
2. Khai báo một biến bất biến (immutable)
3. Gán cho nó kết quả của biểu thức (hoặc một phần)
4. Thay thế biểu thức gốc bằng biến
5. Test

**Trước**:
```javascript
return order.quantity * order.itemPrice -
  Math.max(0, order.quantity - 500) * order.itemPrice * 0.05 +
  Math.min(order.quantity * order.itemPrice * 0.1, 100);
```

**Sau**:
```javascript
const basePrice = order.quantity * order.itemPrice;
const quantityDiscount = Math.max(0, order.quantity - 500) * order.itemPrice * 0.05;
const shipping = Math.min(basePrice * 0.1, 100);
return basePrice - quantityDiscount + shipping;
```

---

### Gộp Biến Nội Tuyến (Inline Variable)

**Khi nào sử dụng**: Tên biến không truyền đạt được nhiều hơn chính biểu thức

**Động cơ**: Loại bỏ lớp gián tiếp không cần thiết.

**Cơ chế**:
1. Kiểm tra rằng vế phải không có side effect
2. Nếu biến chưa bất biến, hãy làm cho nó bất biến rồi test
3. Tìm tham chiếu đầu tiên và thay bằng biểu thức
4. Test
5. Lặp lại cho tất cả tham chiếu
6. Xóa phần khai báo và phép gán
7. Test

---

### Đổi Tên Biến (Rename Variable)

**Khi nào sử dụng**: Tên không truyền đạt rõ ràng mục đích

**Động cơ**: Tên tốt là yếu tố then chốt của clean code.

**Cơ chế**:
1. Nếu biến được dùng rộng rãi, cân nhắc đóng gói nó
2. Tìm tất cả tham chiếu
3. Thay đổi từng tham chiếu
4. Test

**Mẹo**:
- Dùng tên thể hiện rõ ý định
- Tránh viết tắt
- Dùng thuật ngữ của domain

```javascript
// Không tốt
const d = 30;
const x = users.filter(u => u.a);

// Tốt
const daysSinceLastLogin = 30;
const activeUsers = users.filter(user => user.isActive);
```

---

### Thay Đổi Khai Báo Hàm (Change Function Declaration)

**Khi nào sử dụng**: Tên hàm không giải thích được mục đích, tham số cần thay đổi

**Động cơ**: Tên hàm tốt giúp code tự mô tả chính nó.

**Cơ chế (Đơn giản)**:
1. Xóa các tham số không cần thiết
2. Đổi tên
3. Thêm các tham số cần thiết
4. Test

**Cơ chế (Di chuyển dần, cho các thay đổi phức tạp)**:
1. Nếu xóa tham số, đảm bảo nó không được sử dụng
2. Tạo hàm mới với khai báo mong muốn
3. Cho hàm cũ gọi hàm mới
4. Test
5. Thay đổi các nơi gọi để dùng hàm mới
6. Test sau mỗi lần thay đổi
7. Xóa hàm cũ

**Trước**:
```javascript
function circum(radius) {
  return 2 * Math.PI * radius;
}
```

**Sau**:
```javascript
function circumference(radius) {
  return 2 * Math.PI * radius;
}
```

---

### Đóng Gói Biến (Encapsulate Variable)

**Khi nào sử dụng**: Dữ liệu bị truy cập trực tiếp từ nhiều nơi

**Động cơ**: Cung cấp một điểm truy cập rõ ràng để thao tác dữ liệu.

**Cơ chế**:
1. Tạo các hàm getter và setter
2. Tìm tất cả tham chiếu
3. Thay các thao tác đọc bằng getter
4. Thay các thao tác ghi bằng setter
5. Test sau mỗi thay đổi
6. Giới hạn phạm vi truy cập của biến

**Trước**:
```javascript
let defaultOwner = { firstName: "Martin", lastName: "Fowler" };

// Được dùng ở nhiều nơi
spaceship.owner = defaultOwner;
```

**Sau**:
```javascript
let defaultOwnerData = { firstName: "Martin", lastName: "Fowler" };

function defaultOwner() { return defaultOwnerData; }
function setDefaultOwner(arg) { defaultOwnerData = arg; }

spaceship.owner = defaultOwner();
```

---

### Giới Thiệu Đối Tượng Tham Số (Introduce Parameter Object)

**Khi nào sử dụng**: Nhiều tham số thường xuyên đi cùng nhau

**Động cơ**: Nhóm các dữ liệu vốn tự nhiên thuộc về nhau.

**Cơ chế**:
1. Tạo một class/cấu trúc mới cho nhóm tham số
2. Test
3. Dùng Thay Đổi Khai Báo Hàm (Change Function Declaration) để thêm đối tượng mới
4. Test
5. Với mỗi tham số trong nhóm, xóa nó khỏi hàm và dùng đối tượng mới
6. Test sau mỗi lần thay đổi

**Trước**:
```javascript
function amountInvoiced(startDate, endDate) { ... }
function amountReceived(startDate, endDate) { ... }
function amountOverdue(startDate, endDate) { ... }
```

**Sau**:
```javascript
class DateRange {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
}

function amountInvoiced(dateRange) { ... }
function amountReceived(dateRange) { ... }
function amountOverdue(dateRange) { ... }
```

---

### Gộp Các Hàm Vào Class (Combine Functions into Class)

**Khi nào sử dụng**: Nhiều hàm cùng thao tác trên một dữ liệu

**Động cơ**: Nhóm các hàm cùng với dữ liệu mà chúng thao tác.

**Cơ chế**:
1. Áp dụng Đóng Gói Bản Ghi (Encapsulate Record) cho dữ liệu chung
2. Di chuyển từng hàm vào class
3. Test sau mỗi lần di chuyển
4. Thay các đối số dữ liệu bằng việc dùng các field của class

**Trước**:
```javascript
function base(reading) { ... }
function taxableCharge(reading) { ... }
function calculateBaseCharge(reading) { ... }
```

**Sau**:
```javascript
class Reading {
  constructor(data) { this._data = data; }

  get base() { ... }
  get taxableCharge() { ... }
  get calculateBaseCharge() { ... }
}
```

---

### Tách Giai Đoạn (Split Phase)

**Khi nào sử dụng**: Code xử lý hai việc khác nhau

**Động cơ**: Tách code thành các giai đoạn riêng biệt với ranh giới rõ ràng.

**Cơ chế**:
1. Tạo một hàm thứ hai cho giai đoạn thứ hai
2. Test
3. Đưa vào một cấu trúc dữ liệu trung gian giữa các giai đoạn
4. Test
5. Tách giai đoạn đầu tiên thành hàm riêng
6. Test

**Trước**:
```javascript
function priceOrder(product, quantity, shippingMethod) {
  const basePrice = product.basePrice * quantity;
  const discount = Math.max(quantity - product.discountThreshold, 0)
    * product.basePrice * product.discountRate;
  const shippingPerCase = (basePrice > shippingMethod.discountThreshold)
    ? shippingMethod.discountedFee : shippingMethod.feePerCase;
  const shippingCost = quantity * shippingPerCase;
  return basePrice - discount + shippingCost;
}
```

**Sau**:
```javascript
function priceOrder(product, quantity, shippingMethod) {
  const priceData = calculatePricingData(product, quantity);
  return applyShipping(priceData, shippingMethod);
}

function calculatePricingData(product, quantity) {
  const basePrice = product.basePrice * quantity;
  const discount = Math.max(quantity - product.discountThreshold, 0)
    * product.basePrice * product.discountRate;
  return { basePrice, quantity, discount };
}

function applyShipping(priceData, shippingMethod) {
  const shippingPerCase = (priceData.basePrice > shippingMethod.discountThreshold)
    ? shippingMethod.discountedFee : shippingMethod.feePerCase;
  const shippingCost = priceData.quantity * shippingPerCase;
  return priceData.basePrice - priceData.discount + shippingCost;
}
```

---

## Di Chuyển Tính Năng

### Di Chuyển Hàm (Move Method)

**Khi nào sử dụng**: Hàm dùng nhiều tính năng của class khác hơn class của chính nó

**Động cơ**: Đặt các hàm cạnh dữ liệu mà chúng dùng nhiều nhất.

**Cơ chế**:
1. Xem xét tất cả phần tử chương trình mà hàm dùng trong class của nó
2. Kiểm tra xem hàm có tính đa hình không
3. Sao chép hàm sang class đích
4. Điều chỉnh cho phù hợp với ngữ cảnh mới
5. Cho hàm gốc ủy quyền sang hàm ở class đích
6. Test
7. Cân nhắc xóa hàm gốc

---

### Di Chuyển Field (Move Field)

**Khi nào sử dụng**: Field được class khác dùng nhiều hơn

**Động cơ**: Giữ dữ liệu cạnh các hàm sử dụng nó.

**Cơ chế**:
1. Đóng gói field nếu chưa làm
2. Test
3. Tạo field ở class đích
4. Cập nhật các tham chiếu để dùng field ở class đích
5. Test
6. Xóa field gốc

---

### Di Chuyển Câu Lệnh Vào Hàm (Move Statements into Function)

**Khi nào sử dụng**: Cùng một đoạn code luôn xuất hiện kèm một lời gọi hàm

**Động cơ**: Loại bỏ trùng lặp bằng cách chuyển đoạn code lặp lại vào trong hàm.

**Cơ chế**:
1. Tách đoạn code lặp lại thành một hàm nếu chưa làm
2. Di chuyển các câu lệnh vào hàm đó
3. Test
4. Nếu các nơi gọi không còn cần các câu lệnh riêng lẻ, hãy xóa chúng

---

### Di Chuyển Câu Lệnh Ra Nơi Gọi (Move Statements to Callers)

**Khi nào sử dụng**: Hành vi chung lại khác nhau giữa các nơi gọi

**Động cơ**: Khi hành vi cần khác nhau, hãy chuyển nó ra khỏi hàm.

**Cơ chế**:
1. Dùng Tách Hàm (Extract Method) cho đoạn code cần di chuyển
2. Dùng Gộp Hàm Nội Tuyến (Inline Method) cho hàm gốc
3. Xóa lời gọi vừa được gộp nội tuyến
4. Di chuyển đoạn code đã tách sang từng nơi gọi
5. Test

---

## Tổ Chức Dữ Liệu

### Thay Kiểu Nguyên Thủy Bằng Đối Tượng (Replace Primitive with Object)

**Khi nào sử dụng**: Một mục dữ liệu cần nhiều hành vi hơn một giá trị đơn giản

**Động cơ**: Đóng gói dữ liệu cùng với hành vi của nó.

**Cơ chế**:
1. Áp dụng Đóng Gói Biến (Encapsulate Variable)
2. Tạo một class giá trị đơn giản
3. Sửa setter để tạo một instance mới
4. Sửa getter để trả về giá trị
5. Test
6. Bổ sung hành vi phong phú hơn cho class mới

**Trước**:
```javascript
class Order {
  constructor(data) {
    this.priority = data.priority; // chuỗi: "high", "rush", v.v.
  }
}

// Cách dùng
if (order.priority === "high" || order.priority === "rush") { ... }
```

**Sau**:
```javascript
class Priority {
  constructor(value) {
    if (!Priority.legalValues().includes(value))
      throw new Error(`Invalid priority: ${value}`);
    this._value = value;
  }

  static legalValues() { return ['low', 'normal', 'high', 'rush']; }
  get value() { return this._value; }

  higherThan(other) {
    return Priority.legalValues().indexOf(this._value) >
           Priority.legalValues().indexOf(other._value);
  }
}

// Cách dùng
if (order.priority.higherThan(new Priority("normal"))) { ... }
```

---

### Thay Biến Tạm Bằng Truy Vấn (Replace Temp with Query)

**Khi nào sử dụng**: Biến tạm giữ kết quả của một biểu thức

**Động cơ**: Làm code rõ ràng hơn bằng cách tách biểu thức thành một hàm.

**Cơ chế**:
1. Kiểm tra rằng biến chỉ được gán một lần
2. Tách vế phải của phép gán thành một hàm
3. Thay các tham chiếu đến biến tạm bằng lời gọi hàm
4. Test
5. Xóa phần khai báo và phép gán biến tạm

**Trước**:
```javascript
const basePrice = this._quantity * this._itemPrice;
if (basePrice > 1000) {
  return basePrice * 0.95;
} else {
  return basePrice * 0.98;
}
```

**Sau**:
```javascript
get basePrice() {
  return this._quantity * this._itemPrice;
}

// Trong hàm
if (this.basePrice > 1000) {
  return this.basePrice * 0.95;
} else {
  return this.basePrice * 0.98;
}
```

---

## Đơn Giản Hóa Logic Điều Kiện

### Phân Rã Điều Kiện (Decompose Conditional)

**Khi nào sử dụng**: Câu lệnh điều kiện (if-then-else) phức tạp

**Động cơ**: Làm rõ ý định bằng cách tách các điều kiện và hành động.

**Cơ chế**:
1. Áp dụng Tách Hàm (Extract Method) cho điều kiện
2. Áp dụng Tách Hàm cho nhánh then
3. Áp dụng Tách Hàm cho nhánh else (nếu có)

**Trước**:
```javascript
if (!aDate.isBefore(plan.summerStart) && !aDate.isAfter(plan.summerEnd)) {
  charge = quantity * plan.summerRate;
} else {
  charge = quantity * plan.regularRate + plan.regularServiceCharge;
}
```

**Sau**:
```javascript
if (isSummer(aDate, plan)) {
  charge = summerCharge(quantity, plan);
} else {
  charge = regularCharge(quantity, plan);
}

function isSummer(date, plan) {
  return !date.isBefore(plan.summerStart) && !date.isAfter(plan.summerEnd);
}

function summerCharge(quantity, plan) {
  return quantity * plan.summerRate;
}

function regularCharge(quantity, plan) {
  return quantity * plan.regularRate + plan.regularServiceCharge;
}
```

---

### Hợp Nhất Biểu Thức Điều Kiện (Consolidate Conditional Expression)

**Khi nào sử dụng**: Nhiều điều kiện cho cùng một kết quả

**Động cơ**: Làm rõ rằng các điều kiện thực chất là một phép kiểm tra duy nhất.

**Cơ chế**:
1. Xác minh các điều kiện không có side effect
2. Kết hợp các điều kiện bằng `and` hoặc `or`
3. Cân nhắc áp dụng Tách Hàm (Extract Method) cho điều kiện đã kết hợp

**Trước**:
```javascript
if (employee.seniority < 2) return 0;
if (employee.monthsDisabled > 12) return 0;
if (employee.isPartTime) return 0;
```

**Sau**:
```javascript
if (isNotEligibleForDisability(employee)) return 0;

function isNotEligibleForDisability(employee) {
  return employee.seniority < 2 ||
         employee.monthsDisabled > 12 ||
         employee.isPartTime;
}
```

---

### Thay Điều Kiện Lồng Nhau Bằng Mệnh Đề Bảo Vệ (Replace Nested Conditional with Guard Clauses)

**Khi nào sử dụng**: Các điều kiện lồng nhau quá sâu khiến luồng xử lý khó theo dõi

**Động cơ**: Dùng mệnh đề bảo vệ (guard clause) cho các trường hợp đặc biệt, giữ cho luồng bình thường rõ ràng.

**Cơ chế**:
1. Tìm các điều kiện của trường hợp đặc biệt
2. Thay chúng bằng các guard clause trả về sớm
3. Test sau mỗi thay đổi

**Trước**:
```javascript
function payAmount(employee) {
  let result;
  if (employee.isSeparated) {
    result = { amount: 0, reasonCode: "SEP" };
  } else {
    if (employee.isRetired) {
      result = { amount: 0, reasonCode: "RET" };
    } else {
      result = calculateNormalPay(employee);
    }
  }
  return result;
}
```

**Sau**:
```javascript
function payAmount(employee) {
  if (employee.isSeparated) return { amount: 0, reasonCode: "SEP" };
  if (employee.isRetired) return { amount: 0, reasonCode: "RET" };
  return calculateNormalPay(employee);
}
```

---

### Thay Điều Kiện Bằng Đa Hình (Replace Conditional with Polymorphism)

**Khi nào sử dụng**: Switch/case dựa trên kiểu, logic điều kiện thay đổi theo kiểu

**Động cơ**: Để các đối tượng tự xử lý hành vi của chính chúng.

**Cơ chế**:
1. Tạo hệ thống phân cấp class (nếu chưa có)
2. Dùng Hàm Factory (Factory Function) để tạo đối tượng
3. Di chuyển logic điều kiện vào hàm của superclass
4. Tạo hàm ở subclass cho từng trường hợp
5. Xóa điều kiện gốc

**Trước**:
```javascript
function plumages(birds) {
  return birds.map(b => plumage(b));
}

function plumage(bird) {
  switch (bird.type) {
    case 'EuropeanSwallow':
      return "average";
    case 'AfricanSwallow':
      return (bird.numberOfCoconuts > 2) ? "tired" : "average";
    case 'NorwegianBlueParrot':
      return (bird.voltage > 100) ? "scorched" : "beautiful";
    default:
      return "unknown";
  }
}
```

**Sau**:
```javascript
class Bird {
  get plumage() { return "unknown"; }
}

class EuropeanSwallow extends Bird {
  get plumage() { return "average"; }
}

class AfricanSwallow extends Bird {
  get plumage() {
    return (this.numberOfCoconuts > 2) ? "tired" : "average";
  }
}

class NorwegianBlueParrot extends Bird {
  get plumage() {
    return (this.voltage > 100) ? "scorched" : "beautiful";
  }
}

function createBird(data) {
  switch (data.type) {
    case 'EuropeanSwallow': return new EuropeanSwallow(data);
    case 'AfricanSwallow': return new AfricanSwallow(data);
    case 'NorwegianBlueParrot': return new NorwegianBlueParrot(data);
    default: return new Bird(data);
  }
}
```

---

### Giới Thiệu Trường Hợp Đặc Biệt (Introduce Special Case, Null Object)

**Khi nào sử dụng**: Lặp lại việc kiểm tra null cho các trường hợp đặc biệt

**Động cơ**: Trả về một đối tượng đặc biệt để xử lý trường hợp đặc biệt.

**Cơ chế**:
1. Tạo class trường hợp đặc biệt với interface như mong đợi
2. Thêm kiểm tra isSpecialCase
3. Giới thiệu factory method
4. Thay các kiểm tra null bằng việc dùng đối tượng trường hợp đặc biệt
5. Test

**Trước**:
```javascript
const customer = site.customer;
// ... nhiều nơi kiểm tra
if (customer === "unknown") {
  customerName = "occupant";
} else {
  customerName = customer.name;
}
```

**Sau**:
```javascript
class UnknownCustomer {
  get name() { return "occupant"; }
  get billingPlan() { return registry.defaultPlan; }
}

// Factory method
function customer(site) {
  return site.customer === "unknown"
    ? new UnknownCustomer()
    : site.customer;
}

// Cách dùng - không cần kiểm tra null
const customerName = customer.name;
```

---

## Refactoring API

### Tách Truy Vấn Khỏi Thao Tác Sửa Đổi (Separate Query from Modifier)

**Khi nào sử dụng**: Hàm vừa trả về giá trị vừa có side effect

**Động cơ**: Làm rõ thao tác nào có side effect.

**Cơ chế**:
1. Tạo một hàm truy vấn mới
2. Sao chép logic trả về của hàm gốc
3. Sửa hàm gốc để trả về void
4. Thay các lời gọi có dùng giá trị trả về
5. Test

**Trước**:
```javascript
function alertForMiscreant(people) {
  for (const p of people) {
    if (p === "Don") {
      setOffAlarms();
      return "Don";
    }
    if (p === "John") {
      setOffAlarms();
      return "John";
    }
  }
  return "";
}
```

**Sau**:
```javascript
function findMiscreant(people) {
  for (const p of people) {
    if (p === "Don") return "Don";
    if (p === "John") return "John";
  }
  return "";
}

function alertForMiscreant(people) {
  if (findMiscreant(people) !== "") setOffAlarms();
}
```

---

### Tham Số Hóa Hàm (Parameterize Function)

**Khi nào sử dụng**: Nhiều hàm làm việc tương tự nhau với các giá trị khác nhau

**Động cơ**: Loại bỏ trùng lặp bằng cách thêm một tham số.

**Cơ chế**:
1. Chọn một hàm
2. Thêm tham số cho giá trị literal thay đổi
3. Sửa thân hàm để dùng tham số
4. Test
5. Sửa các nơi gọi để dùng phiên bản đã tham số hóa
6. Xóa các hàm không còn được dùng

**Trước**:
```javascript
function tenPercentRaise(person) {
  person.salary = person.salary * 1.10;
}

function fivePercentRaise(person) {
  person.salary = person.salary * 1.05;
}
```

**Sau**:
```javascript
function raise(person, factor) {
  person.salary = person.salary * (1 + factor);
}

// Cách dùng
raise(person, 0.10);
raise(person, 0.05);
```

---

### Loại Bỏ Đối Số Cờ (Remove Flag Argument)

**Khi nào sử dụng**: Tham số boolean làm thay đổi hành vi của hàm

**Động cơ**: Làm hành vi trở nên tường minh thông qua các hàm riêng biệt.

**Cơ chế**:
1. Tạo hàm tường minh cho từng giá trị của cờ
2. Thay mỗi lời gọi bằng hàm mới phù hợp
3. Test sau mỗi thay đổi
4. Xóa hàm gốc

**Trước**:
```javascript
function bookConcert(customer, isPremium) {
  if (isPremium) {
    // logic đặt vé premium
  } else {
    // logic đặt vé thường
  }
}

bookConcert(customer, true);
bookConcert(customer, false);
```

**Sau**:
```javascript
function bookPremiumConcert(customer) {
  // logic đặt vé premium
}

function bookRegularConcert(customer) {
  // logic đặt vé thường
}

bookPremiumConcert(customer);
bookRegularConcert(customer);
```

---

## Xử Lý Kế Thừa

### Kéo Hàm Lên (Pull Up Method)

**Khi nào sử dụng**: Cùng một hàm xuất hiện ở nhiều subclass

**Động cơ**: Loại bỏ trùng lặp trong hệ thống phân cấp class.

**Cơ chế**:
1. Kiểm tra các hàm để đảm bảo chúng giống hệt nhau
2. Kiểm tra chữ ký (signature) giống nhau
3. Tạo hàm mới ở superclass
4. Sao chép thân hàm từ một subclass
5. Xóa hàm ở một subclass, test
6. Xóa hàm ở các subclass còn lại, test sau mỗi lần

---

### Đẩy Hàm Xuống (Push Down Method)

**Khi nào sử dụng**: Hành vi chỉ liên quan đến một nhóm subclass

**Động cơ**: Đặt hàm ở nơi nó được sử dụng.

**Cơ chế**:
1. Sao chép hàm sang từng subclass cần nó
2. Xóa hàm khỏi superclass
3. Test
4. Xóa hàm khỏi các subclass không cần nó
5. Test

---

### Thay Subclass Bằng Delegate (Replace Subclass with Delegate)

**Khi nào sử dụng**: Kế thừa đang bị dùng sai, cần linh hoạt hơn

**Động cơ**: Ưu tiên composition hơn kế thừa khi phù hợp.

**Cơ chế**:
1. Tạo class rỗng cho delegate
2. Thêm field vào class chủ (host) để giữ delegate
3. Tạo constructor cho delegate, được gọi từ class chủ
4. Di chuyển các tính năng sang delegate
5. Test sau mỗi lần di chuyển
6. Thay kế thừa bằng ủy quyền (delegation)

---

## Tách Class (Extract Class)

**Khi nào sử dụng**: Class lớn với nhiều trách nhiệm

**Động cơ**: Tách class để duy trì nguyên tắc đơn trách nhiệm (single responsibility).

**Cơ chế**:
1. Quyết định cách phân chia trách nhiệm
2. Tạo class mới
3. Di chuyển field từ class gốc sang class mới
4. Test
5. Di chuyển các hàm từ class gốc sang class mới
6. Test sau mỗi lần di chuyển
7. Review và đổi tên cả hai class
8. Quyết định cách để lộ (expose) class mới

**Trước**:
```javascript
class Person {
  get name() { return this._name; }
  set name(arg) { this._name = arg; }
  get officeAreaCode() { return this._officeAreaCode; }
  set officeAreaCode(arg) { this._officeAreaCode = arg; }
  get officeNumber() { return this._officeNumber; }
  set officeNumber(arg) { this._officeNumber = arg; }

  get telephoneNumber() {
    return `(${this._officeAreaCode}) ${this._officeNumber}`;
  }
}
```

**Sau**:
```javascript
class Person {
  constructor() {
    this._telephoneNumber = new TelephoneNumber();
  }
  get name() { return this._name; }
  set name(arg) { this._name = arg; }
  get telephoneNumber() { return this._telephoneNumber.toString(); }
  get officeAreaCode() { return this._telephoneNumber.areaCode; }
  set officeAreaCode(arg) { this._telephoneNumber.areaCode = arg; }
}

class TelephoneNumber {
  get areaCode() { return this._areaCode; }
  set areaCode(arg) { this._areaCode = arg; }
  get number() { return this._number; }
  set number(arg) { this._number = arg; }
  toString() { return `(${this._areaCode}) ${this._number}`; }
}
```

---

## Tham Khảo Nhanh: Từ Smell Đến Refactoring

| Code Smell | Refactoring Chính | Phương Án Thay Thế |
|------------|-------------------|-------------|
| Long Method | Tách Hàm (Extract Method) | Thay Biến Tạm Bằng Truy Vấn (Replace Temp with Query) |
| Duplicate Code | Tách Hàm (Extract Method) | Kéo Hàm Lên (Pull Up Method) |
| Large Class | Tách Class (Extract Class) | Tách Subclass (Extract Subclass) |
| Long Parameter List | Giới Thiệu Đối Tượng Tham Số (Introduce Parameter Object) | Giữ Nguyên Toàn Bộ Đối Tượng (Preserve Whole Object) |
| Feature Envy | Di Chuyển Hàm (Move Method) | Tách Hàm + Di Chuyển (Extract Method + Move) |
| Data Clumps | Tách Class (Extract Class) | Giới Thiệu Đối Tượng Tham Số (Introduce Parameter Object) |
| Primitive Obsession | Thay Kiểu Nguyên Thủy Bằng Đối Tượng (Replace Primitive with Object) | Thay Mã Kiểu (Replace Type Code) |
| Switch Statements | Thay Điều Kiện Bằng Đa Hình (Replace Conditional with Polymorphism) | Thay Mã Kiểu (Replace Type Code) |
| Temporary Field | Tách Class (Extract Class) | Giới Thiệu Null Object (Introduce Null Object) |
| Message Chains | Ẩn Delegate (Hide Delegate) | Tách Hàm (Extract Method) |
| Middle Man | Loại Bỏ Trung Gian (Remove Middle Man) | Gộp Hàm Nội Tuyến (Inline Method) |
| Divergent Change | Tách Class (Extract Class) | Tách Giai Đoạn (Split Phase) |
| Shotgun Surgery | Di Chuyển Hàm (Move Method) | Gộp Class Nội Tuyến (Inline Class) |
| Dead Code | Loại Bỏ Code Chết (Remove Dead Code) | - |
| Speculative Generality | Thu Gọn Phân Cấp (Collapse Hierarchy) | Gộp Class Nội Tuyến (Inline Class) |

---

## Đọc Thêm

- Fowler, M. (2018). *Refactoring: Improving the Design of Existing Code* (ấn bản 2)
- Catalog trực tuyến: https://refactoring.com/catalog/

---

**Cập Nhật Lần Cuối**: Ngày 4 tháng 8 năm 2026
**Phiên Bản Claude Code**: 2.1.220
**Nguồn**:
- https://code.claude.com/docs/en/skills
**Các Mô Hình Tương Thích**: Claude Fable 5, Claude Opus 5, Claude Sonnet 5, Claude Sonnet 4.6, Claude Opus 4.8, Claude Haiku 4.5
