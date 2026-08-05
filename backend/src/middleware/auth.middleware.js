const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'esaku_pesantren_secret_key_2026';

// Middleware to verify JWT token
exports.requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Autentikasi diperlukan. Sesi tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains id, username, role, name
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Sesi kedaluwarsa atau token tidak valid. Silakan login kembali.' });
  }
};

// Middleware to restrict access to Administrator only
exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'Administrator') {
    return res.status(403).json({ success: false, message: 'Akses ditolak. Fitur ini hanya untuk Administrator.' });
  }
  next();
};
