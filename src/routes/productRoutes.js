const router = require('express').Router();
const c = require('../controllers/productController');
const auth = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');
const { productIdValidator, productValidator, stockValidator } = require('../validators/productValidators');
const validate = require('../middlewares/validate');

router.get('/', c.listActive);
router.get('/ativos', c.listActive);
router.get('/admin/todos', auth, admin, c.listAll);
router.get('/:id', productIdValidator, validate, c.getById);
router.post('/', auth, admin, productValidator, validate, c.create);
router.patch('/:id/stock', auth, admin, stockValidator, validate, c.adjustStock);
router.put('/:id', auth, admin, productValidator, validate, c.update);
router.delete('/:id', auth, admin, c.remove);

module.exports = router;
