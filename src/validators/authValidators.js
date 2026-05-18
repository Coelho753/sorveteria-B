const { body } = require('express-validator');

exports.registerValidator = [
  body('nome').isString().trim().notEmpty(),
  body('sobrenome').optional().isString().trim(),
  body('email').isEmail().normalizeEmail(),
  body('senha').isLength({ min: 6 }),
  body('endereco').optional().isObject(),
];

exports.loginValidator = [body('email').isEmail().normalizeEmail(), body('senha').isString().notEmpty()];
exports.refreshValidator = [body('refreshToken').isString().notEmpty()];
