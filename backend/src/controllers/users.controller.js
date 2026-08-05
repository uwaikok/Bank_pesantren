const bcrypt = require('bcryptjs');
const db = require('../config/db');

// GET /api/users — list all users
exports.getAllUsers = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, username, role, status, created_at FROM users ORDER BY created_at ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat daftar pengguna.' });
  }
};

// POST /api/users — create new user
exports.createUser = async (req, res) => {
  try {
    const { name, username, password, role } = req.body;

    if (!name || !username || !password || !role) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter.' });
    }

    // Check for duplicate username
    const { rows: existing } = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: `Username "${username}" sudah digunakan. Pilih username lain.` });
    }

    const allowedRoles = ['Administrator', 'Pengurus Koperasi', 'Kasir'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Role tidak valid.' });
    }

    // Hash the password securely with bcrypt (salt rounds = 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    await db.query(
      'INSERT INTO users (name, username, password_hash, role, status) VALUES (?, ?, ?, ?, "aktif")',
      [name, username, hashedPassword, role]
    );

    res.status(201).json({ success: true, message: `Akun ${name} berhasil dibuat dan langsung dapat digunakan untuk login.` });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat akun pengurus.' });
  }
};

// PUT /api/users/:id — update user name/role
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    if (!name || !role) {
      return res.status(400).json({ success: false, message: 'Nama dan role wajib diisi.' });
    }

    const { rows } = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    await db.query('UPDATE users SET name = ?, role = ?, updated_at = NOW() WHERE id = ?', [name, role, id]);

    res.json({ success: true, message: 'Data pengurus berhasil diperbarui.' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui akun pengurus.' });
  }
};

// PUT /api/users/:id/status — toggle aktif/nonaktif
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['aktif', 'nonaktif'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid. Gunakan "aktif" atau "nonaktif".' });
    }

    const { rows } = await db.query('SELECT id, username FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    await db.query('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);

    res.json({ success: true, message: `Status akun berhasil diubah menjadi ${status}.` });
  } catch (err) {
    console.error('Error updating user status:', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah status akun.' });
  }
};

// GET /api/users/:id/check-transactions — check if user has any transaction history as operator
exports.checkUserTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: user } = await db.query('SELECT username, name FROM users WHERE id = ?', [id]);
    if (user.length === 0) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });

    // Check transaksi table for operator matching username or name
    const { rows: txCheck } = await db.query(
      'SELECT COUNT(*) AS cnt FROM transaksi WHERE operator LIKE ?',
      [`%${user[0].name}%`]
    );
    const hasTransactions = txCheck[0].cnt > 0;

    res.json({ success: true, data: { hasTransactions, count: txCheck[0].cnt } });
  } catch (err) {
    console.error('Error checking user transactions:', err);
    res.status(500).json({ success: false, message: 'Gagal memeriksa riwayat transaksi.' });
  }
};

// DELETE /api/users/:id — permanently delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await db.query('SELECT id, username FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'Akun pengurus berhasil dihapus.' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus akun pengurus.' });
  }
};

// POST /api/users/change-password — change own password (called by auth/change-password too)
exports.changePassword = async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter.' });
    }

    const { rows } = await db.query('SELECT id, password_hash FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Password lama tidak sesuai.' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [newHash, rows[0].id]);

    res.json({ success: true, message: 'Password berhasil diperbarui.' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui password.' });
  }
};
