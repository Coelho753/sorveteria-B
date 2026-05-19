const router = require('express').Router();
const c = require('../controllers/cartController');
const auth = require('../middlewares/authMiddleware');
const { cartValidator } = require('../validators/cartValidators');
const validate = require('../middlewares/validate');

router.get('/', auth, c.getCart);
router.put('/', auth, cartValidator, validate, c.replaceCart);
router.delete('/', auth, c.clearCart);

module.exports = router;
