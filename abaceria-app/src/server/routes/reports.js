const router = require('express').Router();
const ctrl = require('../controllers/reportsController');

router.get('/summary', ctrl.summary);
router.get('/by-day', ctrl.byDay);
router.get('/top-products', ctrl.topProducts);
router.get('/by-category', ctrl.byCategory);

module.exports = router;
