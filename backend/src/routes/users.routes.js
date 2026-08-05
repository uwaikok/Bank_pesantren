const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

// Secure all user management endpoints to require Admin token
router.use(requireAuth);
router.use(requireAdmin);

router.get('/', usersController.getAllUsers);
router.post('/', usersController.createUser);
router.put('/:id', usersController.updateUser);
router.put('/:id/status', usersController.updateUserStatus);
router.get('/:id/check-transactions', usersController.checkUserTransactions);
router.delete('/:id', usersController.deleteUser);

module.exports = router;
