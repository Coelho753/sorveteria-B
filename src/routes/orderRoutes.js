const router = require('express').Router();
const c = require('../controllers/orderController');
const auth = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');
const { createOrderValidator, createWhatsappOrderValidator, updateOrderStatusValidator } = require('../validators/orderValidators');
const validate = require('../middlewares/validate');

router.post('/whatsapp', createWhatsappOrderValidator, validate, c.createWhatsapp);
router.post('/', auth, createOrderValidator, validate, c.create);
router.get('/me', auth, c.listMine);
router.get('/', auth, admin, c.listAll);
router.put('/:id', auth, admin, updateOrderStatusValidator, validate, c.updateStatus);

module.exports = router;
