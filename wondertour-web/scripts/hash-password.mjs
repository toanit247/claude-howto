// Tạo chuỗi ADMIN_PASSWORD_HASH cho tài khoản quản trị web.
// Dùng: node scripts/hash-password.mjs   (hỏi mật khẩu, không hiện trên màn hình)
import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
process.stdout.write("Mật khẩu quản trị (ít nhất 12 ký tự): ");
// Che chữ gõ vào.
rl._writeToOutput = () => {};
rl.question("", (password) => {
  rl.close();
  process.stdout.write("\n");
  if (password.length < 12) {
    console.error("Mật khẩu phải dài ít nhất 12 ký tự.");
    process.exit(1);
  }
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  console.log(`\nĐặt vào biến môi trường của máy chủ web:\nADMIN_PASSWORD_HASH=scrypt$${salt}$${hash}`);
});
