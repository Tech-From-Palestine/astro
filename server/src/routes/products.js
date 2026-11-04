import { Router } from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { asyncHandler, HttpError, slugify, escapeRegex } from '../utils/helpers.js';
import { optionalAuth, requirePermission, hasPermission } from '../middleware/auth.js';

const r = Router();

const SORTS = {
  newest: '-createdAt',
  price_asc: 'price',
  price_desc: '-price',
  popular: '-sold',
  name: 'name',
};

r.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { q, category, minPrice, maxPrice, inStock, featured, onSale, astro, brand, lowStock, sort, all } = req.query;
  const isAdmin = hasPermission(req.user, 'products');
  const filter = isAdmin && all === '1' ? {} : { isActive: true };

  if (category) {
    const cat = await Category.findOne(/^[a-f\d]{24}$/i.test(category) ? { _id: category } : { slug: category });
    if (!cat) return res.json({ items: [], total: 0, page: 1, pages: 0 });
    const children = await Category.find({ parent: cat._id }).select('_id');
    filter.category = { $in: [cat._id, ...children.map((c) => c._id)] };
  }
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { sku: rx }, { brand: rx }, { tags: rx }, { shortDescription: rx }];
  }
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = +minPrice;
    if (maxPrice) filter.price.$lte = +maxPrice;
  }
  if (inStock === '1') filter.stock = { $gt: 0 };
  if (featured === '1') filter.featured = true;
  if (astro === '1') filter.isAstro = true;
  if (brand) filter.brand = brand;
  if (onSale === '1') filter.$expr = { $gt: ['$comparePrice', '$price'] };
  if (lowStock === '1' && isAdmin) filter.$expr = { $lte: ['$stock', '$lowStockThreshold'] };

  const limit = Math.min(+req.query.limit || 12, 200);
  const page = Math.max(+req.query.page || 1, 1);
  const projection = isAdmin ? '' : '-cost';
  const [items, total] = await Promise.all([
    Product.find(filter, projection)
      .populate('category', 'name slug icon')
      .sort(SORTS[sort] || SORTS.newest)
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}));

r.get('/brands', asyncHandler(async (_req, res) => {
  res.json((await Product.distinct('brand', { isActive: true })).filter(Boolean).sort());
}));

r.get('/:idOrSlug', optionalAuth, asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const isAdmin = hasPermission(req.user, 'products');
  const where = /^[a-f\d]{24}$/i.test(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  if (!isAdmin) where.isActive = true;
  const product = await Product.findOne(where, isAdmin ? '' : '-cost').populate('category', 'name slug icon');
  if (!product) throw new HttpError(404, 'المنتج غير موجود');
  const related = await Product.find(
    { category: product.category._id, _id: { $ne: product._id }, isActive: true }, '-cost'
  ).limit(4).populate('category', 'name slug icon');
  res.json({ product, related });
}));

r.post('/', ...requirePermission('products'), asyncHandler(async (req, res) => {
  const data = { ...req.body };
  data.slug = data.slug || `${slugify(data.name)}-${Date.now().toString(36).slice(-4)}`;
  if (!data.sku) delete data.sku;
  res.status(201).json(await Product.create(data));
}));

r.put('/:id', ...requirePermission('products'), asyncHandler(async (req, res) => {
  const data = { ...req.body };
  delete data._id;
  if (data.sku === '') { delete data.sku; data.$unset = { sku: 1 }; }
  const p = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!p) throw new HttpError(404, 'المنتج غير موجود');
  res.json(p);
}));

// تعديل المخزون سريعاً: { stock } قيمة مطلقة أو { adjust } زيادة/نقصان
r.patch('/:id/stock', ...requirePermission('products'), asyncHandler(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) throw new HttpError(404, 'المنتج غير موجود');
  if (req.body.stock !== undefined) p.stock = Math.max(0, +req.body.stock);
  if (req.body.adjust !== undefined) p.stock = Math.max(0, p.stock + +req.body.adjust);
  await p.save();
  res.json(p);
}));

r.delete('/:id', ...requirePermission('products'), asyncHandler(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

export default r;
