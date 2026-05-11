const router = require('express').Router();
const c = require('../controllers/orderController');
const auth = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');
const { createOrderValidator } = require('../validators/orderValidators');
const validate = require('../middlewares/validate');

router.post('/', auth, createOrderValidator, validate, c.create);
router.get('/me', auth, c.listMine);
router.get('/', auth, admin, c.listAll);

module.exports = router;
