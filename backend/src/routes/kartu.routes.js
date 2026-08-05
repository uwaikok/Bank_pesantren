const express = require('express');
const router = express.Router();
const kartuController = require('../controllers/kartu.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.get('/', kartuController.getAllCards);
router.get('/:uid', kartuController.getCardByUid);
router.post('/', kartuController.createCard);
router.post('/assign', kartuController.assignCard);
router.put('/:id/status', kartuController.updateCardStatus);

module.exports = router;
