const crypto = require('crypto');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const env = require('../config/env');
const WholesaleCategoryPrice = require('../models/WholesaleCategoryPrice');
const WholesaleConfig = require('../models/WholesaleConfig');
const { normalizeCategory, PRODUCT_CATEGORIES } = require('../models/Product');
const { normalizeStatus } = require('../models/Order');

const normalizeRequestItems = (body) => body.items || body.itens || [];
const wholesaleCategories = PRODUCT_CATEGORIES;
const CONFIRMED_STATUSES = ['pago', 'separando', 'saiu_para_entrega', 'entregue'];
const shouldApplyInventory = (status) => CONFIRMED_STATUSES.includes(normalizeStatus(status));

const createClientError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.expose = true;
  return error;
};

const getCustomerSnapshot = async (userId, body = {}) => {
  const user = await User.findById(userId).select('nome sobrenome telefone email');
  if (!user) return {};
  const customerName = body.customerName || body.name || body.nome || [user.nome, user.sobrenome].filter(Boolean).join(' ').trim() || user.email;
  const customerPhone = body.customerPhone || body.phone || body.telefone || user.telefone || '';
  return { customerName, customerPhone };
};

const getWholesaleConfig = async () => WholesaleConfig.findOneAndUpdate(
  { key: 'default' },
  { $setOnInsert: { key: 'default' } },
  { new: true, upsert: true, setDefaultsOnInsert: true }
);

const findProductByName = async (name) => {
  if (!name) return null;
  const escapedName = name.toString().trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Product.findOne({ nome: new RegExp(`^${escapedName}$`, 'i'), ativo: true });
};

const buildOrderItems = async (requestItems, options = {}) => {
  const { applyWholesale = true, preferRequestPrice = false } = options;
  const config = await getWholesaleConfig();
  const categoryRows = await WholesaleCategoryPrice.find();
  const categoryPrices = Object.fromEntries(categoryRows.map((row) => [row.category, row.price]));
  const rawItems = [];
  const categoryCounts = {};

  for (const item of requestItems) {
    const productId = item.productId || item.produtoId || item.id;
    const requestedName = item.name || item.nome;
    let product = null;
    if (productId) product = await Product.findById(productId);
    if (!product && requestedName) product = await findProductByName(requestedName);

    if (productId && (!product || !product.ativo)) {
      throw createClientError('Produto inválido/inativo');
    }

    const categoria = normalizeCategory(product?.categoria || item.category || item.categoria || '');
    const quantidade = Number(item.quantity || item.quantidade);
    const submittedPrice = item.price ?? item.preco;
    const precoOriginal = Number((preferRequestPrice && submittedPrice !== undefined) ? submittedPrice : (product?.preco ?? submittedPrice));

    rawItems.push({
      produtoId: product?._id || productId,
      nome: product?.nome || requestedName,
      quantidade,
      originalPrice: precoOriginal,
      imagem: product?.imagem || item.image || item.imagem || '',
      categoria,
      productWholesalePrice: product?.wholesalePrice,
    });

    categoryCounts[categoria] = (categoryCounts[categoria] || 0) + quantidade;
  }

  const itens = rawItems.map((item) => {
    const eligible = applyWholesale && wholesaleCategories.includes(item.categoria) && categoryCounts[item.categoria] >= config.threshold;
    const wholesalePrice = item.productWholesalePrice ?? categoryPrices[item.categoria] ?? (item.originalPrice * (1 - config.defaultDiscount));
    const preco = eligible ? Number(wholesalePrice.toFixed(2)) : item.originalPrice;
    return { ...item, preco, wholesaleApplied: eligible, productWholesalePrice: undefined };
  });

  const subtotal = rawItems.reduce((total, item) => total + item.originalPrice * item.quantidade, 0);
  const valorTotal = itens.reduce((total, item) => total + item.preco * item.quantidade, 0);
  const wholesaleDiscount = Math.max(0, subtotal - valorTotal);

  return { itens, subtotal, valorTotal, wholesaleDiscount };
};

const getInventoryItems = (orderOrItems) => (Array.isArray(orderOrItems) ? orderOrItems : orderOrItems.itens)
  .filter((item) => item.produtoId)
  .map((item) => ({ productId: item.produtoId, name: item.nome, quantity: Number(item.quantidade) }));

const assertStockAvailable = async (items, session) => {
  for (const item of getInventoryItems(items)) {
    const product = await Product.findById(item.productId).session(session).select('nome estoque');
    if (!product || product.estoque < item.quantity) {
      const productName = product?.nome || item.name || 'Produto';
      throw createClientError(`Produto ${productName} sem estoque suficiente`);
    }
  }
};

const adjustInventory = async (items, direction, session) => {
  for (const item of getInventoryItems(items)) {
    const delta = direction === 'decrement' ? -item.quantity : item.quantity;
    const filter = direction === 'decrement'
      ? { _id: item.productId, estoque: { $gte: item.quantity } }
      : { _id: item.productId };
    const result = await Product.updateOne(filter, { $inc: { estoque: delta } }, { session });
    if (direction === 'decrement' && result.modifiedCount !== 1) {
      const product = await Product.findById(item.productId).session(session).select('nome');
      throw createClientError(`Produto ${product?.nome || item.name || 'Produto'} sem estoque suficiente`);
    }
  }
};

const runInTransaction = async (work) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => { result = await work(session); });
    return result;
  } finally {
    await session.endSession();
  }
};

const buildOrderDate = (body) => {
  const dateInput = body.createdAt || body.data;
  if (!dateInput) return undefined;
  return new Date(dateInput);
};

exports.create = async (req, res, next) => {
  try {
    const order = await runInTransaction(async (session) => {
      const endereco = req.body.address || req.body.endereco || {};
      const isAdminExternal = req.user.role === 'admin' && req.body.source === 'external';
      const { itens, subtotal, valorTotal, wholesaleDiscount } = await buildOrderItems(normalizeRequestItems(req.body), { applyWholesale: !isAdminExternal, preferRequestPrice: isAdminExternal });
      const customerSnapshot = isAdminExternal
        ? {
          customerName: req.body.customerName || req.body.name || req.body.nome || '',
          customerPhone: req.body.customerPhone || req.body.phone || req.body.telefone || '',
        }
        : await getCustomerSnapshot(req.user.sub, req.body);
      const status = normalizeStatus(req.body.status || (isAdminExternal ? 'pago' : 'pendente'));
      const inventoryApplied = shouldApplyInventory(status);
      if (inventoryApplied) await assertStockAvailable(itens, session);
      if (inventoryApplied) await adjustInventory(itens, 'decrement', session);

      const requestedTotal = req.body.total ?? req.body.valorTotal;
      const finalTotal = isAdminExternal && requestedTotal !== undefined ? Number(requestedTotal) : valorTotal;
      const createdAt = isAdminExternal ? buildOrderDate(req.body) : undefined;
      const [createdOrder] = await Order.create([{
        usuario: isAdminExternal ? undefined : req.user.sub,
        ...customerSnapshot,
        source: isAdminExternal ? 'external' : 'site',
        status,
        inventoryApplied,
        itens,
        subtotal: isAdminExternal && requestedTotal !== undefined ? finalTotal : subtotal,
        valorTotal: finalTotal,
        wholesaleDiscount: isAdminExternal && requestedTotal !== undefined ? 0 : wholesaleDiscount,
        endereco,
        ...(createdAt ? { data: createdAt } : {}),
      }], { session });
      return createdOrder;
    });
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

    const order = await runInTransaction(async (session) => {
      const { itens, subtotal, valorTotal, wholesaleDiscount } = await buildOrderItems(normalizeRequestItems(req.body));
      const status = normalizeStatus(req.body.status || 'pendente');
      const inventoryApplied = shouldApplyInventory(status);
      if (inventoryApplied) await assertStockAvailable(itens, session);
      if (inventoryApplied) await adjustInventory(itens, 'decrement', session);

      const [createdOrder] = await Order.create([{
        customerName: req.body.customerName || req.body.nome || '',
        customerPhone: req.body.customerPhone || req.body.phone || req.body.telefone || '',
        source: 'whatsapp',
        status,
        inventoryApplied,
        itens,
        subtotal,
        valorTotal,
        wholesaleDiscount,
        endereco: req.body.address || req.body.endereco || {},
      }], { session });
      return createdOrder;
    });

    res.status(201).json(order);
  } catch (e) { next(e); }
};

exports.listMine = async (req, res, next) => {
  try { res.json(await Order.find({ usuario: req.user.sub }).populate('usuario', 'nome sobrenome telefone email').sort({ data: -1 })); } catch (e) { next(e); }
};

exports.streamMine = (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders?.();

  const send = async () => {
    try {
      const orders = await Order.find({ usuario: req.user.sub }).populate('usuario', 'nome sobrenome telefone email').sort({ data: -1 });
      res.write(`data: ${JSON.stringify(orders)}\n\n`);
    } catch (error) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
    }
  };

  send();
  const interval = setInterval(send, 15000);
  req.on('close', () => clearInterval(interval));
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
    const order = await runInTransaction(async (session) => {
      const existingOrder = await Order.findById(req.params.id).session(session);
      if (!existingOrder) return null;

      const update = {};
      const nextStatus = req.body.status !== undefined ? normalizeStatus(req.body.status) : existingOrder.status;
      if (req.body.status !== undefined) update.status = nextStatus;
      if (req.body.total !== undefined || req.body.valorTotal !== undefined) update.valorTotal = Number(req.body.total ?? req.body.valorTotal);

      if (nextStatus === 'cancelado' && existingOrder.inventoryApplied) {
        await adjustInventory(existingOrder, 'increment', session);
        update.inventoryApplied = false;
      } else if (shouldApplyInventory(nextStatus) && !existingOrder.inventoryApplied) {
        await assertStockAvailable(existingOrder, session);
        await adjustInventory(existingOrder, 'decrement', session);
        update.inventoryApplied = true;
      }

      return Order.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true, session });
    });
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });
    res.json(order);
  } catch (e) { next(e); }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await runInTransaction(async (session) => {
      const existingOrder = await Order.findById(req.params.id).session(session);
      if (!existingOrder) return null;
      if (existingOrder.inventoryApplied) await adjustInventory(existingOrder, 'increment', session);
      return Order.findByIdAndDelete(req.params.id, { session });
    });
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });
    res.json({ ok: true });
  } catch (e) { next(e); }
};
