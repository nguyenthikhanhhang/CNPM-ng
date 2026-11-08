const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const SHIPPING_FEE = 30000;
const STATUSES = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];

async function attachItems(orders) {
  if (!orders.length) return orders;
  const [items] = await db.query('SELECT * FROM order_items WHERE order_id IN (?)', [orders.map((o) => o.id)]);
  return orders.map((o) => ({
    id: o.id, customerName: o.customer_name, phone: o.phone, address: o.address,
    paymentMethod: o.payment_method, status: o.status, subtotal: o.subtotal,
    shippingFee: o.shipping_fee, total: o.total, createdAt: o.created_at,
    items: items.filter((i) => i.order_id === o.id).map((i) => ({
      productId: i.product_id, name: i.product_name, price: i.unit_price, quantity: i.quantity
    }))
  }));
}

// KHÁCH THANH TOÁN: server tự tính giá từ DB, không tin giá do trình duyệt gửi
router.post('/', requireAuth('customer', 'staff', 'admin'), async (req, res) => {
  const { name, phone, address, paymentMethod, items } = req.body;
  if (!String(name || '').trim() || !/^(0|\+84)\d{9}$/.test(String(phone || '')) || !String(address || '').trim()) {
    return res.status(400).json({ message: 'Vui lòng nhập đủ họ tên, số điện thoại hợp lệ và địa chỉ.' });
  }
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'Giỏ hàng trống.' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    let subtotal = 0;
    const lines = [];
    for (const it of items) {
      const qty = Number(it.quantity);
      if (!Number.isInteger(qty) || qty < 1) throw Object.assign(new Error('Số lượng không hợp lệ.'), { status: 400 });
      const [rows] = await conn.query('SELECT * FROM products WHERE id = ? AND is_active = 1 FOR UPDATE', [it.productId]);
      if (!rows.length) throw Object.assign(new Error('Có sản phẩm không còn bán.'), { status: 400 });
      const p = rows[0];
      if (p.stock < qty) throw Object.assign(new Error(`"${p.name}" chỉ còn ${p.stock} sản phẩm.`), { status: 409 });
      subtotal += p.price * qty;
      lines.push({ p, qty });
    }
    const total = subtotal + SHIPPING_FEE;
    const method = paymentMethod === 'BANK' ? 'BANK' : 'COD';
    const [o] = await conn.query(
      'INSERT INTO orders (user_id, customer_name, phone, address, payment_method, subtotal, shipping_fee, total) VALUES (?,?,?,?,?,?,?,?)',
      [req.user.id, String(name).trim(), phone, String(address).trim(), method, subtotal, SHIPPING_FEE, total]
    );
    for (const { p, qty } of lines) {
      await conn.query('INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES (?,?,?,?,?)', [o.insertId, p.id, p.name, p.price, qty]);
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [qty, p.id]);
    }
    await conn.commit();
    res.status(201).json({ id: o.insertId, subtotal, shippingFee: SHIPPING_FEE, total, paymentMethod: method });
  } catch (err) {
    await conn.rollback();
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error(err);
    res.status(500).json({ message: 'Không thể tạo đơn hàng.' });
  } finally { conn.release(); }
});

router.get('/mine', requireAuth(), async (req, res) => {
  const [rows] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [req.user.id]);
  res.json(await attachItems(rows));
});

router.get('/', requireAuth('staff', 'admin'), async (req, res) => {
  const [rows] = await db.query('SELECT * FROM orders ORDER BY id DESC LIMIT 200');
  res.json(await attachItems(rows));
});

router.patch('/:id/status', requireAuth('staff', 'admin'), async (req, res) => {
  if (!STATUSES.includes(req.body.status)) return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
  await db.query('UPDATE orders SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
  res.json({ message: 'Đã cập nhật trạng thái.' });
});

module.exports = router;
