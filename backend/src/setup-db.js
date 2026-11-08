// Chạy một lần: npm run setup-db  -> tạo bảng, nạp sản phẩm mẫu, tạo admin đầu tiên
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { hashPassword } = require('./utils/security');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    charset: 'utf8mb4'
  });
  const dir = path.join(__dirname, '../../database');
  await conn.query(fs.readFileSync(path.join(dir, 'schema.sql'), 'utf8'));
  await conn.query('USE ' + (process.env.DB_NAME || 'odyssey_db'));

  const [[cnt]] = await conn.query('SELECT COUNT(*) AS n FROM products');
  if (!cnt.n) await conn.query(fs.readFileSync(path.join(dir, 'seed_products.sql'), 'utf8'));

  const email = (process.env.ADMIN_EMAIL || 'admin@odyssey.vn').toLowerCase();
  const [ex] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
  if (!ex.length) {
    await conn.query('INSERT INTO users (full_name,email,phone,password_hash,role) VALUES (?,?,?,?,?)',
      ['Quản trị viên', email, '0900000000', hashPassword(process.env.ADMIN_PASSWORD || 'Admin@123'), 'admin']);
    console.log('Đã tạo admin:', email);
  }
  console.log('✔ Hoàn tất khởi tạo database.');
  await conn.end();
})().catch((e) => { console.error('✘ Lỗi:', e.code, e.message); process.exit(1); });
