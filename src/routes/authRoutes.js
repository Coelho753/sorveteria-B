const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const c = require('../controllers/authController');
const v = require('../validators/authValidators');
const validate = require('../middlewares/validate');
const auth = require('../middlewares/authMiddleware');

router.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));
router.post('/register', v.registerValidator, validate, c.register);
router.post('/login', v.loginValidator, validate, c.login);
router.post('/refresh', v.refreshValidator, validate, c.refresh);
router.post('/logout', c.logout);
router.get('/me', auth, c.me);

module.exports = router;
