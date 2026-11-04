import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Expense from '../models/Expense.js';
import Request from '../models/Request.js';
import Message from '../models/Message.js';
import { asyncHandler } from '../utils/helpers.js';
import { requirePermission, requireStaff } from '../middleware/auth.js';
import { crudRouter } from './crud.js';

const r = Router();
const round = (n) => Math.round((n || 0) * 100) / 100;

function range(q) {
  const to = q.to ? new Date(`${q.to}T23:59:59`) : new Date();
  const from = q.from ? new Date(q.from) : new Date(to.getTime() - 29 * 864e5);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

// لوحة المؤشرات الرئيسية
r.get('/stats', ...requireStaff, asyncHandler(async (_req, res) => {
  const since = new Date(Date.now() - 29 * 864e5);
  since.setHours(0, 0, 0, 0);
  const [byStatus, sales30, customers, products, lowStock, newRequests, unread, daily, recent] = await Promise.all([
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({ isActive: true }),
    Product.find({ isActive: true, $expr: { $lte: ['$stock', '$lowStockThreshold'] } })
      .select('name sku stock lowStockThreshold').sort('stock').limit(10),
    Request.countDocuments({ status: 'new' }),
    Message.countDocuments({ isRead: false }),
    Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelled' } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$total' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.find().sort('-createdAt').limit(8).select('orderNumber customer.name total status paymentStatus createdAt'),
  ]);
  res.json({
    ordersByStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    sales30: { total: round(sales30[0]?.total), count: sales30[0]?.count || 0 },
    customers, products, lowStock, newRequests, unreadMessages: unread, daily, recent,
  });
}));

// التقرير المالي
r.get('/finance', ...requirePermission('finance'), asyncHandler(async (req, res) => {
  const { from, to } = range(req.query);
  const match = { createdAt: { $gte: from, $lte: to }, status: { $ne: 'cancelled' } };

  const [orders, expenses, receivables, refundsAgg, topProducts, byPayment] = await Promise.all([
    Order.find(match).select('total subtotal discount shippingCost items amountPaid refundedTotal paymentStatus createdAt'),
    Expense.find({ date: { $gte: from, $lte: to } }),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, paymentStatus: { $in: ['pending', 'failed'] } } },
      { $group: { _id: null, amount: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $unwind: '$refunds' },
      { $match: { 'refunds.at': { $gte: from, $lte: to } } },
      { $group: { _id: null, amount: { $sum: '$refunds.amount' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product', name: { $first: '$items.name' }, qty: { $sum: '$items.qty' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
          cost: { $sum: { $multiply: [{ $ifNull: ['$items.cost', 0] }, '$items.qty'] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
    Order.aggregate([
      { $match: match },
      { $group: { _id: '$paymentMethod', total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
  ]);

  const sales = orders.reduce((s, o) => s + o.total, 0);
  const collected = orders.reduce((s, o) => s + (o.amountPaid || 0), 0);
  const productRevenue = orders.reduce((s, o) => s + o.subtotal - (o.discount || 0), 0);
  const shippingRevenue = orders.reduce((s, o) => s + (o.shippingCost || 0), 0);
  const cogs = orders.reduce((s, o) => s + o.items.reduce((a, i) => a + (i.cost || 0) * i.qty, 0), 0);
  const refunds = refundsAgg[0]?.amount || 0;
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const grossProfit = productRevenue - cogs;
  const netProfit = grossProfit + shippingRevenue - expenseTotal - refunds;

  const expensesByCategory = {};
  for (const e of expenses) expensesByCategory[e.category] = round((expensesByCategory[e.category] || 0) + e.amount);

  // سلسلة شهرية
  const monthly = {};
  for (const o of orders) {
    const k = o.createdAt.toISOString().slice(0, 7);
    monthly[k] ||= { month: k, sales: 0, cogs: 0, expenses: 0 };
    monthly[k].sales += o.total;
    monthly[k].cogs += o.items.reduce((a, i) => a + (i.cost || 0) * i.qty, 0);
  }
  for (const e of expenses) {
    const k = e.date.toISOString().slice(0, 7);
    monthly[k] ||= { month: k, sales: 0, cogs: 0, expenses: 0 };
    monthly[k].expenses += e.amount;
  }

  res.json({
    from, to,
    ordersCount: orders.length,
    sales: round(sales),
    collected: round(collected),
    productRevenue: round(productRevenue),
    shippingRevenue: round(shippingRevenue),
    cogs: round(cogs),
    grossProfit: round(grossProfit),
    grossMargin: productRevenue ? round((grossProfit / productRevenue) * 100) : 0,
    expenses: round(expenseTotal),
    expensesByCategory,
    refunds: round(refunds),
    refundsCount: refundsAgg[0]?.count || 0,
    netProfit: round(netProfit),
    netMargin: sales ? round((netProfit / sales) * 100) : 0,
    receivables: { amount: round(receivables[0]?.amount), count: receivables[0]?.count || 0 },
    averageOrder: orders.length ? round(sales / orders.length) : 0,
    topProducts: topProducts.map((p) => ({ ...p, revenue: round(p.revenue), profit: round(p.revenue - p.cost) })),
    byPayment,
    monthly: Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({ ...m, sales: round(m.sales), cogs: round(m.cogs), expenses: round(m.expenses), profit: round(m.sales - m.cogs - m.expenses) })),
  });
}));

// المصاريف
r.use('/expenses', crudRouter(Expense, {
  permission: 'finance', publicRead: false, sort: '-date', searchFields: ['title', 'notes'], filterFields: ['category'],
}));

export default r;
