const Order = require('../models/Order');

const FINANCIAL_STATUSES = ['pago', 'separando', 'saiu_para_entrega', 'entregue', 'preparando', 'enviado'];

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
    const match = { status: { $in: FINANCIAL_STATUSES } };
    if (dateRange) match.data = dateRange;
    if (req.query.source) match.source = req.query.source;

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

    const totalsBySource = await Order.aggregate([
      { $match: match },
      { $unwind: { path: '$itens', preserveNullAndEmptyArrays: true } },
      { $group: { _id: { orderId: '$_id', source: '$source' }, value: { $first: '$valorTotal' }, itemsQty: { $sum: '$itens.quantidade' } } },
      { $group: { _id: '$_id.source', value: { $sum: '$value' }, itemsQty: { $sum: '$itemsQty' } } },
    ]);

    const statusCounts = await Order.aggregate([
      { $match: dateRange ? { data: dateRange } : {} },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const getSource = (source) => totalsBySource.find((row) => row._id === source) || {};
    const delivered = statusCounts.find((row) => row._id === 'entregue')?.count || 0;
    const cancelled = statusCounts.find((row) => row._id === 'cancelado')?.count || 0;

    const totalVendas = totals?.totalVendas || 0;
    const quantidadePedidos = totals?.quantidadePedidos || 0;
    const ticketMedio = totals?.ticketMedio || 0;

    res.json({
      total: totalVendas,
      ordersTotal: (getSource('app').value || 0) + (getSource('site').value || 0) + (getSource('whatsapp').value || 0),
      externalTotal: getSource('external').value || 0,
      appItemsQty: (getSource('app').itemsQty || 0) + (getSource('site').itemsQty || 0) + (getSource('whatsapp').itemsQty || 0),
      externalItemsQty: getSource('external').itemsQty || 0,
      delivered,
      cancelled,
      ticket: ticketMedio,
      count: quantidadePedidos,
      series: vendasPorDia.map((row) => ({ day: row.date, value: row.total })),
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


exports.adminFinancialSummary = async (req, res, next) => {
  try {
    const dateRange = buildDateRange(req.query);
    const match = { status: { $in: FINANCIAL_STATUSES } };
    if (dateRange) match.data = dateRange;
    if (req.query.source) match.source = req.query.source;

    const [totals] = await Order.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$valorTotal' }, count: { $sum: 1 } } },
      { $project: { _id: 0, total: 1, count: 1, ticket: { $cond: [{ $eq: ['$count', 0] }, 0, { $divide: ['$total', '$count'] }] } } },
    ]);

    const byDay = await Order.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$data' } }, value: { $sum: '$valorTotal' }, count: { $sum: 1 } } },
      { $project: { _id: 0, day: '$_id', value: 1, count: 1 } },
      { $sort: { day: 1 } },
    ]);

    const topProducts = await Order.aggregate([
      { $match: match },
      { $unwind: '$itens' },
      { $group: { _id: '$itens.nome', name: { $first: '$itens.nome' }, qty: { $sum: '$itens.quantidade' }, revenue: { $sum: { $multiply: ['$itens.quantidade', '$itens.preco'] } } } },
      { $project: { _id: 0, name: 1, qty: 1, revenue: 1 } },
      { $sort: { qty: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      total: totals?.total || 0,
      ticket: totals?.ticket || 0,
      count: totals?.count || 0,
      byDay,
      topProducts,
    });
  } catch (e) { next(e); }
};
