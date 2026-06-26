const { verifyAccessToken } = require('../config/jwt');
const { parseCookies } = require('./cookieUtils');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cookies = parseCookies(req.headers.cookie);
  const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const token = bearer || cookies.ayla_at;

  if (!token) return next();

  try {
    const decoded = verifyAccessToken(token);
    req.user = { ...decoded, id: decoded.id || decoded.sub };
  } catch {
    // Pedido anônimo continua permitido; rotas protegidas usam requireAuth.
  }
  next();
};
