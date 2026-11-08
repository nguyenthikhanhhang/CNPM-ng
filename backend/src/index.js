require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:4200' }));
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try { await db.query('SELECT 1'); res.json({ ok: true, database: 'connected' }); }
  catch (e) { res.status(500).json({ ok: false, database: 'error', detail: e.code || e.message }); }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));

// Bắt lỗi async không xử lý để server không treo request
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ message: 'Lỗi máy chủ.' }); });

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`ODYSSEY API chạy tại http://localhost:${port}`);
  try { await db.query('SELECT 1'); console.log('✔ Đã kết nối MariaDB/MySQL'); }
  catch (e) { console.error('✘ KHÔNG kết nối được database:', e.code, '-', e.message); }
});
