const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventoryController');

router.get('/summary', ctrl.summary);
router.get('/status', ctrl.status);
router.get('/movements', ctrl.movements);
router.post('/entry', ctrl.entry);
router.post('/adjustment', ctrl.adjustment);

module.exports = router;
