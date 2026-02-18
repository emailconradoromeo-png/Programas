const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dailySalesController');

router.get('/', ctrl.getByDate);
router.get('/cierre', ctrl.cierre);

module.exports = router;
