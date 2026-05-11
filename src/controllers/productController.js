const Product = require('../models/Product');

const normalizeProductInput = (body, withDefaults = false) => ({
  nome: body.nome ?? body.name,
  descricao: body.descricao ?? body.description ?? (withDefaults ? '' : undefined),
  preco: body.preco ?? body.price,
  imagem: body.imagem ?? body.image ?? body.imageUrl ?? (withDefaults ? '' : undefined),
  categoria: body.categoria ?? body.category,
  tamanho: body.tamanho ?? body.size ?? (withDefaults ? '' : undefined),
  estoque: body.estoque ?? body.stock ?? (withDefaults ? 0 : undefined),
  ativo: body.ativo ?? body.active ?? (withDefaults ? true : undefined),
});

exports.create = async (req, res, next) => {
  try {
    const product = await Product.create(normalizeProductInput(req.body, true));
    res.status(201).json(product);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const update = normalizeProductInput(req.body);
    Object.keys(update).forEach((key) => update[key] === undefined && delete update[key]);
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json(product);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
    res.status(204).send();
  } catch (e) { next(e); }
};

exports.listAll = async (req, res, next) => { try { res.json(await Product.find().sort({ categoria: 1, nome: 1 })); } catch (e) { next(e); } };
exports.listActive = async (req, res, next) => { try { res.json(await Product.find({ ativo: true }).sort({ categoria: 1, nome: 1 })); } catch (e) { next(e); } };
