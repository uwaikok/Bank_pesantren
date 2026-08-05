const db = require('../config/db');

// Get all Santri with search & filter
exports.getAllSantri = async (req, res) => {
  try {
    const { search, status, kelas } = req.query;
    let queryText = `
      SELECT s.*, k.card_uid, k.tipe_kartu, k.status as kartu_status 
      FROM santri s 
      LEFT JOIN kartu k ON s.id = k.santri_id
    `;
    const params = [];
    const conditions = ['s.deleted_at IS NULL'];

    if (search) {
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      conditions.push(`(s.nama LIKE ? OR s.nis LIKE ? OR s.kelas LIKE ?)`);
    }

    if (status) {
      params.push(status);
      conditions.push(`s.status = ?`);
    }

    if (kelas) {
      params.push(kelas);
      conditions.push(`s.kelas = ?`);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY s.nama ASC';

    const result = await db.query(queryText, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getAllSantri:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving santri data.' });
  }
};

// Get single Santri details by ID, including transaction history and card
exports.getSantriById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get Santri and Card info
    const santriResult = await db.query(`
      SELECT s.*, k.card_uid, k.tipe_kartu, k.status as kartu_status 
      FROM santri s 
      LEFT JOIN kartu k ON s.id = k.santri_id 
      WHERE s.id = ? AND s.deleted_at IS NULL
    `, [id]);

    if (santriResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Santri not found.' });
    }

    // Get last 10 transactions
    const transResult = await db.query(`
      SELECT * FROM transaksi 
      WHERE santri_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [id]);

    res.json({
      success: true,
      data: {
        ...santriResult.rows[0],
        riwayat_transaksi: transResult.rows
      }
    });
  } catch (error) {
    console.error('Error getSantriById:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving details.' });
  }
};

// Create Santri (and optionally register RFID/NFC Card)
exports.createSantri = async (req, res) => {
  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();
    const { nis, nama, kelas, saldo_awal, card_uid, tipe_kartu } = req.body;

    if (!nis || !nama || !kelas) {
      return res.status(400).json({ success: false, message: 'NIS, Nama, and Kelas are required.' });
    }

    const saldo = parseFloat(saldo_awal) || 0.00;

    // 1. Insert Santri
    const [santriRes] = await connection.execute(
      'INSERT INTO santri (nis, nama, kelas, saldo, status) VALUES (?, ?, ?, ?, \'aktif\')',
      [nis, nama, kelas, saldo]
    );
    const newSantriId = santriRes.insertId;

    let newCard = null;
    // 2. Insert and Link Card if provided
    if (card_uid && tipe_kartu) {
      // Check if card already exists
      const [checkCard] = await connection.execute('SELECT * FROM kartu WHERE card_uid = ?', [card_uid]);
      if (checkCard.length > 0) {
        if (checkCard[0].santri_id !== null) {
          throw new Error(`Kartu dengan ID ${card_uid} sudah didaftarkan pada santri lain.`);
        }
        // Map existing card
        await connection.execute(
          'UPDATE kartu SET santri_id = ?, status = \'aktif\', updated_at = NOW() WHERE card_uid = ?',
          [newSantriId, card_uid]
        );
        newCard = { card_uid, tipe_kartu, santri_id: newSantriId, status: 'aktif' };
      } else {
        // Insert new card
        const [cardRes] = await connection.execute(
          'INSERT INTO kartu (card_uid, tipe_kartu, santri_id, status) VALUES (?, ?, ?, \'aktif\')',
          [card_uid, tipe_kartu, newSantriId]
        );
        newCard = { id: cardRes.insertId, card_uid, tipe_kartu, santri_id: newSantriId, status: 'aktif' };
      }
    }

    // 3. Write transaction if initial balance > 0
    if (saldo > 0) {
      await connection.execute(
        `INSERT INTO transaksi (kartu_id, santri_id, tipe_transaksi, jumlah, saldo_sebelum, saldo_sesudah, keterangan, operator) 
         VALUES (?, ?, 'topup', ?, 0.00, ?, 'Setoran awal saldo pendaftaran santri baru', 'Admin')`,
        [newCard ? (newCard.id || null) : null, newSantriId, saldo, saldo]
      );
    }

    await connection.commit();

    // Fetch the inserted student to return
    const [insertedSantri] = await connection.execute('SELECT * FROM santri WHERE id = ?', [newSantriId]);

    res.status(201).json({
      success: true,
      message: 'Santri registered successfully.',
      data: {
        ...insertedSantri[0],
        kartu: newCard
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error createSantri:', error);
    res.status(400).json({ success: false, message: error.message || 'Error registering Santri.' });
  } finally {
    connection.release();
  }
};

// Update Santri basic info, status, and card assignment
exports.updateSantri = async (req, res) => {
  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { nis, nama, kelas, status, card_uid } = req.body;

    const [check] = await connection.execute('SELECT * FROM santri WHERE id = ?', [id]);
    if (check.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Santri tidak ditemukan.' });
    }

    const current = check[0];
    const finalNis = nis !== undefined ? nis : current.nis;
    const finalNama = nama !== undefined ? nama : current.nama;
    const finalKelas = kelas !== undefined ? kelas : current.kelas;
    const finalStatus = status !== undefined ? status : current.status;

    // Update santri basic info
    await connection.execute(
      'UPDATE santri SET nis = ?, nama = ?, kelas = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [finalNis, finalNama, finalKelas, finalStatus, id]
    );

    // Get current active card
    const [currentCard] = await connection.execute(
      'SELECT * FROM kartu WHERE santri_id = ? AND status = \'aktif\'',
      [id]
    );

    const oldCardUid = currentCard.length > 0 ? currentCard[0].card_uid : null;

    if (card_uid !== undefined) {
      if (card_uid !== oldCardUid) {
        // Unlink old cards
        await connection.execute(
          'UPDATE kartu SET santri_id = NULL WHERE santri_id = ?',
          [id]
        );

        if (card_uid) {
          // Check if card_uid is already used by someone else
          const [checkCard] = await connection.execute(
            'SELECT * FROM kartu WHERE card_uid = ?',
            [card_uid]
          );

          if (checkCard.length > 0) {
            // If the card is registered to someone else and active, throw error
            if (checkCard[0].santri_id !== null && checkCard[0].santri_id !== parseInt(id)) {
              throw new Error(`Kartu dengan ID ${card_uid} sudah didaftarkan pada santri lain.`);
            }
            // Link it to this santri
            await connection.execute(
              'UPDATE kartu SET santri_id = ?, status = \'aktif\', updated_at = NOW() WHERE card_uid = ?',
              [id, card_uid]
            );
          } else {
            // Create a new card and link it as RFID (consistent with check constraint)
            await connection.execute(
              'INSERT INTO kartu (card_uid, tipe_kartu, santri_id, status) VALUES (?, \'RFID\', ?, \'aktif\')',
              [card_uid, id]
            );
          }
        }
      }
    }

    await connection.commit();

    // Fetch updated data with card info
    const [updatedSantri] = await connection.execute(`
      SELECT s.*, k.card_uid, k.tipe_kartu, k.status as kartu_status 
      FROM santri s 
      LEFT JOIN kartu k ON s.id = k.santri_id AND k.status = 'aktif'
      WHERE s.id = ?
    `, [id]);

    res.json({ success: true, message: 'Data santri berhasil diperbarui.', data: updatedSantri[0] });
  } catch (error) {
    await connection.rollback();
    console.error('Error updateSantri:', error);
    res.status(400).json({ success: false, message: error.message || 'Gagal memperbarui data Santri.' });
  } finally {
    connection.release();
  }
};

// Delete Santri
exports.deleteSantri = async (req, res) => {
  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    // Check if exists
    const [check] = await connection.execute('SELECT * FROM santri WHERE id = ?', [id]);
    if (check.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Santri tidak ditemukan.' });
    }

    // Check transaction history to determine if we should Soft Delete or Hard Delete
    const [txCheck] = await connection.execute('SELECT COUNT(*) AS cnt FROM transaksi WHERE santri_id = ?', [id]);
    
    // Always unlink cards first so they can be reused immediately
    await connection.execute('UPDATE kartu SET santri_id = NULL, updated_at = NOW() WHERE santri_id = ?', [id]);

    if (txCheck[0].cnt > 0) {
      // Soft Delete (to preserve audit logs of transactions)
      await connection.execute(
        'UPDATE santri SET deleted_at = NOW(), status = \'nonaktif\', updated_at = NOW() WHERE id = ?',
        [id]
      );
      console.log(`[deleteSantri] Santri ID ${id} soft-deleted because they have transaction history.`);
    } else {
      // Hard Delete (safe to completely remove as there are no transactions)
      await connection.execute('DELETE FROM santri WHERE id = ?', [id]);
      console.log(`[deleteSantri] Santri ID ${id} hard-deleted from database (no transactions).`);
    }

    await connection.commit();
    res.json({ success: true, message: 'Data santri berhasil dihapus.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleteSantri:', error);
    res.status(500).json({ success: false, message: 'Server error deleting Santri.' });
  } finally {
    connection.release();
  }
};
