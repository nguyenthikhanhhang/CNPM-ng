const router = require('express').Router();
const db = require('../db');
const { hashPassword, verifyPassword, signToken } = require('../utils/security');
const { requireAuth } = require('../middleware/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(0|\+84)\d{9}$/;

const publicUser = (u) => ({ id: u.id, fullName: u.full_name, email: u.email, phone: u.phone, role: u.role });

// ĐĂNG KÝ: tên, số điện thoại, email, mật khẩu
router.post('/register', async (req, res) => {
  try {
    const fullName = String(req.body.fullName || '').trim();
    const phone = String(req.body.phone || '').replace(/\s/g, '');
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const errors = {};
    if (fullName.length < 2) errors.fullName = 'Vui lòng nhập họ tên (tối thiểu 2 ký tự).';
    if (!PHONE_RE.test(phone)) errors.phone = 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0).';
    if (!EMAIL_RE.test(email)) errors.email = 'Email không hợp lệ.';
    if (password.length < 6) errors.password = 'Mật khẩu tối thiểu 6 ký tự.';
    if (Object.keys(errors).length) return res.status(400).json({ message: 'Dữ liệu không hợp lệ.', errors });

    const [dup] = await db.query('SELECT email, phone FROM users WHERE email = ? OR phone = ?', [email, phone]);
    if (dup.length) {
      const msg = dup.some((d) => d.email === email) ? 'Email đã được sử dụng.' : 'Số điện thoại đã được sử dụng.';
      return res.status(409).json({ message: msg });
    }

    const [result] = await db.query(
      'INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [fullName, email, phone, hashPassword(password), 'customer']
    );
    const user = { id: result.insertId, full_name: fullName, email, phone, role: 'customer' };
    res.status(201).json({ message: 'Đăng ký thành công! Vui lòng đăng nhập.', user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ hoặc không kết nối được cơ sở dữ liệu.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length || !verifyPassword(password, rows[0].password_hash)) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng!' });
    }
    const u = rows[0];
    res.json({ token: signToken({ id: u.id, role: u.role }), user: publicUser(u) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ hoặc không kết nối được cơ sở dữ liệu.' });
  }
});

router.get('/me', requireAuth(), async (req, res) => {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!rows.length) return res.status(401).json({ message: 'Tài khoản không tồn tại.' });
  res.json(publicUser(rows[0]));
});

module.exports = router;
