const express = require('express');
const router = express.Router();
const transaksiController = require('../controllers/transaksi.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.post('/', transaksiController.createTransaction);
router.get('/history', transaksiController.getTransactionHistory);
router.get('/stats', transaksiController.getDashboardStats);

module.exports = router;
