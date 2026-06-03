const { body, param } = require('express-validator');
const { ORDER_STATUSES } = require('../models/Order');

const validStatuses = [...ORDER_STATUSES, 'concluído'];

const itemsPayloadValidator = body().custom((value) => {
  const items = value.items || value.itens;
  if (!Array.isArray(items)) throw new Error('Informe items ou itens');
  if (items.length < 1) throw new Error('Informe ao menos um item');

  for (const item of items) {
    const productId = item.productId || item.produtoId || item.id;
    const name = item.name || item.nome;
    const price = item.price ?? item.preco;
    const quantity = item.quantity || item.quantidade;
    if (!productId && (!name || price === undefined)) throw new Error('Cada item precisa de productId/id ou name/nome e price/preco');
    if (!quantity) throw new Error('Cada item precisa de quantity/quantidade');
  }
  return true;
});

const commonOrderValidators = [
  itemsPayloadValidator,
  body('items.*.id').optional().isMongoId(),
  body('items.*.productId').optional().isMongoId(),
  body('items.*.name').optional().isString().trim().notEmpty(),
  body('items.*.price').optional().isFloat({ min: 0 }),
  body('items.*.quantity').optional().isInt({ min: 1 }),
  body('items.*.category').optional().isString().trim(),
  body('itens.*.produtoId').optional().isMongoId(),
  body('itens.*.nome').optional().isString().trim().notEmpty(),
  body('itens.*.preco').optional().isFloat({ min: 0 }),
  body('itens.*.quantidade').optional().isInt({ min: 1 }),
  body('itens.*.categoria').optional().isString().trim(),
  body('total').optional().isFloat({ min: 0 }),
  body('valorTotal').optional().isFloat({ min: 0 }),
  body('address').optional().isObject(),
  body('endereco').optional().isObject(),
];

exports.createOrderValidator = commonOrderValidators;

exports.createWhatsappOrderValidator = [
  ...commonOrderValidators,
  body('customerName').optional().isString().trim(),
  body('customerPhone').optional().isString().trim(),
  body('phone').optional().isString().trim(),
  body('telefone').optional().isString().trim(),
  body('source').optional().equals('whatsapp'),
  body('status').optional().isIn(validStatuses),
];

exports.updateOrderStatusValidator = [
  param('id').isMongoId(),
  body().custom((value) => {
    if (value.status === undefined && value.total === undefined && value.valorTotal === undefined) throw new Error('Informe status ou total');
    return true;
  }),
  body('status').optional().isIn(validStatuses),
  body('total').optional().isFloat({ min: 0 }),
  body('valorTotal').optional().isFloat({ min: 0 }),
];

exports.deleteOrderValidator = [
  param('id').isMongoId(),
];
