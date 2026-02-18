const router = require('express').Router();
const ctrl = require('../controllers/returnsController');

router.get('/sale/:saleId', ctrl.getBySale);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);

module.exports = router;
