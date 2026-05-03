const router = require('express').Router();
const c = require('../controllers/productController');
const auth = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');
const { productValidator } = require('../validators/productValidators');
const validate = require('../middlewares/validate');

router.get('/ativos', c.listActive);
router.get('/', auth, admin, c.listAll);
router.post('/', auth, admin, productValidator, validate, c.create);
router.put('/:id', auth, admin, productValidator, validate, c.update);
router.delete('/:id', auth, admin, c.remove);

module.exports = router;
