const { body } = require('express-validator');

exports.adminUpdateUserValidator = [
  body('name').optional().isString().trim().notEmpty(),
  body('nome').optional().isString().trim().notEmpty(),
  body('firstName').optional().isString().trim().notEmpty(),
  body('lastName').optional().isString().trim(),
  body('sobrenome').optional().isString().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isString().trim(),
  body('telefone').optional().isString().trim(),
  body('role').optional().isIn(['user', 'admin']),
  body('address').optional().isObject(),
  body('endereco').optional().isObject(),
  body('loyaltyStamps').optional().isInt({ min: 0 }),
  body('loyaltyCredits').optional().isInt({ min: 0 }),
];
