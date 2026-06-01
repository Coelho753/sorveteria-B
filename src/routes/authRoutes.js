const router = require('express').Router();
const passport = require('../config/passport');
const env = require('../config/env');
const c = require('../controllers/authController');
const v = require('../validators/authValidators');
const validate = require('../middlewares/validate');

router.post('/register', v.registerValidator, validate, c.register);
router.post('/login', v.loginValidator, validate, c.login);
router.post('/refresh', v.refreshValidator, validate, c.refresh);
router.post('/logout', v.refreshValidator, validate, c.logout);

router.get('/google', (req, res, next) => {
  if (!env.googleOAuthEnabled) return res.status(503).json({ message: 'Login com Google não configurado' });
  const redirect = req.query.redirect || '/';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state: redirect,
  })(req, res, next);
});

router.get(
  '/google/callback',
  (req, res, next) => {
    if (!env.googleOAuthEnabled) return res.status(503).json({ message: 'Login com Google não configurado' });
    req.authRedirect = req.query.state || '/';
    next();
  },
  passport.authenticate('google', { session: false, failureRedirect: '/auth/google/failure' }),
  c.googleCallback
);

router.get('/google/failure', (req, res) => res.status(401).json({ message: 'Falha na autenticação com Google' }));

module.exports = router;
