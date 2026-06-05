const router = require('express').Router();
const c = require('../controllers/userController');
const auth = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');
const validate = require('../middlewares/validate');
const { adminUpdateUserValidator, deleteUserValidator, patchRoleValidator } = require('../validators/userValidators');

router.get('/me', auth, c.getMe);
router.put('/me', auth, c.updateMe);
router.get('/', auth, admin, c.listUsers);
router.put('/:id', auth, adminUpdateUserValidator, validate, c.updateUser);
router.delete('/:id', auth, admin, deleteUserValidator, validate, c.deleteUser);
router.patch('/admin/users/:id/role', auth, admin, patchRoleValidator, validate, c.patchRole);

module.exports = router;
