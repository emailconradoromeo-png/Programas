const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// All routes require auth + admin
router.use(authMiddleware, adminOnly);

router.get('/', usersController.getAll);
router.get('/:id', usersController.getById);
router.post('/', usersController.create);
router.put('/:id', usersController.update);
router.put('/:id/reset', usersController.resetPassword);
router.delete('/:id', usersController.remove);

module.exports = router;
