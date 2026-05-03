const { body } = require('express-validator');

exports.createOrderValidator = [
  body('itens').isArray({ min: 1 }),
  body('itens.*.produtoId').isMongoId(),
  body('itens.*.quantidade').isInt({ min: 1 }),
];
