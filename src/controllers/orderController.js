const Product = require('../models/Product');
const Order = require('../models/Order');

exports.create = async (req, res, next) => {
  try {
    const itens = [];
    let valorTotal = 0;
    for (const item of req.body.itens) {
      const product = await Product.findById(item.produtoId);
      if (!product || !product.ativo) return res.status(400).json({ message: 'Produto inválido/inativo' });
      const preco = product.preco;
      itens.push({ produtoId: product._id, nome: product.nome, quantidade: item.quantidade, preco });
      valorTotal += preco * item.quantidade;
    }
    const order = await Order.create({ usuario: req.user.sub, itens, valorTotal });
    res.status(201).json(order);
  } catch (e) { next(e); }
};

exports.listMine = async (req, res, next) => { try { res.json(await Order.find({ usuario: req.user.sub })); } catch (e) { next(e); } };
exports.listAll = async (req, res, next) => { try { res.json(await Order.find().populate('usuario', 'nome email')); } catch (e) { next(e); } };
