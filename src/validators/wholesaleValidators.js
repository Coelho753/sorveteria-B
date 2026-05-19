const { body } = require('express-validator');

exports.categoryPriceValidator = [
  body('category').isIn(['tub', 'pote', 'cup', 'copo', 'popsicle', 'picole', 'picolé']),
  body('price').isFloat({ min: 0 }),
];

exports.productPriceValidator = [
  body('productId').isMongoId(),
  body('price').isFloat({ min: 0 }),
];

exports.configValidator = [
  body('threshold').optional().isInt({ min: 1 }),
  body('defaultDiscount').optional().isFloat({ min: 0, max: 1 }),
  body('default_discount').optional().isFloat({ min: 0, max: 1 }),
];
