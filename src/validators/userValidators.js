const { body, param } = require('express-validator');
const { validateStrongPassword } = require('./passwordRules');

exports.adminUpdateUserValidator = [
  param('id').isMongoId(),
  body('name').optional().isString().trim().notEmpty(),
  body('nome').optional().isString().trim().notEmpty(),
  body('firstName').optional().isString().trim().notEmpty(),
  body('lastName').optional().isString().trim(),
  body('sobrenome').optional().isString().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isString().trim(),
  body('telefone').optional().isString().trim(),
  body('role').optional().isIn(['user', 'admin']),
  body('password').optional().isString().custom(validateStrongPassword),
  body('senha').optional().isString().custom(validateStrongPassword),
  body('address').optional().isObject(),
  body('endereco').optional().isObject(),
];


exports.patchRoleValidator = [
  body('role').isIn(['user', 'admin']),
];

exports.deleteUserValidator = [
  param('id').isMongoId(),
];
