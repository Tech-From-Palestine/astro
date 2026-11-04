import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError } from '../utils/helpers.js';

export const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

async function readUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);
    return user && user.isActive ? user : null;
  } catch {
    return null;
  }
}

// يضيف req.user إن وُجد توكن صالح دون أن يفرضه
export async function optionalAuth(req, _res, next) {
  req.user = await readUser(req);
  next();
}

export async function protect(req, _res, next) {
  req.user = await readUser(req);
  if (!req.user) return next(new HttpError(401, 'يرجى تسجيل الدخول'));
  next();
}

// صلاحيات لوحة التحكم: admin يملك كل شيء، staff حسب قائمة permissions
export const PERMISSIONS = [
  'products', 'orders', 'customers', 'offers', 'content', 'finance', 'reports', 'users', 'settings',
];

export function hasPermission(user, perm) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.role === 'staff' && user.permissions.includes(perm);
}

export const requirePermission = (perm) => [
  protect,
  (req, _res, next) =>
    hasPermission(req.user, perm) ? next() : next(new HttpError(403, 'لا تملك صلاحية لهذا الإجراء')),
];

export const requireStaff = [
  protect,
  (req, _res, next) =>
    ['admin', 'staff'].includes(req.user.role) ? next() : next(new HttpError(403, 'غير مصرح')),
];
