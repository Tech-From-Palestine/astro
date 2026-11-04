import { Router } from 'express';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { asyncHandler, HttpError, slugify } from '../utils/helpers.js';
import { requirePermission } from '../middleware/auth.js';

const r = Router();

r.get('/', asyncHandler(async (req, res) => {
  const filter = req.query.all === '1' ? {} : { isActive: true };
  const cats = await Category.find(filter).sort('order name').lean();
  const counts = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  res.json(cats.map((c) => ({ ...c, productCount: map[String(c._id)] || 0 })));
}));

r.get('/:slug', asyncHandler(async (req, res) => {
  const cat = await Category.findOne({ slug: req.params.slug });
  if (!cat) throw new HttpError(404, 'التصنيف غير موجود');
  res.json(cat);
}));

r.post('/', ...requirePermission('products'), asyncHandler(async (req, res) => {
  const data = { ...req.body, slug: req.body.slug || slugify(req.body.name) };
  res.status(201).json(await Category.create(data));
}));

r.put('/:id', ...requirePermission('products'), asyncHandler(async (req, res) => {
  const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!cat) throw new HttpError(404, 'التصنيف غير موجود');
  res.json(cat);
}));

r.delete('/:id', ...requirePermission('products'), asyncHandler(async (req, res) => {
  if (await Product.exists({ category: req.params.id }))
    throw new HttpError(400, 'لا يمكن حذف تصنيف يحتوي منتجات، انقل المنتجات أولاً');
  await Category.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

export default r;
