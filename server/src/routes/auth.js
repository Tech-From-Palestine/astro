import { Router } from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { asyncHandler, HttpError, pick } from '../utils/helpers.js';
import { protect, signToken } from '../middleware/auth.js';

const r = Router();

r.post('/register', asyncHandler(async (req, res) => {
  const data = pick(req.body, ['name', 'email', 'password', 'phone', 'customerType', 'company']);
  if (!data.password || data.password.length < 6) throw new HttpError(400, 'كلمة المرور 6 أحرف على الأقل');
  if (await User.exists({ email: String(data.email).toLowerCase() }))
    throw new HttpError(409, 'البريد الإلكتروني مسجل مسبقاً');
  const user = await User.create(data);
  res.status(201).json({ token: signToken(user), user });
}));

r.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password || '')))
    throw new HttpError(401, 'البريد أو كلمة المرور غير صحيحة');
  if (!user.isActive) throw new HttpError(403, 'الحساب موقوف، تواصل مع الدعم');
  res.json({ token: signToken(user), user });
}));

r.get('/me', protect, (req, res) => res.json(req.user));

r.put('/me', protect, asyncHandler(async (req, res) => {
  Object.assign(req.user, pick(req.body, ['name', 'phone', 'customerType', 'company', 'addresses']));
  await req.user.save();
  res.json(req.user);
}));

r.put('/me/password', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword || '')))
    throw new HttpError(400, 'كلمة المرور الحالية غير صحيحة');
  if (!req.body.newPassword || req.body.newPassword.length < 6)
    throw new HttpError(400, 'كلمة المرور الجديدة 6 أحرف على الأقل');
  user.password = req.body.newPassword;
  await user.save();
  res.json({ ok: true });
}));

// المفضلة
r.get('/me/favorites', protect, asyncHandler(async (req, res) => {
  const items = await Product.find({ _id: { $in: req.user.favorites }, isActive: true }).populate('category', 'name slug icon');
  res.json(items);
}));

r.post('/me/favorites/:productId', protect, asyncHandler(async (req, res) => {
  const id = req.params.productId;
  const idx = req.user.favorites.findIndex((f) => f.toString() === id);
  if (idx >= 0) req.user.favorites.splice(idx, 1);
  else req.user.favorites.push(id);
  await req.user.save();
  res.json({ favorites: req.user.favorites });
}));

export default r;
