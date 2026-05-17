const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const env = require('../config/env');

const normalizeRequestItems = (body) => body.items || body.itens || [];
const deliveredStatuses = ['entregue', 'concluido'];
const tubCategories = ['tub', 'pote'];

const normalizeStatus = (status) => {
  if (status === 'concluído') return 'concluido';
  return status;
};

const normalizeCategory = (category) => (category || '').toString().trim().toLowerCase();

const isTubItem = (item) => tubCategories.includes(normalizeCategory(item.categoria || item.category));

const calculateDefaultStamps = (items) => items.reduce((total, item) => {
  if (!isTubItem(item)) return total;
  return total + Number(item.quantidade || item.quantity || 0);
}, 0);

const addStampsAndConvertCredits = (user, stamps) => {
  user.loyaltyStamps = Math.max(0, (user.loyaltyStamps || 0) + stamps);
  const newCredits = Math.floor(user.loyaltyStamps / 10);
  user.loyaltyCredits = (user.loyaltyCredits || 0) + newCredits;
  user.loyaltyStamps %= 10;
};

const removeStampsAndCredits = (user, stamps) => {
  let remainingStamps = user.loyaltyStamps || 0;
  let remainingCredits = user.loyaltyCredits || 0;

  while (remainingStamps < stamps && remainingCredits > 0) {
    remainingCredits -= 1;
    remainingStamps += 10;
  }

  user.loyaltyStamps = Math.max(0, remainingStamps - stamps);
  user.loyaltyCredits = Math.max(0, remainingCredits);
};

const applyDeliveredLoyalty = async (order) => {
  if (order.loyaltyApplied || !order.usuario) return;
  const user = await User.findById(order.usuario);
  if (!user) return;
  addStampsAndConvertCredits(user, order.loyaltyStampsEarned || 0);
  await user.save();
  order.loyaltyApplied = true;
};

const reverseOrderLoyalty = async (order) => {
  if (order.loyaltyReversed || !order.usuario) return;
  const user = await User.findById(order.usuario);
  if (!user) return;

  if (order.loyaltyApplied) removeStampsAndCredits(user, order.loyaltyStampsEarned || 0);
  if (order.loyaltyCreditsUsed > 0) user.loyaltyCredits = (user.loyaltyCredits || 0) + order.loyaltyCreditsUsed;

  await user.save();
  order.loyaltyReversed = true;
};

const buildOrderItems = async (requestItems) => {
  const itens = [];
  let valorTotal = 0;

  for (const item of requestItems) {
    const productId = item.productId || item.produtoId || item.id;
    let product = null;
    if (productId) product = await Product.findById(productId);

    if (productId && (!product || !product.ativo)) {
      const error = new Error('Produto inválido/inativo');
      error.statusCode = 400;
      throw error;
    }

    const nome = product?.nome || item.name || item.nome;
    const preco = product?.preco ?? item.price ?? item.preco;
    const quantidade = item.quantity || item.quantidade;
    const imagem = product?.imagem || item.image || item.imagem || '';
    const categoria = product?.categoria || item.category || item.categoria || '';

    itens.push({ produtoId: product?._id || productId, nome, quantidade, preco, imagem, categoria });
    valorTotal += preco * quantidade;
  }

  return { itens, valorTotal };
};

exports.create = async (req, res, next) => {
  try {
    const requestItems = normalizeRequestItems(req.body);
    const { itens, valorTotal } = await buildOrderItems(requestItems);

    const loyaltyCreditsUsed = Number(req.body.loyaltyCreditsUsed || 0);
    if (loyaltyCreditsUsed > 0) {
      const user = await User.findById(req.user.sub);
      if (!user || (user.loyaltyCredits || 0) < loyaltyCreditsUsed) return res.status(400).json({ message: 'Créditos de fidelidade insuficientes' });
      user.loyaltyCredits -= loyaltyCreditsUsed;
      await user.save();
    }

    const total = req.body.total ?? req.body.valorTotal ?? valorTotal;
    const endereco = req.body.address || req.body.endereco || {};
    const loyaltyStampsEarned = Number(req.body.loyaltyStampsEarned ?? calculateDefaultStamps(itens));
    const order = await Order.create({
      usuario: req.user.sub,
      source: 'site',
      itens,
      valorTotal: total,
      endereco,
      loyaltyCreditsUsed,
      loyaltyStampsEarned,
    });
    res.status(201).json(order);
  } catch (e) { next(e); }
};

exports.createWhatsapp = async (req, res, next) => {
  try {
    if (!env.whatsappWebhookSecret) return res.status(503).json({ message: 'Webhook WhatsApp não configurado' });
    if (req.headers['x-webhook-secret'] !== env.whatsappWebhookSecret) return res.status(401).json({ message: 'Webhook secret inválido' });

    const requestItems = normalizeRequestItems(req.body);
    const { itens, valorTotal } = await buildOrderItems(requestItems);
    const order = await Order.create({
      customerName: req.body.customerName || req.body.nome || '',
      customerPhone: req.body.customerPhone || req.body.phone || req.body.telefone || '',
      source: 'whatsapp',
      status: normalizeStatus(req.body.status || 'pendente'),
      itens,
      valorTotal: req.body.total ?? req.body.valorTotal ?? valorTotal,
      endereco: req.body.address || req.body.endereco || {},
      loyaltyStampsEarned: Number(req.body.loyaltyStampsEarned ?? 0),
    });

    res.status(201).json(order);
  } catch (e) { next(e); }
};

exports.listMine = async (req, res, next) => {
  try {
    res.json(await Order.find({ usuario: req.user.sub }).sort({ data: -1 }));
  } catch (e) { next(e); }
};

exports.listAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.userId) filter.usuario = req.query.userId;
    if (req.query.source) filter.source = req.query.source;
    if (req.query.status) filter.status = normalizeStatus(req.query.status);
    res.json(await Order.find(filter).populate('usuario', 'nome sobrenome telefone email loyaltyStamps loyaltyCredits').sort({ data: -1 }));
  } catch (e) { next(e); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const status = normalizeStatus(req.body.status);
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    order.status = status;
    if (deliveredStatuses.includes(status)) await applyDeliveredLoyalty(order);
    if (status === 'cancelado') await reverseOrderLoyalty(order);

    await order.save();
    res.json(order);
  } catch (e) { next(e); }
};
