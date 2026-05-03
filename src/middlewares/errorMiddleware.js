const { logError } = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
  logError(err);
  res.status(err.statusCode || 500).json({ message: err.message || 'Erro interno do servidor' });
};

module.exports = errorMiddleware;
