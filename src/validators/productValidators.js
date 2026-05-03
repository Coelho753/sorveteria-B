const { body } = require('express-validator');

exports.productValidator = [
  body('nome').isString().trim().notEmpty(),
  body('descricao').isString().trim().notEmpty(),
  body('preco').isFloat({ gt: 0 }),
  body('imagem').isString().notEmpty(),
  body('categoria').isString().trim().notEmpty(),
  body('estoque').isInt({ min: 0 }),
  body('ativo').optional().isBoolean(),
];
