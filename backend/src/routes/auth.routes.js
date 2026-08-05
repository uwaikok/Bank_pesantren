const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/login', authController.login);
router.get('/verify', authController.verify);
router.post('/change-password', authController.changePassword);

module.exports = router;
