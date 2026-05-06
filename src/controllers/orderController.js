const Product = require('../models/Product');
const Order = require('../models/Order');

const normalizeRequestItems = (body) => body.items || body.itens || [];

exports.create = async (req, res, next) => {
  try {
    const requestItems = normalizeRequestItems(req.body);
    const itens = [];
    let valorTotal = 0;

    for (const item of requestItems) {
      const productId = item.productId || item.produtoId || item.id;
      let product = null;
      if (productId) product = await Product.findById(productId);

      if (productId && (!product || !product.ativo)) return res.status(400).json({ message: 'Produto inválido/inativo' });

      const nome = product?.nome || item.name || item.nome;
      const preco = product?.preco ?? item.price ?? item.preco;
      const quantidade = item.quantity || item.quantidade;
      const imagem = product?.imagem || item.image || item.imagem || '';

      itens.push({ produtoId: product?._id || productId, nome, quantidade, preco, imagem });
      valorTotal += preco * quantidade;
    }

    const total = req.body.total ?? req.body.valorTotal ?? valorTotal;
    const endereco = req.body.address || req.body.endereco || {};
    const order = await Order.create({ usuario: req.user.sub, itens, valorTotal: total, endereco });
    res.status(201).json(order);
  } catch (e) { next(e); }
};

exports.listMine = async (req, res, next) => { try { res.json(await Order.find({ usuario: req.user.sub }).sort({ data: -1 })); } catch (e) { next(e); } };
exports.listAll = async (req, res, next) => { try { res.json(await Order.find().populate('usuario', 'nome sobrenome email').sort({ data: -1 })); } catch (e) { next(e); } };
