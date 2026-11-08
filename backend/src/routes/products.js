const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const map = (p) => ({ id: p.id, name: p.name, category: p.category, price: p.price, stock: p.stock, image: p.image_url, isActive: !!p.is_active });

function validate(b) {
  const name = String(b.name || '').trim();
  const category = String(b.category || '').trim();
  const price = Number(b.price);
  const stock = Number(b.stock);
  if (!name || !category) return { error: 'Tên và danh mục là bắt buộc.' };
  if (!Number.isInteger(price) || price < 0) return { error: 'Giá phải là số nguyên không âm.' };
  if (!Number.isInteger(stock) || stock < 0) return { error: 'Tồn kho phải là số nguyên không âm.' };
  return { value: { name, category, price, stock, image: String(b.image || '').trim() || null } };
}

// Khách xem sản phẩm đang bán; nhân viên xem tất cả (?all=1)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE is_active = 1 ORDER BY id DESC');
    res.json(rows.map(map));
  } catch (e) { console.error(e); res.status(500).json({ message: 'Không đọc được dữ liệu sản phẩm.' }); }
});

router.get('/manage', requireAuth('staff', 'admin'), async (req, res) => {
  const [rows] = await db.query('SELECT * FROM products ORDER BY id DESC');
  res.json(rows.map(map));
});

// NHÂN VIÊN THÊM SẢN PHẨM
router.post('/', requireAuth('staff', 'admin'), async (req, res) => {
  const { error, value } = validate(req.body);
  if (error) return res.status(400).json({ message: error });
  const [r] = await db.query(
    'INSERT INTO products (name, category, price, stock, image_url, created_by) VALUES (?,?,?,?,?,?)',
    [value.name, value.category, value.price, value.stock, value.image, req.user.id]
  );
  res.status(201).json({ id: r.insertId, ...value });
});

router.put('/:id', requireAuth('staff', 'admin'), async (req, res) => {
  const { error, value } = validate(req.body);
  if (error) return res.status(400).json({ message: error });
  const isActive = req.body.isActive === false ? 0 : 1;
  const [r] = await db.query(
    'UPDATE products SET name=?, category=?, price=?, stock=?, image_url=?, is_active=? WHERE id=?',
    [value.name, value.category, value.price, value.stock, value.image, isActive, req.params.id]
  );
  if (!r.affectedRows) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
  res.json({ message: 'Đã cập nhật.' });
});

// Ẩn sản phẩm (xóa mềm để không làm hỏng lịch sử đơn hàng)
router.delete('/:id', requireAuth('staff', 'admin'), async (req, res) => {
  await db.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
  res.json({ message: 'Đã ẩn sản phẩm.' });
});

module.exports = router;
