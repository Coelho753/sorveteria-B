const router = require('express').Router();
const c = require('../controllers/userController');
const auth = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');
const validate = require('../middlewares/validate');
const { adminUpdateUserValidator } = require('../validators/userValidators');

router.get('/me', auth, c.getMe);
router.put('/me', auth, c.updateMe);
router.get('/', auth, admin, c.listUsers);
router.put('/:id', auth, admin, adminUpdateUserValidator, validate, c.updateUser);

module.exports = router;
