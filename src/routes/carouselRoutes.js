const router = require('express').Router();
const c = require('../controllers/carouselController');
const auth = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');
const validate = require('../middlewares/validate');
const { carouselKeyValidator, replaceCarouselValidator } = require('../validators/carouselValidators');

router.get('/', c.list);
router.get('/:key', carouselKeyValidator, validate, c.getByKey);
router.put('/:key', auth, admin, replaceCarouselValidator, validate, c.replace);

module.exports = router;
