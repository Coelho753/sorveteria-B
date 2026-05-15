const Order = require('../models/Order');

const buildDateRange = (query) => {
  const { period, startDate, endDate } = query;
  const now = new Date();
  const range = {};

  if (startDate) range.$gte = new Date(startDate);
  if (endDate) range.$lte = new Date(endDate);

  if (!startDate && period && period !== 'all' && period !== 'tudo') {
    const start = new Date(now);
    if (period === 'today' || period === 'hoje') start.setHours(0, 0, 0, 0);
    if (period === '7d') start.setDate(now.getDate() - 7);
    if (period === '30d') start.setDate(now.getDate() - 30);
    if (period === 'month' || period === 'mes' || period === 'mês') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    }
    range.$gte = start;
  }

  return Object.keys(range).length ? range : null;
};

exports.summary = async (req, res, next) => {
  try {
    const dateRange = buildDateRange(req.query);
    const match = { status: { $ne: 'cancelado' } };
    if (dateRange) match.data = dateRange;

    const [totals] = await Order.aggregate([
      { $match: match },
      { $group: { _id: null, totalVendas: { $sum: '$valorTotal' }, quantidadePedidos: { $sum: 1 } } },
      { $project: { _id: 0, totalVendas: 1, quantidadePedidos: 1, ticketMedio: { $cond: [{ $eq: ['$quantidadePedidos', 0] }, 0, { $divide: ['$totalVendas', '$quantidadePedidos'] }] } } },
    ]);

    const vendasPorDia = await Order.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$data' } }, total: { $sum: '$valorTotal' }, pedidos: { $sum: 1 } } },
      { $project: { _id: 0, date: '$_id', total: 1, pedidos: 1 } },
      { $sort: { date: 1 } },
    ]);

    const produtosMaisVendidos = await Order.aggregate([
      { $match: match },
      { $unwind: '$itens' },
      { $group: { _id: '$itens.produtoId', nome: { $first: '$itens.nome' }, quantidade: { $sum: '$itens.quantidade' }, total: { $sum: { $multiply: ['$itens.quantidade', '$itens.preco'] } } } },
      { $sort: { quantidade: -1 } },
      { $limit: 10 },
    ]);

    const totalVendas = totals?.totalVendas || 0;
    const quantidadePedidos = totals?.quantidadePedidos || 0;
    const ticketMedio = totals?.ticketMedio || 0;

    res.json({
      totalVendas,
      quantidadePedidos,
      ticketMedio,
      vendasPorPeriodo: { startDate: dateRange?.$gte || req.query.startDate || null, endDate: dateRange?.$lte || req.query.endDate || null, period: req.query.period || null },
      vendasPorDia,
      produtosMaisVendidos,
      totalSales: totalVendas,
      orderCount: quantidadePedidos,
      averageTicket: ticketMedio,
      salesByDay: vendasPorDia,
      topProducts: produtosMaisVendidos,
    });
  } catch (e) { next(e); }
};
