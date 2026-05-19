const { logError } = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
  logError(err);
  const status = err.statusCode || err.status || 500;
  const safeMessage = err.expose && status < 500 ? err.message : 'Erro interno';
  res.status(status).json({ message: safeMessage });
};

module.exports = errorMiddleware;
