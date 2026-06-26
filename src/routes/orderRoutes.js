const router = require('express').Router();
const c = require('../controllers/orderController');
const auth = require('../middlewares/authMiddleware');
const optionalAuth = require('../middlewares/optionalAuthMiddleware');
const admin = require('../middlewares/adminMiddleware');
const { createOrderValidator, createWhatsappOrderValidator, updateOrderStatusValidator, deleteOrderValidator, getOrderValidator } = require('../validators/orderValidators');
const validate = require('../middlewares/validate');

router.post('/whatsapp', createWhatsappOrderValidator, validate, c.createWhatsapp);
router.post('/', optionalAuth, createOrderValidator, validate, c.create);
router.get('/me', auth, c.listMine);
router.get('/me/stream', auth, c.streamMine);
router.get('/stream', auth, admin, c.streamAll);
router.get('/', auth, admin, c.listAll);
router.get('/:id', auth, getOrderValidator, validate, c.getById);
router.put('/:id', auth, admin, updateOrderStatusValidator, validate, c.updateStatus);
router.delete('/:id', auth, admin, deleteOrderValidator, validate, c.deleteOrder);

module.exports = router;
