const router = require('express').Router();
const userController = require('../controllers/userController');
const financeController = require('../controllers/financeController');
const auth = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');
const validate = require('../middlewares/validate');
const { patchRoleValidator } = require('../validators/userValidators');

router.get('/financial-summary', auth, admin, financeController.adminFinancialSummary);
router.patch('/users/:id/role', auth, admin, patchRoleValidator, validate, userController.patchRole);

// Rota de emergência: promove um e-mail a admin usando um segredo compartilhado
// (ADMIN_BOOTSTRAP_SECRET), sem precisar de login/admin prévio. Ver PRODUTOS_BACKEND.md.
router.post('/bootstrap-role', userController.bootstrapRole);

module.exports = router;
