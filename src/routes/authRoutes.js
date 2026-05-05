const router = require('express').Router();
const c = require('../controllers/authController');
const v = require('../validators/authValidators');
const validate = require('../middlewares/validate');

router.post('/register', v.registerValidator, validate, c.register);
router.post('/login', v.loginValidator, validate, c.login);
router.post('/refresh', v.refreshValidator, validate, c.refresh);
router.post('/logout', v.refreshValidator, validate, c.logout);

module.exports = router;
