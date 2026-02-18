const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Public
router.post('/login', authController.login);

// Protected
router.get('/me', authMiddleware, authController.me);
router.put('/password', authMiddleware, authController.changePassword);

module.exports = router;
