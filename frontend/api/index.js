import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { Pool } = pg;

// ─── Database Connection (PostgreSQL / Neon) ───────────────────────────────
let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl.includes('channel_binding')) {
  dbUrl = dbUrl.replace(/[?&]channel_binding=[^&]*/g, '');
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 10000,
});

const db = {
  query: async (text, params) => {
    let i = 0;
    const pgText = text.replace(/\?/g, () => `$${++i}`);
    const result = await pool.query(pgText, params);
    return { rows: result.rows };
  },
  getConnection: async () => {
    const client = await pool.connect();
    return {
      execute: async (text, params) => {
        let i = 0;
        const pgText = text.replace(/\?/g, () => `$${++i}`);
        const result = await client.query(pgText, params);
        return [result.rows, null];
      },
      query: async (text, params) => {
        let i = 0;
        const pgText = text.replace(/\?/g, () => `$${++i}`);
        const result = await client.query(pgText, params);
        return { rows: result.rows };
      },
      beginTransaction: () => client.query('BEGIN'),
      commit: () => client.query('COMMIT'),
      rollback: () => client.query('ROLLBACK'),
      release: () => client.release(),
    };
  },
};

// ─── Auto-migrate ──────────────────────────────────────────────────────────
let migrated = false;
async function autoMigrate() {
  if (migrated) return;
  let client;
  try {
    client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS santri (
        id SERIAL PRIMARY KEY,
        nis VARCHAR(20) UNIQUE NOT NULL,
        nama VARCHAR(100) NOT NULL,
        kelas VARCHAR(50) NOT NULL,
        saldo DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (saldo >= 0),
        status VARCHAR(20) NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
        deleted_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS kartu (
        id SERIAL PRIMARY KEY,
        card_uid VARCHAR(50) UNIQUE NOT NULL,
        tipe_kartu VARCHAR(20) NOT NULL CHECK (tipe_kartu IN ('RFID', 'NFC', 'MagneticStripe')),
        santri_id INT NULL REFERENCES santri(id) ON DELETE SET NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'hilang', 'nonaktif')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS transaksi (
        id SERIAL PRIMARY KEY,
        kartu_id INT NULL REFERENCES kartu(id) ON DELETE SET NULL,
        santri_id INT NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
        tipe_transaksi VARCHAR(20) NOT NULL CHECK (tipe_transaksi IN ('topup', 'penarikan', 'pembayaran')),
        jumlah DECIMAL(12, 2) NOT NULL CHECK (jumlah > 0),
        saldo_sebelum DECIMAL(12, 2) NOT NULL,
        saldo_sesudah DECIMAL(12, 2) NOT NULL,
        keterangan TEXT NULL,
        operator VARCHAR(50) NOT NULL DEFAULT 'Admin',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(30) NOT NULL DEFAULT 'Kasir',
        status VARCHAR(20) NOT NULL DEFAULT 'aktif',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_santri_nis ON santri(nis)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_kartu_uid ON kartu(card_uid)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_transaksi_santri_id ON transaksi(santri_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_transaksi_created_at ON transaksi(created_at)`);

    const { rows: existingUsers } = await client.query('SELECT COUNT(*) AS cnt FROM users');
    if (parseInt(existingUsers[0].cnt) === 0) {
      const defaultHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'pesantren2026', 12);
      await client.query(
        'INSERT INTO users (name, username, password_hash, role, status) VALUES ($1, $2, $3, $4, $5)',
        ['Administrator Utama', process.env.ADMIN_USERNAME || 'admin', defaultHash, 'Administrator', 'aktif']
      );
    }

    const { rows: existingSantri } = await client.query('SELECT COUNT(*) AS cnt FROM santri');
    if (parseInt(existingSantri[0].cnt) === 0) {
      await client.query(`
        INSERT INTO santri (nis, nama, kelas, saldo, status) VALUES
        ('SNT001', 'Ahmad Fauzi', '10-A / Tahfidz', 150000.00, 'aktif'),
        ('SNT002', 'Muhammad Rizky', '11-B / Kitab', 75000.00, 'aktif'),
        ('SNT003', 'Siti Aminah', '10-C / Banat', 250000.00, 'aktif')
      `);
      await client.query(`
        INSERT INTO kartu (card_uid, tipe_kartu, santri_id, status) VALUES
        ('1234567890', 'RFID', 1, 'aktif'),
        ('0987654321', 'NFC', 2, 'aktif'),
        ('1122334455', 'MagneticStripe', 3, 'aktif')
      `);
      await client.query(`
        INSERT INTO transaksi (kartu_id, santri_id, tipe_transaksi, jumlah, saldo_sebelum, saldo_sesudah, keterangan, operator) VALUES
        (1, 1, 'topup', 150000.00, 0.00, 150000.00, 'Setoran awal saldo santri', 'Admin Utama'),
        (2, 2, 'topup', 100000.00, 0.00, 100000.00, 'Setoran awal saldo santri', 'Admin Utama'),
        (2, 2, 'pembayaran', 25000.00, 100000.00, 75000.00, 'Pembelian kitab kuning di koperasi', 'Kasir Koperasi'),
        (3, 3, 'topup', 250000.00, 0.00, 250000.00, 'Top up bulanan wali santri', 'Admin Utama')
      `);
    }
    migrated = true;
  } catch (err) {
    console.error('❌ Auto-migration error:', err.message);
  } finally {
    if (client) client.release();
  }
}

// ─── Express App Setup ──────────────────────────────────────────────────────
const app = express();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'esaku_pesantren_secret_key_2026';

app.use(cors({ origin: '*' }));
app.use(express.json());

// Auto migrate trigger on request
app.use(async (req, res, next) => {
  if (!migrated && process.env.DATABASE_URL) {
    await autoMigrate();
  }
  next();
});

// ─── Auth Middleware ────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
  }
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Sesi kedaluwarsa atau token tidak valid.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'Administrator') {
    return res.status(403).json({ success: false, message: 'Akses ditolak. Fitur ini hanya untuk Administrator.' });
  }
  next();
};

// ─── HEALTH CHECK ──────────────────────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'healthy', database: 'connected', time: result.rows[0].now });
  } catch (e) {
    res.status(500).json({ status: 'unhealthy', error: e.message });
  }
});

// ─── AUTH ROUTES ───────────────────────────────────────────────────────────
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });
    }

    try {
      const { rows } = await db.query(
        'SELECT id, name, username, password_hash, role, status FROM users WHERE username = $1',
        [username]
      );

      if (rows.length > 0) {
        const user = rows[0];
        if (user.status === 'nonaktif') {
          return res.status(403).json({ success: false, message: 'Akun Anda telah dinonaktifkan.' });
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
          return res.status(401).json({ success: false, message: 'Username atau password salah.' });
        }
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role, name: user.name },
          JWT_SECRET, { expiresIn: '8h' }
        );
        return res.json({ success: true, message: 'Login berhasil.', data: { token, username: user.username, name: user.name, role: user.role, expiresIn: '8h' } });
      }
    } catch (dbErr) {
      console.error('DB Login Query Error:', dbErr.message);
    }

    // Fallback env credentials
    const envUsername = process.env.ADMIN_USERNAME || 'admin';
    const envPassword = process.env.ADMIN_PASSWORD || 'pesantren2026';
    if (username === envUsername && password === envPassword) {
      const token = jwt.sign({ username, role: 'Administrator', name: 'Administrator Utama' }, JWT_SECRET, { expiresIn: '8h' });
      return res.json({ success: true, message: 'Login berhasil.', data: { token, username, name: 'Administrator Utama', role: 'Administrator', expiresIn: '8h' } });
    }

    return res.status(401).json({ success: false, message: 'Username atau password salah.' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error saat login: ' + err.message });
  }
});

router.get('/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan.' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    res.json({ success: true, data: { username: decoded.username, role: decoded.role, name: decoded.name || decoded.username } });
  } catch {
    res.status(401).json({ success: false, message: 'Token tidak valid atau sudah expired.' });
  }
});

router.post('/auth/change-password', requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter.' });
    }
    const { rows } = await db.query('SELECT id, password_hash FROM users WHERE username = $1', [req.user.username]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' });
    const isMatch = await bcrypt.compare(oldPassword, rows[0].password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Password lama tidak sesuai.' });
    const newHash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, rows[0].id]);
    res.json({ success: true, message: 'Password berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui password.' });
  }
});

// ─── SANTRI ROUTES ─────────────────────────────────────────────────────────
router.get('/santri', requireAuth, async (req, res) => {
  try {
    const { search, status, kelas } = req.query;
    let queryText = `
      SELECT s.*, k.card_uid, k.tipe_kartu, k.status as kartu_status 
      FROM santri s 
      LEFT JOIN kartu k ON s.id = k.santri_id AND k.status = 'aktif'
    `;
    const params = [];
    const conditions = ['s.deleted_at IS NULL'];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(s.nama ILIKE $${params.length} OR s.nis ILIKE $${params.length} OR s.kelas ILIKE $${params.length})`);
    }
    if (status) { params.push(status); conditions.push(`s.status = $${params.length}`); }
    if (kelas) { params.push(kelas); conditions.push(`s.kelas = $${params.length}`); }
    if (conditions.length > 0) queryText += ' WHERE ' + conditions.join(' AND ');
    queryText += ' ORDER BY s.nama ASC';

    const result = await pool.query(queryText, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving santri data.' });
  }
});

router.get('/santri/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const santriResult = await pool.query(`
      SELECT s.*, k.card_uid, k.tipe_kartu, k.status as kartu_status 
      FROM santri s 
      LEFT JOIN kartu k ON s.id = k.santri_id AND k.status = 'aktif'
      WHERE s.id = $1 AND s.deleted_at IS NULL
    `, [id]);
    if (santriResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Santri tidak ditemukan.' });
    const transResult = await pool.query(`SELECT * FROM transaksi WHERE santri_id = $1 ORDER BY created_at DESC LIMIT 10`, [id]);
    res.json({ success: true, data: { ...santriResult.rows[0], riwayat_transaksi: transResult.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving details.' });
  }
});

router.post('/santri', requireAuth, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { nis, nama, kelas, saldo_awal, card_uid, tipe_kartu } = req.body;
    if (!nis || !nama || !kelas) return res.status(400).json({ success: false, message: 'NIS, Nama, and Kelas are required.' });
    const saldo = parseFloat(saldo_awal) || 0.00;

    const [santriRes] = await connection.execute(
      `INSERT INTO santri (nis, nama, kelas, saldo, status) VALUES ($1, $2, $3, $4, 'aktif') RETURNING *`,
      [nis, nama, kelas, saldo]
    );
    const newSantriId = santriRes[0].id;

    let newCard = null;
    if (card_uid && tipe_kartu) {
      const [checkCard] = await connection.execute('SELECT * FROM kartu WHERE card_uid = $1', [card_uid]);
      if (checkCard.length > 0) {
        if (checkCard[0].santri_id !== null) throw new Error(`Kartu dengan ID ${card_uid} sudah didaftarkan pada santri lain.`);
        await connection.execute('UPDATE kartu SET santri_id = $1, status = \'aktif\', updated_at = NOW() WHERE card_uid = $2', [newSantriId, card_uid]);
        newCard = { card_uid, tipe_kartu, santri_id: newSantriId, status: 'aktif' };
      } else {
        const [cardRes] = await connection.execute(
          `INSERT INTO kartu (card_uid, tipe_kartu, santri_id, status) VALUES ($1, $2, $3, 'aktif') RETURNING *`,
          [card_uid, tipe_kartu, newSantriId]
        );
        newCard = cardRes[0];
      }
    }

    if (saldo > 0) {
      await connection.execute(
        `INSERT INTO transaksi (kartu_id, santri_id, tipe_transaksi, jumlah, saldo_sebelum, saldo_sesudah, keterangan, operator) VALUES ($1, $2, 'topup', $3, 0.00, $4, 'Setoran awal saldo pendaftaran santri baru', 'Admin')`,
        [newCard?.id || null, newSantriId, saldo, saldo]
      );
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'Santri registered successfully.', data: { ...santriRes[0], kartu: newCard } });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ success: false, message: err.message || 'Error registering Santri.' });
  } finally {
    connection.release();
  }
});

router.put('/santri/:id', requireAuth, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { nis, nama, kelas, status, card_uid } = req.body;

    const [check] = await connection.execute('SELECT * FROM santri WHERE id = $1', [id]);
    if (check.length === 0) { connection.release(); return res.status(404).json({ success: false, message: 'Santri tidak ditemukan.' }); }

    const current = check[0];
    await connection.execute(
      'UPDATE santri SET nis = $1, nama = $2, kelas = $3, status = $4, updated_at = NOW() WHERE id = $5',
      [nis ?? current.nis, nama ?? current.nama, kelas ?? current.kelas, status ?? current.status, id]
    );

    if (card_uid !== undefined) {
      const [currentCard] = await connection.execute('SELECT * FROM kartu WHERE santri_id = $1 AND status = \'aktif\'', [id]);
      const oldCardUid = currentCard.length > 0 ? currentCard[0].card_uid : null;
      if (card_uid !== oldCardUid) {
        await connection.execute('UPDATE kartu SET santri_id = NULL, status = \'nonaktif\', updated_at = NOW() WHERE santri_id = $1', [id]);
        if (card_uid) {
          const [checkCard] = await connection.execute('SELECT * FROM kartu WHERE card_uid = $1', [card_uid]);
          if (checkCard.length > 0) {
            if (checkCard[0].santri_id !== null && checkCard[0].santri_id !== parseInt(id)) throw new Error(`Kartu dengan ID ${card_uid} sudah digunakan santri lain.`);
            await connection.execute('UPDATE kartu SET santri_id = $1, status = \'aktif\', updated_at = NOW() WHERE card_uid = $2', [id, card_uid]);
          } else {
            await connection.execute(`INSERT INTO kartu (card_uid, tipe_kartu, santri_id, status) VALUES ($1, 'RFID', $2, 'aktif')`, [card_uid, id]);
          }
        }
      }
    }

    await connection.commit();
    const [updatedSantri] = await connection.execute(`
      SELECT s.*, k.card_uid, k.tipe_kartu, k.status as kartu_status 
      FROM santri s LEFT JOIN kartu k ON s.id = k.santri_id AND k.status = 'aktif'
      WHERE s.id = $1`, [id]);
    res.json({ success: true, message: 'Data santri berhasil diperbarui.', data: updatedSantri[0] });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ success: false, message: err.message || 'Gagal memperbarui data Santri.' });
  } finally {
    connection.release();
  }
});

router.delete('/santri/:id', requireAuth, requireAdmin, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const [check] = await connection.execute('SELECT * FROM santri WHERE id = $1', [id]);
    if (check.length === 0) { connection.release(); return res.status(404).json({ success: false, message: 'Santri tidak ditemukan.' }); }

    const [txCheck] = await connection.execute('SELECT COUNT(*) AS cnt FROM transaksi WHERE santri_id = $1', [id]);
    await connection.execute('UPDATE kartu SET santri_id = NULL, updated_at = NOW() WHERE santri_id = $1', [id]);

    if (parseInt(txCheck[0].cnt) > 0) {
      await connection.execute('UPDATE santri SET deleted_at = NOW(), status = \'nonaktif\', updated_at = NOW() WHERE id = $1', [id]);
    } else {
      await connection.execute('DELETE FROM santri WHERE id = $1', [id]);
    }
    await connection.commit();
    res.json({ success: true, message: 'Data santri berhasil dihapus.' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ success: false, message: 'Server error deleting Santri.' });
  } finally {
    connection.release();
  }
});

// ─── KARTU ROUTES ──────────────────────────────────────────────────────────
router.get('/kartu', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT k.*, s.nama as santri_nama, s.nis as santri_nis 
      FROM kartu k LEFT JOIN santri s ON k.santri_id = s.id
      ORDER BY k.id DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving cards.' });
  }
});

router.get('/kartu/:uid', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT k.*, s.nis, s.nama, s.kelas, s.saldo, s.status as santri_status 
      FROM kartu k LEFT JOIN santri s ON k.santri_id = s.id
      WHERE k.card_uid = $1
    `, [req.params.uid]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kartu belum terdaftar di sistem.', is_new_card: true, card_uid: req.params.uid });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving card details.' });
  }
});

router.post('/kartu', requireAuth, async (req, res) => {
  try {
    const { card_uid, tipe_kartu } = req.body;
    if (!card_uid || !tipe_kartu) return res.status(400).json({ success: false, message: 'Card UID and Tipe Kartu are required.' });
    const check = await pool.query('SELECT * FROM kartu WHERE card_uid = $1', [card_uid]);
    if (check.rows.length > 0) return res.status(400).json({ success: false, message: 'Kartu sudah terdaftar di sistem.' });
    const result = await pool.query(`INSERT INTO kartu (card_uid, tipe_kartu, status) VALUES ($1, $2, 'aktif') RETURNING *`, [card_uid, tipe_kartu]);
    res.status(201).json({ success: true, message: 'Kartu registered successfully.', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error registering card.' });
  }
});

router.post('/kartu/assign', requireAuth, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { santri_id, card_uid, tipe_kartu } = req.body;
    if (!santri_id || !card_uid || !tipe_kartu) return res.status(400).json({ success: false, message: 'Santri ID, Card UID, and Tipe Kartu are required.' });

    const [santriCheck] = await connection.execute('SELECT * FROM santri WHERE id = $1', [santri_id]);
    if (santriCheck.length === 0) throw new Error('Santri tidak ditemukan.');

    await connection.execute('UPDATE kartu SET status = \'nonaktif\', santri_id = NULL, updated_at = NOW() WHERE santri_id = $1', [santri_id]);

    const [cardCheck] = await connection.execute('SELECT * FROM kartu WHERE card_uid = $1', [card_uid]);
    if (cardCheck.length > 0) {
      await connection.execute('UPDATE kartu SET santri_id = $1, status = \'aktif\', tipe_kartu = $2, updated_at = NOW() WHERE card_uid = $3', [santri_id, tipe_kartu, card_uid]);
    } else {
      await connection.execute(`INSERT INTO kartu (card_uid, tipe_kartu, santri_id, status) VALUES ($1, $2, $3, 'aktif')`, [card_uid, tipe_kartu, santri_id]);
    }
    await connection.commit();
    const [finalCard] = await connection.execute('SELECT * FROM kartu WHERE card_uid = $1', [card_uid]);
    res.json({ success: true, message: `Kartu berhasil dihubungkan ke santri ${santriCheck[0].nama}.`, data: finalCard[0] });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ success: false, message: err.message || 'Error mapping card.' });
  } finally {
    connection.release();
  }
});

router.put('/kartu/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['aktif', 'hilang', 'nonaktif'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid card status.' });
    const result = await pool.query('UPDATE kartu SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Card not found.' });
    res.json({ success: true, message: 'Card status updated.', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error updating card status.' });
  }
});

// ─── TRANSAKSI ROUTES ──────────────────────────────────────────────────────
router.post('/transaksi', requireAuth, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { card_uid, santri_id, tipe_transaksi, jumlah, keterangan, operator } = req.body;
    if (!tipe_transaksi || !jumlah || parseFloat(jumlah) <= 0) {
      return res.status(400).json({ success: false, message: 'Tipe transaksi dan jumlah valid diperlukan.' });
    }
    const amount = parseFloat(jumlah);
    let finalSantriId = santri_id;
    let finalKartuId = null;

    if (card_uid) {
      const [cardRes] = await connection.execute('SELECT * FROM kartu WHERE card_uid = $1', [card_uid]);
      if (cardRes.length === 0) throw new Error('Kartu tidak terdaftar di sistem.');
      const card = cardRes[0];
      if (card.status !== 'aktif') throw new Error(`Kartu sedang berstatus: ${card.status}.`);
      if (!card.santri_id) throw new Error('Kartu ini belum dihubungkan ke data santri.');
      finalSantriId = card.santri_id;
      finalKartuId = card.id;
    }

    if (!finalSantriId) throw new Error('Santri tidak teridentifikasi.');

    const [santriRes] = await connection.execute('SELECT * FROM santri WHERE id = $1 FOR UPDATE', [finalSantriId]);
    if (santriRes.length === 0) throw new Error('Santri tidak ditemukan.');
    const santri = santriRes[0];
    if (santri.status !== 'aktif') throw new Error('Data santri ini sudah tidak aktif.');

    const saldoSebelum = parseFloat(santri.saldo);
    let saldoSesudah = saldoSebelum;

    if (tipe_transaksi === 'topup') {
      saldoSesudah = saldoSebelum + amount;
    } else if (tipe_transaksi === 'penarikan' || tipe_transaksi === 'pembayaran') {
      if (saldoSebelum < amount) throw new Error(`Saldo tidak mencukupi. Saldo saat ini: Rp ${saldoSebelum.toLocaleString('id-ID')}`);
      saldoSesudah = saldoSebelum - amount;
    } else {
      throw new Error('Tipe transaksi tidak valid.');
    }

    await connection.execute('UPDATE santri SET saldo = $1, updated_at = NOW() WHERE id = $2', [saldoSesudah, finalSantriId]);

    const [transRes] = await connection.execute(
      `INSERT INTO transaksi (kartu_id, santri_id, tipe_transaksi, jumlah, saldo_sebelum, saldo_sesudah, keterangan, operator) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [finalKartuId, finalSantriId, tipe_transaksi, amount, saldoSebelum, saldoSesudah, keterangan || `Transaksi ${tipe_transaksi}`, operator || 'Admin']
    );
    await connection.commit();
    res.status(201).json({
      success: true, message: `Transaksi ${tipe_transaksi} berhasil diproses.`,
      data: { transaksi: transRes[0], santri: { nama: santri.nama, nis: santri.nis, saldo_lama: saldoSebelum, saldo_baru: saldoSesudah } }
    });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ success: false, message: err.message || 'Gagal memproses transaksi.' });
  } finally {
    connection.release();
  }
});

router.get(['/transaksi', '/transaksi/history'], requireAuth, async (req, res) => {
  try {
    const { tipe, search, start_date, end_date, limit = 50, offset = 0 } = req.query;
    let queryText = `
      SELECT t.*, s.nama as santri_nama, s.nis as santri_nis, s.kelas as santri_kelas, k.card_uid
      FROM transaksi t JOIN santri s ON t.santri_id = s.id LEFT JOIN kartu k ON t.kartu_id = k.id
    `;
    const params = [];
    const conditions = [];

    if (tipe) { params.push(tipe); conditions.push(`t.tipe_transaksi = $${params.length}`); }
    if (search) {
      params.push(`%${search}%`);
      const n = params.length;
      conditions.push(`(s.nama ILIKE $${n} OR s.nis ILIKE $${n} OR t.keterangan ILIKE $${n})`);
    }
    if (start_date) { params.push(start_date); conditions.push(`DATE(t.created_at) >= $${params.length}`); }
    if (end_date) { params.push(end_date); conditions.push(`DATE(t.created_at) <= $${params.length}`); }
    if (conditions.length > 0) queryText += ' WHERE ' + conditions.join(' AND ');
    queryText += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(queryText, params);

    let countQuery = `SELECT COUNT(*) as count FROM transaksi t JOIN santri s ON t.santri_id = s.id`;
    const countParams = [...params.slice(0, -2)];
    if (conditions.length > 0) countQuery += ' WHERE ' + conditions.join(' AND ');
    const countResult = await pool.query(countQuery, countParams);

    let sumQuery = `
      SELECT SUM(CASE WHEN t.tipe_transaksi = 'topup' THEN t.jumlah ELSE -t.jumlah END) as total_flow
      FROM transaksi t JOIN santri s ON t.santri_id = s.id
    `;
    if (conditions.length > 0) sumQuery += ' WHERE ' + conditions.join(' AND ');
    const sumResult = await pool.query(sumQuery, countParams);
    const totalFlow = parseFloat(sumResult.rows[0]?.total_flow || 0);

    res.json({ success: true, data: result.rows, total: parseInt(countResult.rows[0]?.count || 0), totalFlow });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving transaction history.' });
  }
});

router.get('/transaksi/stats', requireAuth, async (req, res) => {
  try {
    const saldoRes = await pool.query(`SELECT SUM(saldo) as total_saldo, COUNT(*) as total_santri FROM santri WHERE deleted_at IS NULL AND status = 'aktif'`);
    const transStats = await pool.query(`
      SELECT 
        SUM(CASE WHEN tipe_transaksi = 'topup' THEN jumlah ELSE 0 END) as total_topup,
        SUM(CASE WHEN tipe_transaksi = 'pembayaran' THEN jumlah ELSE 0 END) as total_pembayaran,
        SUM(CASE WHEN tipe_transaksi = 'penarikan' THEN jumlah ELSE 0 END) as total_penarikan,
        COUNT(CASE WHEN tipe_transaksi = 'topup' THEN 1 END) as count_topup,
        COUNT(CASE WHEN tipe_transaksi = 'pembayaran' THEN 1 END) as count_pembayaran,
        COUNT(CASE WHEN tipe_transaksi = 'penarikan' THEN 1 END) as count_penarikan
      FROM transaksi
    `);
    const cardsRes = await pool.query(`SELECT COUNT(*) as total_kartu FROM kartu WHERE status = 'aktif'`);
    const quickTrans = await pool.query(`
      SELECT t.*, s.nama as santri_nama, s.nis as santri_nis
      FROM transaksi t JOIN santri s ON t.santri_id = s.id
      ORDER BY t.created_at DESC LIMIT 5
    `);
    res.json({
      success: true, data: {
        total_santri: parseInt(saldoRes.rows[0]?.total_santri || 0),
        total_outstanding_saldo: parseFloat(saldoRes.rows[0]?.total_saldo || 0),
        total_topup: parseFloat(transStats.rows[0]?.total_topup || 0),
        total_pembayaran: parseFloat(transStats.rows[0]?.total_pembayaran || 0),
        total_penarikan: parseFloat(transStats.rows[0]?.total_penarikan || 0),
        count_topup: parseInt(transStats.rows[0]?.count_topup || 0),
        count_pembayaran: parseInt(transStats.rows[0]?.count_pembayaran || 0),
        count_penarikan: parseInt(transStats.rows[0]?.count_penarikan || 0),
        total_kartu_aktif: parseInt(cardsRes.rows[0]?.total_kartu || 0),
        transaksi_terbaru: quickTrans.rows
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error loading analytics.' });
  }
});

router.get(['/transaksi/detail/:id', '/santri/:id/detail'], requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { tipe, bulan, tahun, limit = 50, offset = 0 } = req.query;

    const santriResult = await pool.query(`
      SELECT s.*, k.card_uid, k.tipe_kartu, k.status as kartu_status, k.id as kartu_id
      FROM santri s LEFT JOIN kartu k ON s.id = k.santri_id AND k.status = 'aktif'
      WHERE s.id = $1
    `, [id]);
    if (santriResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Santri tidak ditemukan.' });
    const santri = santriResult.rows[0];

    let transQuery = `
      SELECT t.*,
        TRIM(TO_CHAR(t.created_at, 'Day')) as hari_nama,
        TO_CHAR(t.created_at, 'DD Month YYYY') as tanggal_format,
        TO_CHAR(t.created_at, 'HH24:MI') as jam_format,
        TO_CHAR(t.created_at, 'YYYY-MM') as bulan_tahun
      FROM transaksi t WHERE t.santri_id = $1
    `;
    const transParams = [id];

    if (tipe) { transParams.push(tipe); transQuery += ` AND t.tipe_transaksi = $${transParams.length}`; }
    if (bulan && tahun) {
      transParams.push(parseInt(bulan)); transQuery += ` AND EXTRACT(MONTH FROM t.created_at) = $${transParams.length}`;
      transParams.push(parseInt(tahun)); transQuery += ` AND EXTRACT(YEAR FROM t.created_at) = $${transParams.length}`;
    } else if (tahun) {
      transParams.push(parseInt(tahun)); transQuery += ` AND EXTRACT(YEAR FROM t.created_at) = $${transParams.length}`;
    }

    let countQuery = `SELECT COUNT(*) as total FROM transaksi t WHERE t.santri_id = $1`;
    const countParams = [id];
    if (tipe) { countParams.push(tipe); countQuery += ` AND t.tipe_transaksi = $${countParams.length}`; }
    if (bulan && tahun) {
      countParams.push(parseInt(bulan)); countQuery += ` AND EXTRACT(MONTH FROM t.created_at) = $${countParams.length}`;
      countParams.push(parseInt(tahun)); countQuery += ` AND EXTRACT(YEAR FROM t.created_at) = $${countParams.length}`;
    }
    const countResult = await pool.query(countQuery, countParams);

    transParams.push(parseInt(limit)); transQuery += ` ORDER BY t.created_at DESC LIMIT $${transParams.length}`;
    transParams.push(parseInt(offset)); transQuery += ` OFFSET $${transParams.length}`;

    const transResult = await pool.query(transQuery, transParams);

    const statsResult = await pool.query(`
      SELECT 
        SUM(CASE WHEN tipe_transaksi = 'topup' THEN jumlah ELSE 0 END) as total_topup,
        SUM(CASE WHEN tipe_transaksi = 'pembayaran' THEN jumlah ELSE 0 END) as total_pembayaran,
        SUM(CASE WHEN tipe_transaksi = 'penarikan' THEN jumlah ELSE 0 END) as total_penarikan,
        COUNT(*) as total_transaksi,
        COUNT(CASE WHEN tipe_transaksi = 'topup' THEN 1 END) as count_topup,
        COUNT(CASE WHEN tipe_transaksi = 'pembayaran' THEN 1 END) as count_pembayaran,
        COUNT(CASE WHEN tipe_transaksi = 'penarikan' THEN 1 END) as count_penarikan,
        MIN(created_at) as transaksi_pertama,
        MAX(created_at) as transaksi_terakhir
      FROM transaksi WHERE santri_id = $1
    `, [id]);

    res.json({ success: true, data: { santri, statistik: statsResult.rows[0], transaksi: transResult.rows, total_transaksi: parseInt(countResult.rows[0]?.total || 0) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error loading student detail.' });
  }
});

router.get(['/transaksi/rekap/:id', '/santri/:id/rekap'], requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { bulan, tahun } = req.query;
    if (!bulan || !tahun) return res.status(400).json({ success: false, message: 'Parameter bulan dan tahun wajib diisi.' });

    const bln = parseInt(bulan); const thn = parseInt(tahun);
    const santriRes = await pool.query('SELECT * FROM santri WHERE id = $1', [id]);
    if (santriRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Santri tidak ditemukan.' });
    const santri = santriRes.rows[0];

    const firstTransResult = await pool.query(`
      SELECT saldo_sebelum FROM transaksi WHERE santri_id = $1 AND EXTRACT(MONTH FROM created_at) = $2 AND EXTRACT(YEAR FROM created_at) = $3 ORDER BY created_at ASC LIMIT 1
    `, [id, bln, thn]);
    const saldoAwalBulan = firstTransResult.rows.length > 0 ? parseFloat(firstTransResult.rows[0].saldo_sebelum) : parseFloat(santri.saldo);

    const lastTransResult = await pool.query(`
      SELECT saldo_sesudah FROM transaksi WHERE santri_id = $1 AND EXTRACT(MONTH FROM created_at) = $2 AND EXTRACT(YEAR FROM created_at) = $3 ORDER BY created_at DESC LIMIT 1
    `, [id, bln, thn]);
    const saldoAkhirBulan = lastTransResult.rows.length > 0 ? parseFloat(lastTransResult.rows[0].saldo_sesudah) : parseFloat(santri.saldo);

    const agregat = await pool.query(`
      SELECT SUM(CASE WHEN tipe_transaksi = 'topup' THEN jumlah ELSE 0 END) as total_topup,
             SUM(CASE WHEN tipe_transaksi = 'pembayaran' THEN jumlah ELSE 0 END) as total_pembayaran,
             SUM(CASE WHEN tipe_transaksi = 'penarikan' THEN jumlah ELSE 0 END) as total_penarikan,
             COUNT(*) as total_transaksi,
             COUNT(CASE WHEN tipe_transaksi = 'topup' THEN 1 END) as count_topup,
             COUNT(CASE WHEN tipe_transaksi = 'pembayaran' THEN 1 END) as count_pembayaran,
             COUNT(CASE WHEN tipe_transaksi = 'penarikan' THEN 1 END) as count_penarikan
      FROM transaksi WHERE santri_id = $1 AND EXTRACT(MONTH FROM created_at) = $2 AND EXTRACT(YEAR FROM created_at) = $3
    `, [id, bln, thn]);

    const daftarTransaksi = await pool.query(`
      SELECT t.*,
        TRIM(TO_CHAR(t.created_at, 'Day')) as hari_nama,
        TO_CHAR(t.created_at, 'DD Month YYYY') as tanggal_format,
        TO_CHAR(t.created_at, 'HH24:MI') as jam_format
      FROM transaksi t WHERE t.santri_id = $1 AND EXTRACT(MONTH FROM t.created_at) = $2 AND EXTRACT(YEAR FROM t.created_at) = $3 ORDER BY t.created_at ASC
    `, [id, bln, thn]);

    const namaBulanID = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    res.json({
      success: true, data: {
        santri: { id: santri.id, nis: santri.nis, nama: santri.nama, kelas: santri.kelas, saldo_saat_ini: parseFloat(santri.saldo) },
        periode: { bulan: bln, tahun: thn, nama_bulan: namaBulanID[bln], label: `${namaBulanID[bln]} ${thn}` },
        ringkasan: { saldo_awal_bulan: saldoAwalBulan, total_topup: parseFloat(agregat.rows[0]?.total_topup || 0), total_pembayaran: parseFloat(agregat.rows[0]?.total_pembayaran || 0), total_penarikan: parseFloat(agregat.rows[0]?.total_penarikan || 0), saldo_akhir_bulan: saldoAkhirBulan, total_transaksi: parseInt(agregat.rows[0]?.total_transaksi || 0), count_topup: parseInt(agregat.rows[0]?.count_topup || 0), count_pembayaran: parseInt(agregat.rows[0]?.count_pembayaran || 0), count_penarikan: parseInt(agregat.rows[0]?.count_penarikan || 0) },
        transaksi: daftarTransaksi.rows
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error loading monthly recap.' });
  }
});

// ─── USERS ROUTES ──────────────────────────────────────────────────────────
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, username, role, status, created_at FROM users ORDER BY created_at ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memuat daftar pengguna.' });
  }
});

router.post('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, username, password, role } = req.body;
    if (!name || !username || !password || !role) return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password minimal 6 karakter.' });
    const { rows: existing } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.length > 0) return res.status(409).json({ success: false, message: `Username "${username}" sudah digunakan.` });
    const allowedRoles = ['Administrator', 'Pengurus Koperasi', 'Kasir'];
    if (!allowedRoles.includes(role)) return res.status(400).json({ success: false, message: 'Role tidak valid.' });
    const hashedPassword = await bcrypt.hash(password, 12);
    await pool.query(`INSERT INTO users (name, username, password_hash, role, status) VALUES ($1, $2, $3, $4, 'aktif')`, [name, username, hashedPassword, role]);
    res.status(201).json({ success: true, message: `Akun ${name} berhasil dibuat.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal membuat akun pengurus.' });
  }
});

router.put('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, role } = req.body;
    if (!name || !role) return res.status(400).json({ success: false, message: 'Nama dan role wajib diisi.' });
    const { rows } = await pool.query('SELECT id FROM users WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    await pool.query('UPDATE users SET name = $1, role = $2, updated_at = NOW() WHERE id = $3', [name, role, req.params.id]);
    res.json({ success: true, message: 'Data pengurus berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui akun pengurus.' });
  }
});

router.put('/users/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['aktif', 'nonaktif'].includes(status)) return res.status(400).json({ success: false, message: 'Status tidak valid.' });
    const { rows } = await pool.query('SELECT id FROM users WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    await pool.query('UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2', [status, req.params.id]);
    res.json({ success: true, message: `Status akun berhasil diubah menjadi ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengubah status akun.' });
  }
});

router.get('/users/:id/check-transactions', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows: user } = await pool.query('SELECT username, name FROM users WHERE id = $1', [req.params.id]);
    if (user.length === 0) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    const { rows: txCheck } = await pool.query('SELECT COUNT(*) AS cnt FROM transaksi WHERE operator ILIKE $1', [`%${user[0].name}%`]);
    res.json({ success: true, data: { hasTransactions: parseInt(txCheck[0]?.cnt || 0) > 0, count: parseInt(txCheck[0]?.cnt || 0) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memeriksa riwayat transaksi.' });
  }
});

router.delete('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Akun pengurus berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghapus akun pengurus.' });
  }
});

router.post('/users/change-password', requireAuth, async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter.' });
    const { rows } = await pool.query('SELECT id, password_hash FROM users WHERE username = $1', [username]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    const isMatch = await bcrypt.compare(oldPassword, rows[0].password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Password lama tidak sesuai.' });
    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, rows[0].id]);
    res.json({ success: true, message: 'Password berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui password.' });
  }
});

router.post('/kartu/scan', (req, res) => {
  const { card_uid, tipe_kartu } = req.body;
  if (!card_uid) return res.status(400).json({ success: false, message: 'Card UID is required.' });
  res.json({ success: true, message: 'Card scan received.', data: { card_uid, tipe_kartu: tipe_kartu || 'RFID' } });
});

// Mount router on both /api and / so all incoming paths match
app.use('/api', router);
app.use('/', router);

// Global Error Handler (ensure JSON is always returned instead of HTML 500)
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

export default app;
