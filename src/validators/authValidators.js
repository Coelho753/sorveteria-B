const { body } = require('express-validator');
const { validateStrongPassword } = require('./passwordRules');

exports.registerValidator = [
  body('nome').isString().trim().isLength({ min: 2, max: 120 }).matches(/^[^<>{}$`\\]+$/),
  body('sobrenome').optional().isString().trim().isLength({ max: 120 }),
  body('email').isEmail().isLength({ max: 255 }).normalizeEmail(),
  body('senha').isString().custom(validateStrongPassword),
  body('role').not().exists(),
  body('endereco').optional().isObject(),
];

exports.loginValidator = [body('email').isEmail().normalizeEmail(), body('senha').isString().notEmpty()];
exports.refreshValidator = [body('refreshToken').isString().notEmpty()];
