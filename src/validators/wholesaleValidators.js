const { body } = require('express-validator');
const { PRODUCT_CATEGORIES } = require('../models/Product');

const ACCEPTED_CATEGORY_VALUES = [...PRODUCT_CATEGORIES, 'copo', 'picole', 'picolé', 'açaí'];

exports.categoryPriceValidator = [
  body('category').isIn(ACCEPTED_CATEGORY_VALUES),
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
