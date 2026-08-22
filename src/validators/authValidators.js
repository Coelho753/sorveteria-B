const { body } = require('express-validator');
const { validateStrongPassword } = require('./passwordRules');

exports.registerValidator = [
  body().custom((value) => {
    if (!value.nome && !value.name) throw new Error('Informe nome ou name');
    if (!value.senha && !value.password) throw new Error('Informe senha ou password');
    return true;
  }),
  body('nome').optional().isString().trim().isLength({ min: 2, max: 120 }).matches(/^[^<>{}$`\\]+$/),
  body('name').optional().isString().trim().isLength({ min: 2, max: 120 }).matches(/^[^<>{}$`\\]+$/),
  body('sobrenome').optional().isString().trim().isLength({ max: 120 }),
  body('email').isEmail().isLength({ max: 255 }).normalizeEmail(),
  body('senha').optional().isString().custom(validateStrongPassword),
  body('password').optional().isString().custom(validateStrongPassword),
  body('role').not().exists(),
  body('endereco').optional().isObject(),
  body('address').optional().isObject(),
  body('telefone').optional().isString().trim(),
  body('phone').optional().isString().trim(),
];

exports.loginValidator = [
  body('email').isEmail().normalizeEmail(),
  body().custom((value) => {
    if (!value.senha && !value.password) throw new Error('Informe senha ou password');
    return true;
  }),
  body('senha').optional().isString().notEmpty(),
  body('password').optional().isString().notEmpty(),
];
exports.refreshValidator = [body('refreshToken').isString().notEmpty()];
