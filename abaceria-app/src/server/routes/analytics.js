const router = require('express').Router();
const ctrl = require('../controllers/analyticsController');

router.get('/alerts', ctrl.alerts);
router.get('/product-velocity', ctrl.productVelocity);
router.get('/restock', ctrl.restock);
router.get('/dead-stock', ctrl.deadStock);
router.get('/category-performance', ctrl.categoryPerformance);
router.get('/anomalies', ctrl.anomalies);

module.exports = router;
