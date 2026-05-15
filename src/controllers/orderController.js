const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

const normalizeRequestItems = (body) => body.items || body.itens || [];
const deliveredStatuses = ['entregue', 'concluido'];

const normalizeStatus = (status) => {
  if (status === 'concluído') return 'concluido';
  return status;
};

const calculateDefaultStamps = (items) => Math.max(1, items.reduce((total, item) => total + Number(item.quantidade || 0), 0));

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
  if (order.loyaltyApplied) return;
  const user = await User.findById(order.usuario);
  if (!user) return;
  addStampsAndConvertCredits(user, order.loyaltyStampsEarned || 0);
  await user.save();
  order.loyaltyApplied = true;
};

const reverseOrderLoyalty = async (order) => {
  if (order.loyaltyReversed) return;
  const user = await User.findById(order.usuario);
  if (!user) return;

  if (order.loyaltyApplied) removeStampsAndCredits(user, order.loyaltyStampsEarned || 0);
  if (order.loyaltyCreditsUsed > 0) user.loyaltyCredits = (user.loyaltyCredits || 0) + order.loyaltyCreditsUsed;

  await user.save();
  order.loyaltyReversed = true;
};

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
    const order = await Order.create({ usuario: req.user.sub, itens, valorTotal: total, endereco, loyaltyCreditsUsed, loyaltyStampsEarned });
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
