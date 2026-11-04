import { Router } from 'express';
import Order, { ORDER_STATUSES, PAYMENT_STATUSES } from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Settings from '../models/Settings.js';
import { nextSeq } from '../models/Counter.js';
import { asyncHandler, HttpError, escapeRegex } from '../utils/helpers.js';
import { optionalAuth, protect, requirePermission, hasPermission } from '../middleware/auth.js';

const r = Router();
const round = (n) => Math.round(n * 100) / 100;

async function restoreStock(order) {
  for (const it of order.items) {
    await Product.updateOne({ _id: it.product }, { $inc: { stock: it.qty, sold: -it.qty } });
  }
}

/** يحسب تفاصيل السلة من قاعدة البيانات (لا نثق بأسعار العميل) */
async function priceCart(items = [], couponCode, shippingCode) {
  if (!Array.isArray(items) || !items.length) throw new HttpError(400, 'السلة فارغة');
  const settings = await Settings.get();
  const ids = items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: ids }, isActive: true });
  const map = Object.fromEntries(products.map((p) => [String(p._id), p]));
  const lines = [];
  for (const it of items) {
    const p = map[String(it.product)];
    const qty = Math.max(1, Math.floor(+it.qty || 1));
    if (!p) throw new HttpError(400, 'أحد المنتجات لم يعد متاحاً');
    if (p.stock < qty) throw new HttpError(400, `الكمية المتوفرة من "${p.name}" هي ${p.stock} فقط`);
    lines.push({ product: p._id, name: p.name, sku: p.sku, image: p.images?.[0], price: p.price, cost: p.cost, qty });
  }
  const subtotal = round(lines.reduce((s, l) => s + l.price * l.qty, 0));

  let discount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase() });
    if (!coupon) throw new HttpError(400, 'كود الخصم غير صحيح');
    const ev = coupon.evaluate(subtotal);
    if (!ev.ok) throw new HttpError(400, ev.message);
    discount = ev.discount;
  }

  const methods = settings.shippingMethods.filter((m) => m.isActive);
  const method = methods.find((m) => m.code === shippingCode) || methods[0];
  if (!method) throw new HttpError(400, 'لا توجد طريقة توصيل متاحة');
  const shippingCost = method.freeOver && subtotal - discount >= method.freeOver ? 0 : method.cost || 0;
  const tax = round(((subtotal - discount) * (settings.taxRate || 0)) / 100);
  const total = round(subtotal - discount + shippingCost + tax);
  return { lines, subtotal, discount, shippingCost, tax, total, method, coupon, settings };
}

// معاينة تكلفة الطلب قبل التأكيد
r.post('/quote', asyncHandler(async (req, res) => {
  const { lines, subtotal, discount, shippingCost, tax, total, method } =
    await priceCart(req.body.items, req.body.coupon, req.body.shippingMethod);
  res.json({ items: lines.map(({ cost, ...l }) => l), subtotal, discount, shippingCost, tax, total, shippingMethod: method });
}));

// إنشاء طلب (للزائر أو المسجل)
r.post('/', optionalAuth, asyncHandler(async (req, res) => {
  const { items, coupon: couponCode, shippingMethod, paymentMethod, customer, shipping } = req.body;
  const priced = await priceCart(items, couponCode, shippingMethod);
  const pm = priced.settings.paymentMethods.find((p) => p.code === paymentMethod && p.isActive);
  if (!pm) throw new HttpError(400, 'طريقة الدفع غير متاحة');

  // حجز المخزون بشكل ذري، مع التراجع إن فشل أي بند
  const reserved = [];
  for (const l of priced.lines) {
    const ok = await Product.findOneAndUpdate(
      { _id: l.product, stock: { $gte: l.qty } },
      { $inc: { stock: -l.qty, sold: l.qty } }
    );
    if (!ok) {
      for (const x of reserved) await Product.updateOne({ _id: x.product }, { $inc: { stock: x.qty, sold: -x.qty } });
      throw new HttpError(409, `نفدت الكمية المطلوبة من "${l.name}"`);
    }
    reserved.push(l);
  }

  try {
    const seq = await nextSeq('order');
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const order = await Order.create({
      orderNumber: `AST-${ymd}-${String(seq).padStart(4, '0')}`,
      invoiceNumber: `INV-${d.getFullYear()}-${String(seq).padStart(5, '0')}`,
      user: req.user?._id,
      customer: {
        name: customer?.name || req.user?.name,
        email: customer?.email || req.user?.email,
        phone: customer?.phone || req.user?.phone,
      },
      shipping: {
        city: shipping?.city, address: shipping?.address, notes: shipping?.notes,
        method: { code: priced.method.code, name: priced.method.name, eta: priced.method.eta },
      },
      items: priced.lines,
      paymentMethod: pm.code,
      coupon: priced.coupon?.code,
      subtotal: priced.subtotal,
      discount: priced.discount,
      shippingCost: priced.shippingCost,
      total: priced.total,
      statusHistory: [{ status: 'pending', note: 'تم استلام الطلب' }],
    });
    if (priced.coupon) await Coupon.updateOne({ _id: priced.coupon._id }, { $inc: { used: 1 } });
    res.status(201).json(order);
  } catch (e) {
    for (const x of reserved) await Product.updateOne({ _id: x.product }, { $inc: { stock: x.qty, sold: -x.qty } });
    throw e;
  }
}));

// طلباتي
r.get('/mine', protect, asyncHandler(async (req, res) => {
  res.json(await Order.find({ user: req.user._id }).sort('-createdAt').select('-items.cost'));
}));

// تتبع الطلب برقم الطلب + الهاتف (للزوار)
r.get('/track/:orderNumber', asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber.trim().toUpperCase() }).select('-items.cost -adminNotes');
  const phone = String(req.query.phone || '').replace(/\D/g, '');
  if (!order || !phone || !order.customer.phone.replace(/\D/g, '').endsWith(phone.slice(-7)))
    throw new HttpError(404, 'لم يتم العثور على طلب بهذه البيانات');
  res.json(order);
}));

// قائمة الطلبات للإدارة
r.get('/', ...requirePermission('orders'), asyncHandler(async (req, res) => {
  const { status, paymentStatus, q, from, to } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ orderNumber: rx }, { 'customer.name': rx }, { 'customer.phone': rx }, { 'customer.email': rx }];
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59`);
  }
  const limit = Math.min(+req.query.limit || 25, 200);
  const page = Math.max(+req.query.page || 1, 1);
  const [items, total] = await Promise.all([
    Order.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}));

// تفاصيل طلب (المالك أو الإدارة)
r.get('/:id', protect, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) throw new HttpError(404, 'الطلب غير موجود');
  const isStaff = hasPermission(req.user, 'orders');
  if (!isStaff && String(order.user?._id) !== String(req.user._id)) throw new HttpError(403, 'غير مصرح');
  const json = order.toJSON();
  if (!isStaff) { json.items.forEach((i) => delete i.cost); delete json.adminNotes; delete json.costOfGoods; }
  res.json(json);
}));

// إلغاء الطلب من العميل (فقط قبل التجهيز)
r.post('/:id/cancel', protect, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order || String(order.user) !== String(req.user._id)) throw new HttpError(404, 'الطلب غير موجود');
  if (!['pending', 'confirmed'].includes(order.status)) throw new HttpError(400, 'لا يمكن إلغاء الطلب بعد بدء التجهيز');
  order.status = 'cancelled';
  order.statusHistory.push({ status: 'cancelled', note: 'ألغاه العميل' });
  await order.save();
  await restoreStock(order);
  res.json(order);
}));

// تحديث حالة الطلب
r.patch('/:id/status', ...requirePermission('orders'), asyncHandler(async (req, res) => {
  const { status, note, trackingNumber } = req.body;
  if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'حالة غير صالحة');
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'الطلب غير موجود');
  if (order.status === 'cancelled') throw new HttpError(400, 'الطلب ملغي');
  if (status === 'cancelled') await restoreStock(order);
  order.status = status;
  if (trackingNumber !== undefined) order.shipping.trackingNumber = trackingNumber;
  order.statusHistory.push({ status, note });
  // الدفع عند الاستلام: يُعتبر مدفوعاً عند التسليم
  if (status === 'delivered' && order.paymentMethod === 'cod' && order.paymentStatus === 'pending') {
    order.paymentStatus = 'paid';
    order.amountPaid = order.total;
    order.paidAt = new Date();
  }
  await order.save();
  res.json(order);
}));

// تحديث حالة الدفع
r.patch('/:id/payment', ...requirePermission('orders'), asyncHandler(async (req, res) => {
  const { paymentStatus, amountPaid } = req.body;
  if (!PAYMENT_STATUSES.includes(paymentStatus)) throw new HttpError(400, 'حالة دفع غير صالحة');
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'الطلب غير موجود');
  order.paymentStatus = paymentStatus;
  if (paymentStatus === 'paid') {
    order.amountPaid = amountPaid !== undefined ? +amountPaid : order.total;
    order.paidAt = order.paidAt || new Date();
  }
  if (req.body.adminNotes !== undefined) order.adminNotes = req.body.adminNotes;
  await order.save();
  res.json(order);
}));

// استرداد مبلغ
r.post('/:id/refund', ...requirePermission('finance'), asyncHandler(async (req, res) => {
  const amount = round(+req.body.amount);
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'الطلب غير موجود');
  if (!amount || amount <= 0) throw new HttpError(400, 'مبلغ غير صالح');
  if (amount > order.amountPaid - order.refundedTotal) throw new HttpError(400, 'المبلغ أكبر من المدفوع القابل للاسترداد');
  order.refunds.push({ amount, reason: req.body.reason });
  order.refundedTotal = round(order.refundedTotal + amount);
  order.paymentStatus = order.refundedTotal >= order.amountPaid ? 'refunded' : 'partially_refunded';
  if (req.body.restock && order.status !== 'cancelled') await restoreStock(order);
  await order.save();
  res.json(order);
}));

export default r;
