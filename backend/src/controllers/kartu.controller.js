const db = require('../config/db');

// Get card details by UID
exports.getCardByUid = async (req, res) => {
  try {
    const { uid } = req.params;
    const result = await db.query(`
      SELECT k.*, s.nis, s.nama, s.kelas, s.saldo, s.status as santri_status 
      FROM kartu k
      LEFT JOIN santri s ON k.santri_id = s.id
      WHERE k.card_uid = ?
    `, [uid]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kartu belum terdaftar di sistem.',
        is_new_card: true,
        card_uid: uid
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error getCardByUid:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving card details.' });
  }
};

// Register card directly without linking to student
exports.createCard = async (req, res) => {
  try {
    const { card_uid, tipe_kartu } = req.body;
    if (!card_uid || !tipe_kartu) {
      return res.status(400).json({ success: false, message: 'Card UID and Tipe Kartu are required.' });
    }

    const check = await db.query('SELECT * FROM kartu WHERE card_uid = ?', [card_uid]);
    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Kartu sudah terdaftar di sistem.' });
    }

    await db.pool.execute(
      'INSERT INTO kartu (card_uid, tipe_kartu, status) VALUES (?, ?, \'aktif\')',
      [card_uid, tipe_kartu]
    );

    const [inserted] = await db.pool.execute('SELECT * FROM kartu WHERE card_uid = ?', [card_uid]);

    res.status(201).json({ success: true, message: 'Kartu registered successfully.', data: inserted[0] });
  } catch (error) {
    console.error('Error createCard:', error);
    res.status(500).json({ success: false, message: 'Server error registering card.' });
  }
};

// Assign/Reassign Card to Santri
exports.assignCard = async (req, res) => {
  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();
    const { santri_id, card_uid, tipe_kartu } = req.body;

    if (!santri_id || !card_uid || !tipe_kartu) {
      return res.status(400).json({ success: false, message: 'Santri ID, Card UID, and Tipe Kartu are required.' });
    }

    // 1. Verify Santri exists
    const [santriCheck] = await connection.execute('SELECT * FROM santri WHERE id = ?', [santri_id]);
    if (santriCheck.length === 0) {
      throw new Error('Santri tidak ditemukan.');
    }

    // 2. Set any existing cards of this student to 'nonaktif'
    await connection.execute(
      'UPDATE kartu SET status = \'nonaktif\', santri_id = NULL, updated_at = NOW() WHERE santri_id = ?',
      [santri_id]
    );

    // 3. Check if the new card already exists
    const [cardCheck] = await connection.execute('SELECT * FROM kartu WHERE card_uid = ?', [card_uid]);

    if (cardCheck.length > 0) {
      // Map existing card
      await connection.execute(
        'UPDATE kartu SET santri_id = ?, status = \'aktif\', tipe_kartu = ?, updated_at = NOW() WHERE card_uid = ?',
        [santri_id, tipe_kartu, card_uid]
      );
    } else {
      // Insert new card
      await connection.execute(
        'INSERT INTO kartu (card_uid, tipe_kartu, santri_id, status) VALUES (?, ?, ?, \'aktif\')',
        [card_uid, tipe_kartu, santri_id]
      );
    }

    await connection.commit();

    const [finalCard] = await connection.execute('SELECT * FROM kartu WHERE card_uid = ?', [card_uid]);

    res.json({
      success: true,
      message: `Kartu berhasil dihubungkan ke santri ${santriCheck[0].nama}.`,
      data: finalCard[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error assignCard:', error);
    res.status(400).json({ success: false, message: error.message || 'Error mapping card to student.' });
  } finally {
    connection.release();
  }
};

// Update card status
exports.updateCardStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['aktif', 'hilang', 'nonaktif'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid card status.' });
    }

    await db.pool.execute(
      'UPDATE kartu SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    const [result] = await db.pool.execute('SELECT * FROM kartu WHERE id = ?', [id]);
    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Card not found.' });
    }

    res.json({ success: true, message: 'Card status updated successfully.', data: result[0] });
  } catch (error) {
    console.error('Error updateCardStatus:', error);
    res.status(500).json({ success: false, message: 'Server error updating card status.' });
  }
};

// Get all registered cards
exports.getAllCards = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT k.*, s.nama as santri_nama, s.nis as santri_nis 
      FROM kartu k
      LEFT JOIN santri s ON k.santri_id = s.id
      ORDER BY k.id DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getAllCards:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving cards.' });
  }
};
