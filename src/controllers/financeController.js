const Order = require('../models/Order');

exports.summary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate || endDate) {
      match.data = {};
      if (startDate) match.data.$gte = new Date(startDate);
      if (endDate) match.data.$lte = new Date(endDate);
    }

    const [totals] = await Order.aggregate([
      { $match: match },
      { $group: { _id: null, totalVendas: { $sum: '$valorTotal' }, quantidadePedidos: { $sum: 1 } } },
      { $project: { _id: 0, totalVendas: 1, quantidadePedidos: 1, ticketMedio: { $cond: [{ $eq: ['$quantidadePedidos', 0] }, 0, { $divide: ['$totalVendas', '$quantidadePedidos'] }] } } },
    ]);

    const produtosMaisVendidos = await Order.aggregate([
      { $match: match },
      { $unwind: '$itens' },
      { $group: { _id: '$itens.produtoId', nome: { $first: '$itens.nome' }, quantidade: { $sum: '$itens.quantidade' } } },
      { $sort: { quantidade: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      totalVendas: totals?.totalVendas || 0,
      quantidadePedidos: totals?.quantidadePedidos || 0,
      ticketMedio: totals?.ticketMedio || 0,
      vendasPorPeriodo: { startDate: startDate || null, endDate: endDate || null },
      produtosMaisVendidos,
    });
  } catch (e) { next(e); }
};
