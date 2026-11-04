import { Router } from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { asyncHandler, HttpError, pick, escapeRegex } from '../utils/helpers.js';
import { requirePermission, PERMISSIONS, protect, hasPermission } from '../middleware/auth.js';

const r = Router();

r.get('/permissions', ...requirePermission('users'), (_req, res) => res.json(PERMISSIONS));

// قائمة العملاء/المستخدمين مع إحصائيات الطلبات
r.get('/', protect, (req, _res, next) =>
  hasPermission(req.user, 'customers') || hasPermission(req.user, 'users') ? next() : next(new HttpError(403, 'غير مصرح')),
asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const users = await User.find(filter).sort('-createdAt').limit(500).lean();
  const stats = await Order.aggregate([
    { $match: { user: { $in: users.map((u) => u._id) }, status: { $ne: 'cancelled' } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$total' } } },
  ]);
  const m = Object.fromEntries(stats.map((s) => [String(s._id), s]));
  res.json(users.map((u) => ({ ...u, orders: m[String(u._id)]?.orders || 0, spent: m[String(u._id)]?.spent || 0 })));
}));

// إنشاء موظف/مستخدم من لوحة التحكم
r.post('/', ...requirePermission('users'), asyncHandler(async (req, res) => {
  const data = pick(req.body, ['name', 'email', 'password', 'phone', 'role', 'permissions', 'customerType']);
  if (!data.password) throw new HttpError(400, 'كلمة المرور مطلوبة');
  res.status(201).json(await User.create(data));
}));

r.put('/:id', ...requirePermission('users'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'المستخدم غير موجود');
  if (String(user._id) === String(req.user._id) && req.body.role && req.body.role !== user.role)
    throw new HttpError(400, 'لا يمكنك تغيير صلاحيتك بنفسك');
  if (user.role === 'admin' && req.user.role !== 'admin') throw new HttpError(403, 'لا يمكن تعديل حساب مدير');
  Object.assign(user, pick(req.body, ['name', 'phone', 'role', 'permissions', 'isActive', 'customerType']));
  if (req.body.password) user.password = req.body.password;
  await user.save();
  res.json(user);
}));

export default r;
