const { body } = require('express-validator');

const hasAny = (value, fields) => fields.some((field) => value[field] !== undefined && value[field] !== null && value[field] !== '');

exports.productValidator = [
  body().custom((value, { req }) => {
    if (req.method === 'POST') {
      if (!hasAny(value, ['name', 'nome'])) throw new Error('Informe name ou nome');
      if (!hasAny(value, ['price', 'preco'])) throw new Error('Informe price ou preco');
      if (!hasAny(value, ['category', 'categoria'])) throw new Error('Informe category ou categoria');
    }
    return true;
  }),
  body('name').optional().isString().trim().notEmpty(),
  body('nome').optional().isString().trim().notEmpty(),
  body('description').optional().isString().trim(),
  body('descricao').optional().isString().trim(),
  body('price').optional().isFloat({ min: 0 }),
  body('preco').optional().isFloat({ min: 0 }),
  body('wholesalePrice').optional().isFloat({ min: 0 }),
  body('wholesale_price').optional().isFloat({ min: 0 }),
  body('image').optional().isString().trim(),
  body('imageUrl').optional().isString().trim(),
  body('imagem').optional().isString().trim(),
  body('category').optional().isIn(['tub', 'pote', 'cup', 'copo', 'popsicle', 'picole', 'picolé', 'acai', 'açaí']),
  body('categoria').optional().isIn(['tub', 'pote', 'cup', 'copo', 'popsicle', 'picole', 'picolé', 'acai', 'açaí']),
  body('size').optional().isString().trim(),
  body('tamanho').optional().isString().trim(),
  body('stock').optional().isInt({ min: 0 }),
  body('estoque').optional().isInt({ min: 0 }),
  body('active').optional().isBoolean(),
  body('ativo').optional().isBoolean(),
];
