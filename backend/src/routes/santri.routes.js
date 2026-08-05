const express = require('express');
const router = express.Router();
const santriController = require('../controllers/santri.controller');
const transaksiController = require('../controllers/transaksi.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

// CRUD endpoints
router.get('/', santriController.getAllSantri);
router.get('/:id', santriController.getSantriById);
router.post('/', santriController.createSantri);
router.put('/:id', santriController.updateSantri);
router.delete('/:id', santriController.deleteSantri);

// Detail & rekap per santri
router.get('/:id/detail', transaksiController.getDetailSantri);
router.get('/:id/rekap', transaksiController.getRekapBulanan);

module.exports = router;
