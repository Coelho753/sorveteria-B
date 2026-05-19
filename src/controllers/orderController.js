const crypto = require('crypto');
const Product = require('../models/Product');
const Order = require('../models/Order');
const env = require('../config/env');
const WholesaleCategoryPrice = require('../models/WholesaleCategoryPrice');
const WholesaleConfig = require('../models/WholesaleConfig');
const { normalizeCategory } = require('../models/Product');

const normalizeRequestItems = (body) => body.items || body.itens || [];
const wholesaleCategories = ['tub', 'cup', 'popsicle'];

const normalizeStatus = (status) => (status === 'concluído' ? 'concluido' : status);

const getWholesaleConfig = async () => WholesaleConfig.findOneAndUpdate(
  { key: 'default' },
  { $setOnInsert: { key: 'default' } },
  { new: true, upsert: true, setDefaultsOnInsert: true }
);

const buildOrderItems = async (requestItems) => {
  const config = await getWholesaleConfig();
  const categoryRows = await WholesaleCategoryPrice.find();
  const categoryPrices = Object.fromEntries(categoryRows.map((row) => [row.category, row.price]));
  const rawItems = [];
  const categoryCounts = {};

  for (const item of requestItems) {
    const productId = item.productId || item.produtoId || item.id;
    let product = null;
    if (productId) product = await Product.findById(productId);

    if (productId && (!product || !product.ativo)) {
      const error = new Error('Produto inválido/inativo');
      error.statusCode = 400;
      throw error;
    }

    const categoria = normalizeCategory(product?.categoria || item.category || item.categoria || '');
    const quantidade = Number(item.quantity || item.quantidade);
    const precoOriginal = Number(product?.preco ?? item.price ?? item.preco);

    rawItems.push({
      produtoId: product?._id || productId,
      nome: product?.nome || item.name || item.nome,
      quantidade,
      originalPrice: precoOriginal,
      imagem: product?.imagem || item.image || item.imagem || '',
      categoria,
      productWholesalePrice: product?.wholesalePrice,
    });

    categoryCounts[categoria] = (categoryCounts[categoria] || 0) + quantidade;
  }

  const itens = rawItems.map((item) => {
    const eligible = wholesaleCategories.includes(item.categoria) && categoryCounts[item.categoria] >= config.threshold;
    const wholesalePrice = item.productWholesalePrice ?? categoryPrices[item.categoria] ?? (item.originalPrice * (1 - config.defaultDiscount));
    const preco = eligible ? Number(wholesalePrice.toFixed(2)) : item.originalPrice;
    return { ...item, preco, wholesaleApplied: eligible, productWholesalePrice: undefined };
  });

  const subtotal = rawItems.reduce((total, item) => total + item.originalPrice * item.quantidade, 0);
  const valorTotal = itens.reduce((total, item) => total + item.preco * item.quantidade, 0);
  const wholesaleDiscount = Math.max(0, subtotal - valorTotal);

  return { itens, subtotal, valorTotal, wholesaleDiscount };
};

exports.create = async (req, res, next) => {
  try {
    const { itens, subtotal, valorTotal, wholesaleDiscount } = await buildOrderItems(normalizeRequestItems(req.body));
    const endereco = req.body.address || req.body.endereco || {};
    const order = await Order.create({ usuario: req.user.sub, source: 'site', itens, subtotal, valorTotal, wholesaleDiscount, endereco });
    res.status(201).json(order);
  } catch (e) { next(e); }
};

exports.createWhatsapp = async (req, res, next) => {
  try {
    if (!env.whatsappWebhookSecret) return res.status(503).json({ message: 'Webhook WhatsApp não configurado' });
    const signature = req.headers['x-ayla-signature'];
    if (!signature || !req.rawBody) return res.status(401).json({ message: 'Assinatura inválida' });
    const expected = crypto.createHmac('sha256', env.whatsappWebhookSecret).update(req.rawBody).digest('hex');
    const valid = signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!valid) return res.status(401).json({ message: 'Assinatura inválida' });

    const { itens, subtotal, valorTotal, wholesaleDiscount } = await buildOrderItems(normalizeRequestItems(req.body));
    const order = await Order.create({
      customerName: req.body.customerName || req.body.nome || '',
      customerPhone: req.body.customerPhone || req.body.phone || req.body.telefone || '',
      source: 'whatsapp',
      status: normalizeStatus(req.body.status || 'pendente'),
      itens,
      subtotal,
      valorTotal,
      wholesaleDiscount,
      endereco: req.body.address || req.body.endereco || {},
    });

    res.status(201).json(order);
  } catch (e) { next(e); }
};

exports.listMine = async (req, res, next) => {
  try { res.json(await Order.find({ usuario: req.user.sub }).sort({ data: -1 })); } catch (e) { next(e); }
};

exports.listAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.userId) filter.usuario = req.query.userId;
    if (req.query.source) filter.source = req.query.source;
    if (req.query.status) filter.status = normalizeStatus(req.query.status);
    res.json(await Order.find(filter).populate('usuario', 'nome sobrenome telefone email').sort({ data: -1 }));
  } catch (e) { next(e); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { $set: { status: normalizeStatus(req.body.status) } }, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });
    res.json(order);
  } catch (e) { next(e); }
};
