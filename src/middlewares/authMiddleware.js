const { verifyAccessToken } = require('../config/jwt');
const { parseCookies } = require('./cookieUtils');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cookies = parseCookies(req.headers.cookie);
  const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const token = bearer || cookies.ayla_at;

  if (!token) return res.status(401).json({ message: 'Não autenticado' });

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ message: 'Não autenticado' });
  }
};
