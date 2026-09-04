const router = require('express').Router();
const userController = require('../controllers/userController');
const financeController = require('../controllers/financeController');
const auth = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');
const validate = require('../middlewares/validate');
const { patchRoleValidator } = require('../validators/userValidators');

router.get('/financial-summary', auth, admin, financeController.adminFinancialSummary);
router.patch('/users/:id/role', auth, admin, patchRoleValidator, validate, userController.patchRole);

module.exports = router;
