const { body } = require('express-validator');

exports.cartValidator = [
  body('items').isArray(),
  body('items.*').custom((item) => {
    if (!item.id && !item.productId) throw new Error('Cada item do carrinho precisa de id ou productId');
    return true;
  }),
  body('items.*.id').optional().isMongoId(),
  body('items.*.productId').optional().isMongoId(),
  body('items.*.name').isString().trim().notEmpty(),
  body('items.*.price').isFloat({ min: 0 }),
  body('items.*.quantity').isInt({ min: 1 }),
  body('items.*.image').optional().isString(),
];
