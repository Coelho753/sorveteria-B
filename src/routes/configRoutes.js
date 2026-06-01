const router = require('express').Router();
const c = require('../controllers/configController');

router.get('/public', c.publicConfig);

module.exports = router;
