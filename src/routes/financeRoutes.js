const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');
const c = require('../controllers/financeController');

router.get('/', auth, admin, c.summary);

module.exports = router;
