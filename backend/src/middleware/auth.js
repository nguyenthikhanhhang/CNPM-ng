const { verifyToken } = require('../utils/security');

// Yêu cầu đăng nhập, có thể giới hạn theo vai trò: requireAuth('staff','admin')
function requireAuth(...roles) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const payload = verifyToken(header.replace('Bearer ', ''));
    if (!payload) return res.status(401).json({ message: 'Chưa đăng nhập hoặc phiên đã hết hạn.' });
    if (roles.length && !roles.includes(payload.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này.' });
    }
    req.user = payload;
    next();
  };
}
module.exports = { requireAuth };
