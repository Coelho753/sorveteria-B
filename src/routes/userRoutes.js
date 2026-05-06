const router = require('express').Router();
const c = require('../controllers/userController');
const auth = require('../middlewares/authMiddleware');

router.get('/me', auth, c.getMe);
router.put('/me', auth, c.updateMe);

module.exports = router;
