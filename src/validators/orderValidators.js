const { body } = require('express-validator');

exports.createOrderValidator = [
  body().custom((value) => {
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
  }),
  body('items.*.id').optional().isMongoId(),
  body('items.*.productId').optional().isMongoId(),
  body('items.*.name').optional().isString().trim().notEmpty(),
  body('items.*.price').optional().isFloat({ min: 0 }),
  body('items.*.quantity').optional().isInt({ min: 1 }),
  body('itens.*.produtoId').optional().isMongoId(),
  body('itens.*.nome').optional().isString().trim().notEmpty(),
  body('itens.*.preco').optional().isFloat({ min: 0 }),
  body('itens.*.quantidade').optional().isInt({ min: 1 }),
  body('total').optional().isFloat({ min: 0 }),
  body('valorTotal').optional().isFloat({ min: 0 }),
  body('address').optional().isObject(),
  body('endereco').optional().isObject(),
];
