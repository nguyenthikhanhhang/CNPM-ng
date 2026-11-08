const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { hashPassword } = require('../utils/security');

// Chỉ tính các đơn không bị hủy
const VALID = "o.status <> 'cancelled'";

// ADMIN XEM BÁO CÁO
router.get('/report', requireAuth('admin'), async (req, res) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
    const [[t]] = await db.query(`SELECT COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue FROM orders o WHERE ${VALID}`);
    const [[c]] = await db.query("SELECT COUNT(*) AS n FROM users WHERE role='customer'");
    const [[s]] = await db.query("SELECT COUNT(*) AS n FROM users WHERE role='staff'");
    const [[p]] = await db.query('SELECT COUNT(*) AS n FROM products WHERE is_active = 1');
    const [daily] = await db.query(
      `SELECT DATE_FORMAT(o.created_at,'%Y-%m-%d') AS day, COUNT(*) AS orders, SUM(o.total) AS revenue
       FROM orders o WHERE ${VALID} AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY day ORDER BY day`, [days]);
    const [top] = await db.query(
      `SELECT i.product_name AS name, SUM(i.quantity) AS sold, SUM(i.quantity*i.unit_price) AS revenue
       FROM order_items i JOIN orders o ON o.id = i.order_id WHERE ${VALID}
       GROUP BY i.product_id, i.product_name ORDER BY sold DESC LIMIT 5`);
    const [byCat] = await db.query(
      `SELECT p.category, SUM(i.quantity*i.unit_price) AS revenue
       FROM order_items i JOIN orders o ON o.id=i.order_id JOIN products p ON p.id=i.product_id WHERE ${VALID}
       GROUP BY p.category ORDER BY revenue DESC`);
    const [byStatus] = await db.query('SELECT status, COUNT(*) AS n FROM orders GROUP BY status');
    const [low] = await db.query('SELECT id, name, stock FROM products WHERE is_active=1 AND stock <= 5 ORDER BY stock LIMIT 10');
    res.json({
      totals: { revenue: Number(t.revenue), orders: t.orders, customers: c.n, staff: s.n, products: p.n },
      daily: daily.map((d) => ({ ...d, revenue: Number(d.revenue) })),
      topProducts: top.map((x) => ({ ...x, sold: Number(x.sold), revenue: Number(x.revenue) })),
      byCategory: byCat.map((x) => ({ ...x, revenue: Number(x.revenue) })),
      byStatus, lowStock: low
    });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Không tạo được báo cáo.' }); }
});

router.get('/staff', requireAuth('admin'), async (req, res) => {
  const [rows] = await db.query("SELECT id, full_name, email, phone, created_at FROM users WHERE role='staff' ORDER BY id DESC");
  res.json(rows.map((r) => ({ id: r.id, fullName: r.full_name, email: r.email, phone: r.phone, createdAt: r.created_at })));
});

// Admin cấp tài khoản nhân viên
router.post('/staff', requireAuth('admin'), async (req, res) => {
  const fullName = String(req.body.fullName || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = String(req.body.phone || '').replace(/\s/g, '');
  const password = String(req.body.password || '');
  if (fullName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^(0|\+84)\d{9}$/.test(phone) || password.length < 6) {
    return res.status(400).json({ message: 'Thông tin nhân viên chưa hợp lệ.' });
  }
  const [dup] = await db.query('SELECT id FROM users WHERE email = ? OR phone = ?', [email, phone]);
  if (dup.length) return res.status(409).json({ message: 'Email hoặc số điện thoại đã tồn tại.' });
  await db.query('INSERT INTO users (full_name,email,phone,password_hash,role) VALUES (?,?,?,?,?)', [fullName, email, phone, hashPassword(password), 'staff']);
  res.status(201).json({ message: 'Đã tạo tài khoản nhân viên.' });
});

module.exports = router;
