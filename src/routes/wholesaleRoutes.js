const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');
const validate = require('../middlewares/validate');
const c = require('../controllers/wholesaleController');
const v = require('../validators/wholesaleValidators');

router.use(auth, admin);
router.get('/', c.summary);
router.put('/category', v.categoryPriceValidator, validate, c.upsertCategory);
router.put('/product', v.productPriceValidator, validate, c.upsertProduct);
router.delete('/category/:cat', c.deleteCategory);
router.delete('/product/:id', c.deleteProduct);
router.get('/config', c.getConfig);
router.put('/config', v.configValidator, validate, c.updateConfig);

module.exports = router;
