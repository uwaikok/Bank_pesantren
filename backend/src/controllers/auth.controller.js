const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'esaku_pesantren_secret';

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });
    }

    // --- Check against the users table first ---
    let user = null;
    try {
      const { rows } = await db.query(
        'SELECT id, name, username, password_hash, role, status FROM users WHERE username = ?',
        [username]
      );
      if (rows.length > 0) user = rows[0];
    } catch (dbErr) {
      // If users table doesn't exist yet (first run before migration), fall through to env fallback
      console.warn('[Auth] users table not ready, falling back to env credentials:', dbErr.message);
    }

    if (user) {
      // Check account status first
      if (user.status === 'nonaktif') {
        return res.status(403).json({
          success: false,
          message: 'Akun Anda telah dinonaktifkan. Silakan hubungi Administrator untuk mengaktifkan kembali akun Anda.'
        });
      }

      // Verify password against bcrypt hash
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Username atau password salah.' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.json({
        success: true,
        message: 'Login berhasil.',
        data: { token, username: user.username, name: user.name, role: user.role, expiresIn: '8h' }
      });
    }

    // --- Fallback: check env-based admin credentials (for initial setup) ---
    const envUsername = process.env.ADMIN_USERNAME || 'admin';
    const envPassword = process.env.ADMIN_PASSWORD || 'pesantren2026';

    if (username === envUsername && password === envPassword) {
      const token = jwt.sign(
        { username, role: 'Administrator', name: 'Administrator Utama' },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.json({
        success: true,
        message: 'Login berhasil (akun default env).',
        data: { token, username, name: 'Administrator Utama', role: 'Administrator', expiresIn: '8h' }
      });
    }

    return res.status(401).json({ success: false, message: 'Username atau password salah.' });

  } catch (error) {
    console.error('Error login:', error);
    res.status(500).json({ success: false, message: 'Server error saat login.' });
  }
};

// GET /api/auth/verify — verifikasi token
exports.verify = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      success: true,
      data: {
        username: decoded.username,
        role: decoded.role,
        name: decoded.name || decoded.username
      }
    });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token tidak valid atau sudah expired.' });
  }
};

// POST /api/auth/change-password — ubah password sendiri (user yang sedang login)
exports.changePassword = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Tidak terautentikasi.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter.' });
    }

    const { rows } = await db.query(
      'SELECT id, password_hash FROM users WHERE username = ?',
      [decoded.username]
    );

    if (rows.length === 0) {
      // For env-based admin account that hasn't been migrated yet
      return res.status(404).json({ success: false, message: 'Akun tidak ditemukan di database. Buat akun Anda via "Tambah Akun Baru" terlebih dahulu.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Password lama tidak sesuai.' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [newHash, rows[0].id]);

    res.json({ success: true, message: 'Password berhasil diperbarui.' });
  } catch (err) {
    console.error('Error change-password:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui password.' });
  }
};
