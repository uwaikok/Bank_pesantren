const db = require('../config/db');

// Create a Transaction (Top-Up, Payment, Withdrawal)
exports.createTransaction = async (req, res) => {
  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();

    const { card_uid, santri_id, tipe_transaksi, jumlah, keterangan, operator } = req.body;

    if (!tipe_transaksi || !jumlah || parseFloat(jumlah) <= 0) {
      return res.status(400).json({ success: false, message: 'Tipe transaksi dan jumlah valid diperlukan.' });
    }

    const amount = parseFloat(jumlah);
    let finalSantriId = santri_id;
    let finalKartuId = null;

    // 1. Identify student and card
    if (card_uid) {
      // Find card
      const [cardRes] = await connection.execute('SELECT * FROM kartu WHERE card_uid = ?', [card_uid]);
      if (cardRes.length === 0) {
        throw new Error('Kartu tidak terdaftar di sistem.');
      }
      
      const card = cardRes[0];
      if (card.status !== 'aktif') {
        throw new Error(`Kartu sedang berstatus: ${card.status}. Hubungi Admin untuk perbaikan.`);
      }

      if (!card.santri_id) {
        throw new Error('Kartu ini belum dihubungkan ke data santri manapun.');
      }

      finalSantriId = card.santri_id;
      finalKartuId = card.id;
    }

    if (!finalSantriId) {
      throw new Error('Santri tidak teridentifikasi. Silakan masukkan ID Santri atau Tap Kartu.');
    }

    // 2. Lock & Retrieve student info (FOR UPDATE is supported by InnoDB in MySQL)
    const [santriRes] = await connection.execute('SELECT * FROM santri WHERE id = ? FOR UPDATE', [finalSantriId]);
    if (santriRes.length === 0) {
      throw new Error('Santri tidak ditemukan.');
    }

    const santri = santriRes[0];
    if (santri.status !== 'aktif') {
      throw new Error('Data santri ini sudah tidak aktif.');
    }

    const saldoSebelum = parseFloat(santri.saldo);
    let saldoSesudah = saldoSebelum;

    // 3. Process balance update
    if (tipe_transaksi === 'topup') {
      saldoSesudah = saldoSebelum + amount;
    } else if (tipe_transaksi === 'penarikan' || tipe_transaksi === 'pembayaran') {
      if (saldoSebelum < amount) {
        throw new Error(`Saldo tidak mencukupi. Saldo saat ini: Rp ${saldoSebelum.toLocaleString('id-ID')}`);
      }
      saldoSesudah = saldoSebelum - amount;
    } else {
      throw new Error('Tipe transaksi tidak valid. Gunakan: topup, penarikan, atau pembayaran.');
    }

    // 4. Update student's balance
    await connection.execute('UPDATE santri SET saldo = ?, updated_at = NOW() WHERE id = ?', [saldoSesudah, finalSantriId]);

    // 5. Insert transaction log
    const transText = `
      INSERT INTO transaksi (kartu_id, santri_id, tipe_transaksi, jumlah, saldo_sebelum, saldo_sesudah, keterangan, operator) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const transParams = [
      finalKartuId, 
      finalSantriId, 
      tipe_transaksi, 
      amount, 
      saldoSebelum, 
      saldoSesudah, 
      keterangan || `Transaksi ${tipe_transaksi} sebesar Rp ${amount.toLocaleString('id-ID')}`,
      operator || 'Admin'
    ];
    
    const [transRes] = await connection.execute(transText, transParams);
    const transId = transRes.insertId;

    await connection.commit();

    const [insertedTrans] = await db.pool.execute('SELECT * FROM transaksi WHERE id = ?', [transId]);
    
    res.status(201).json({
      success: true,
      message: `Transaksi ${tipe_transaksi} berhasil diproses.`,
      data: {
        transaksi: insertedTrans[0],
        santri: {
          nama: santri.nama,
          nis: santri.nis,
          saldo_lama: saldoSebelum,
          saldo_baru: saldoSesudah
        }
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error createTransaction:', error);
    res.status(400).json({ success: false, message: error.message || 'Gagal memproses transaksi.' });
  } finally {
    connection.release();
  }
};

// Get All Transactions with Filters & Pagination
exports.getTransactionHistory = async (req, res) => {
  try {
    const { tipe, search, start_date, end_date, limit = 50, offset = 0 } = req.query;
    
    let queryText = `
      SELECT t.*, s.nama as santri_nama, s.nis as santri_nis, s.kelas as santri_kelas, k.card_uid
      FROM transaksi t
      JOIN santri s ON t.santri_id = s.id
      LEFT JOIN kartu k ON t.kartu_id = k.id
    `;
    const params = [];
    const conditions = [];

    if (tipe) {
      params.push(tipe);
      conditions.push(`t.tipe_transaksi = ?`);
    }

    if (search) {
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      conditions.push(`(s.nama LIKE ? OR s.nis LIKE ? OR t.keterangan LIKE ?)`);
    }

    if (start_date) {
      params.push(start_date);
      conditions.push(`DATE(t.created_at) >= ?`);
    }

    if (end_date) {
      params.push(end_date);
      conditions.push(`DATE(t.created_at) <= ?`);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(queryText, params);
    
    // Also get the total count for pagination
    let countQuery = `
      SELECT COUNT(*) as count
      FROM transaksi t 
      JOIN santri s ON t.santri_id = s.id
    `;
    const countParams = [];
    const countConditions = [];
    if (tipe) {
      countParams.push(tipe);
      countConditions.push(`t.tipe_transaksi = ?`);
    }
    if (search) {
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      countConditions.push(`(s.nama LIKE ? OR s.nis LIKE ? OR t.keterangan LIKE ?)`);
    }
    if (start_date) {
      countParams.push(start_date);
      countConditions.push(`DATE(t.created_at) >= ?`);
    }
    if (end_date) {
      countParams.push(end_date);
      countConditions.push(`DATE(t.created_at) <= ?`);
    }
    if (countConditions.length > 0) {
      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }
    
    const countResult = await db.query(countQuery, countParams);

    // Get the sum total flow for audit summary
    let sumQuery = `
      SELECT SUM(CASE WHEN t.tipe_transaksi = 'topup' THEN t.jumlah ELSE -t.jumlah END) as total_flow
      FROM transaksi t
      JOIN santri s ON t.santri_id = s.id
    `;
    if (countConditions.length > 0) {
      sumQuery += ' WHERE ' + countConditions.join(' AND ');
    }
    const sumResult = await db.query(sumQuery, countParams);
    const totalFlow = parseFloat(sumResult.rows[0].total_flow || 0);

    res.json({ 
      success: true, 
      data: result.rows,
      total: parseInt(countResult.rows[0].count || 0),
      totalFlow: totalFlow
    });
  } catch (error) {
    console.error('Error getTransactionHistory:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving transaction history.' });
  }
};

// Get System Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Total balance currently in system (Outstanding liability)
    const saldoRes = await db.query(`SELECT SUM(saldo) as total_saldo, COUNT(*) as total_santri FROM santri WHERE deleted_at IS NULL`);
    
    // 2. Aggregates for transactions
    const transStats = await db.query(`
      SELECT 
        SUM(CASE WHEN tipe_transaksi = 'topup' THEN jumlah ELSE 0 END) as total_topup,
        SUM(CASE WHEN tipe_transaksi = 'pembayaran' THEN jumlah ELSE 0 END) as total_pembayaran,
        SUM(CASE WHEN tipe_transaksi = 'penarikan' THEN jumlah ELSE 0 END) as total_penarikan,
        COUNT(CASE WHEN tipe_transaksi = 'topup' THEN 1 END) as count_topup,
        COUNT(CASE WHEN tipe_transaksi = 'pembayaran' THEN 1 END) as count_pembayaran,
        COUNT(CASE WHEN tipe_transaksi = 'penarikan' THEN 1 END) as count_penarikan
      FROM transaksi
    `);

    // 3. Registered Cards Count
    const cardsRes = await db.query(`SELECT COUNT(*) as total_kartu FROM kartu WHERE status = 'aktif'`);

    // 4. Get last 5 transactions for dashboard quick list
    const quickTrans = await db.query(`
      SELECT t.*, s.nama as santri_nama, s.nis as santri_nis
      FROM transaksi t
      JOIN santri s ON t.santri_id = s.id
      ORDER BY t.created_at DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        total_santri: parseInt(saldoRes.rows[0].total_santri || 0),
        total_outstanding_saldo: parseFloat(saldoRes.rows[0].total_saldo || 0),
        total_topup: parseFloat(transStats.rows[0].total_topup || 0),
        total_pembayaran: parseFloat(transStats.rows[0].total_pembayaran || 0),
        total_penarikan: parseFloat(transStats.rows[0].total_penarikan || 0),
        count_topup: parseInt(transStats.rows[0].count_topup || 0),
        count_pembayaran: parseInt(transStats.rows[0].count_pembayaran || 0),
        count_penarikan: parseInt(transStats.rows[0].count_penarikan || 0),
        total_kartu_aktif: parseInt(cardsRes.rows[0].total_kartu || 0),
        transaksi_terbaru: quickTrans.rows
      }
    });
  } catch (error) {
    console.error('Error getDashboardStats:', error);
    res.status(500).json({ success: false, message: 'Server error loading analytics.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET DETAIL SANTRI — profil + seluruh riwayat transaksi
// Query params: ?tipe=topup|pembayaran|penarikan&bulan=8&tahun=2026&limit=50&offset=0
// ─────────────────────────────────────────────────────────────
exports.getDetailSantri = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipe, bulan, tahun, limit = 50, offset = 0 } = req.query;

    // 1. Ambil profil santri + info kartu
    const santriResult = await db.query(`
      SELECT s.*, 
             k.card_uid, k.tipe_kartu, k.status as kartu_status, k.id as kartu_id
      FROM santri s
      LEFT JOIN kartu k ON s.id = k.santri_id AND k.status = 'aktif'
      WHERE s.id = ?
    `, [id]);

    if (santriResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Santri tidak ditemukan.' });
    }

    const santri = santriResult.rows[0];

    // 2. Bangun query transaksi dengan filter
    let transQuery = `
      SELECT t.*,
             DAYNAME(t.created_at) as hari_nama,
             DATE_FORMAT(t.created_at, '%d %M %Y') as tanggal_format,
             DATE_FORMAT(t.created_at, '%H:%i') as jam_format,
             DATE_FORMAT(t.created_at, '%Y-%m') as bulan_tahun
      FROM transaksi t
      WHERE t.santri_id = ?
    `;
    const transParams = [id];

    if (tipe) {
      transQuery += ` AND t.tipe_transaksi = ?`;
      transParams.push(tipe);
    }
    if (bulan && tahun) {
      transQuery += ` AND MONTH(t.created_at) = ? AND YEAR(t.created_at) = ?`;
      transParams.push(parseInt(bulan), parseInt(tahun));
    } else if (tahun) {
      transQuery += ` AND YEAR(t.created_at) = ?`;
      transParams.push(parseInt(tahun));
    }

    // Count total untuk pagination
    let countQuery = `SELECT COUNT(*) as total FROM transaksi t WHERE t.santri_id = ?`;
    const countParams = [id];
    if (tipe) { countQuery += ` AND t.tipe_transaksi = ?`; countParams.push(tipe); }
    if (bulan && tahun) { countQuery += ` AND MONTH(t.created_at) = ? AND YEAR(t.created_at) = ?`; countParams.push(parseInt(bulan), parseInt(tahun)); }
    else if (tahun) { countQuery += ` AND YEAR(t.created_at) = ?`; countParams.push(parseInt(tahun)); }

    const countResult = await db.query(countQuery, countParams);

    transQuery += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
    transParams.push(parseInt(limit), parseInt(offset));

    const transResult = await db.query(transQuery, transParams);

    // 3. Ringkasan statistik keseluruhan santri ini
    const statsResult = await db.query(`
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
      FROM transaksi
      WHERE santri_id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        santri,
        statistik: statsResult.rows[0],
        transaksi: transResult.rows,
        total_transaksi: parseInt(countResult.rows[0].total || 0)
      }
    });
  } catch (error) {
    console.error('Error getDetailSantri:', error);
    res.status(500).json({ success: false, message: 'Server error loading student detail.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET REKAP BULANAN SANTRI
// Query params: ?bulan=8&tahun=2026 (wajib)
// ─────────────────────────────────────────────────────────────
exports.getRekapBulanan = async (req, res) => {
  try {
    const { id } = req.params;
    const { bulan, tahun } = req.query;

    if (!bulan || !tahun) {
      return res.status(400).json({ success: false, message: 'Parameter bulan dan tahun wajib diisi.' });
    }

    const bln = parseInt(bulan);
    const thn = parseInt(tahun);

    // 1. Cek santri ada
    const santriRes = await db.query('SELECT * FROM santri WHERE id = ?', [id]);
    if (santriRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Santri tidak ditemukan.' });
    }
    const santri = santriRes.rows[0];

    // 2. Saldo awal bulan = saldo_sebelum transaksi pertama di bulan ini
    //    Jika tidak ada transaksi bulan ini, saldo awal = saldo saat ini
    const firstTransResult = await db.query(`
      SELECT saldo_sebelum FROM transaksi
      WHERE santri_id = ? AND MONTH(created_at) = ? AND YEAR(created_at) = ?
      ORDER BY created_at ASC LIMIT 1
    `, [id, bln, thn]);

    const saldoAwalBulan = firstTransResult.rows.length > 0
      ? parseFloat(firstTransResult.rows[0].saldo_sebelum)
      : parseFloat(santri.saldo);

    // 3. Saldo akhir bulan = saldo_sesudah transaksi terakhir di bulan ini
    const lastTransResult = await db.query(`
      SELECT saldo_sesudah FROM transaksi
      WHERE santri_id = ? AND MONTH(created_at) = ? AND YEAR(created_at) = ?
      ORDER BY created_at DESC LIMIT 1
    `, [id, bln, thn]);

    const saldoAkhirBulan = lastTransResult.rows.length > 0
      ? parseFloat(lastTransResult.rows[0].saldo_sesudah)
      : parseFloat(santri.saldo);

    // 4. Agregat transaksi bulan ini
    const agregat = await db.query(`
      SELECT
        SUM(CASE WHEN tipe_transaksi = 'topup' THEN jumlah ELSE 0 END) as total_topup,
        SUM(CASE WHEN tipe_transaksi = 'pembayaran' THEN jumlah ELSE 0 END) as total_pembayaran,
        SUM(CASE WHEN tipe_transaksi = 'penarikan' THEN jumlah ELSE 0 END) as total_penarikan,
        COUNT(*) as total_transaksi,
        COUNT(CASE WHEN tipe_transaksi = 'topup' THEN 1 END) as count_topup,
        COUNT(CASE WHEN tipe_transaksi = 'pembayaran' THEN 1 END) as count_pembayaran,
        COUNT(CASE WHEN tipe_transaksi = 'penarikan' THEN 1 END) as count_penarikan
      FROM transaksi
      WHERE santri_id = ? AND MONTH(created_at) = ? AND YEAR(created_at) = ?
    `, [id, bln, thn]);

    // 5. Daftar transaksi bulan ini lengkap dengan format hari & tanggal
    const daftarTransaksi = await db.query(`
      SELECT t.*,
             DAYNAME(t.created_at) as hari_nama,
             DATE_FORMAT(t.created_at, '%d %M %Y') as tanggal_format,
             DATE_FORMAT(t.created_at, '%H:%i') as jam_format
      FROM transaksi t
      WHERE t.santri_id = ? AND MONTH(t.created_at) = ? AND YEAR(t.created_at) = ?
      ORDER BY t.created_at ASC
    `, [id, bln, thn]);

    // 6. Nama bulan dalam Bahasa Indonesia
    const namaBulanID = [
      '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    res.json({
      success: true,
      data: {
        santri: {
          id: santri.id,
          nis: santri.nis,
          nama: santri.nama,
          kelas: santri.kelas,
          saldo_saat_ini: parseFloat(santri.saldo)
        },
        periode: {
          bulan: bln,
          tahun: thn,
          nama_bulan: namaBulanID[bln],
          label: `${namaBulanID[bln]} ${thn}`
        },
        ringkasan: {
          saldo_awal_bulan: saldoAwalBulan,
          total_topup: parseFloat(agregat.rows[0].total_topup || 0),
          total_pembayaran: parseFloat(agregat.rows[0].total_pembayaran || 0),
          total_penarikan: parseFloat(agregat.rows[0].total_penarikan || 0),
          saldo_akhir_bulan: saldoAkhirBulan,
          total_transaksi: parseInt(agregat.rows[0].total_transaksi || 0),
          count_topup: parseInt(agregat.rows[0].count_topup || 0),
          count_pembayaran: parseInt(agregat.rows[0].count_pembayaran || 0),
          count_penarikan: parseInt(agregat.rows[0].count_penarikan || 0)
        },
        transaksi: daftarTransaksi.rows
      }
    });
  } catch (error) {
    console.error('Error getRekapBulanan:', error);
    res.status(500).json({ success: false, message: 'Server error loading monthly recap.' });
  }
};
