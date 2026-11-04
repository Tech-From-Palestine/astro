import { Router } from 'express';
import { asyncHandler, HttpError, slugify, escapeRegex } from '../utils/helpers.js';
import { optionalAuth, requirePermission, hasPermission } from '../middleware/auth.js';

/**
 * موجّه CRUD عام للمحتوى.
 * - القراءة عامة (العناصر المنشورة/المفعّلة فقط) إلا لمن يملك الصلاحية.
 * - الكتابة تتطلب الصلاحية المحددة.
 */
export function crudRouter(Model, opts = {}) {
  const {
    permission = 'content',
    publicFilter = {},          // فلتر للزوار
    slugFrom,                   // الحقل الذي يُولّد منه slug
    searchFields = [],
    filterFields = [],          // حقول يمكن الفلترة بها عبر query
    populate,
    sort = '-createdAt',
    publicRead = true,
  } = opts;
  const r = Router();

  r.get('/', optionalAuth, asyncHandler(async (req, res) => {
    const isAdmin = hasPermission(req.user, permission);
    if (!publicRead && !isAdmin) throw new HttpError(403, 'غير مصرح');
    const q = isAdmin && req.query.all === '1' ? {} : { ...publicFilter };
    for (const f of filterFields) if (req.query[f]) q[f] = req.query[f];
    if (req.query.q && searchFields.length) {
      const rx = new RegExp(escapeRegex(req.query.q), 'i');
      q.$or = searchFields.map((f) => ({ [f]: rx }));
    }
    const limit = Math.min(+req.query.limit || 100, 500);
    const page = Math.max(+req.query.page || 1, 1);
    let query = Model.find(q).sort(req.query.sort || sort).skip((page - 1) * limit).limit(limit);
    if (populate) query = query.populate(populate);
    const [items, total] = await Promise.all([query, Model.countDocuments(q)]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  }));

  r.get('/:idOrSlug', optionalAuth, asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;
    const isAdmin = hasPermission(req.user, permission);
    const where = /^[a-f\d]{24}$/i.test(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
    let query = Model.findOne(isAdmin ? where : { ...where, ...publicFilter });
    if (populate) query = query.populate(populate);
    const doc = await query;
    if (!doc) throw new HttpError(404, 'العنصر غير موجود');
    if ('views' in doc && !isAdmin) { doc.views += 1; await doc.save(); }
    res.json(doc);
  }));

  r.post('/', ...requirePermission(permission), asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (slugFrom && !data.slug) data.slug = slugify(data[slugFrom]);
    const doc = await Model.create(data);
    res.status(201).json(doc);
  }));

  r.put('/:id', ...requirePermission(permission), asyncHandler(async (req, res) => {
    const data = { ...req.body };
    delete data._id;
    if (slugFrom && data.slug === '') data.slug = slugify(data[slugFrom]);
    const doc = await Model.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!doc) throw new HttpError(404, 'العنصر غير موجود');
    res.json(doc);
  }));

  r.delete('/:id', ...requirePermission(permission), asyncHandler(async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) throw new HttpError(404, 'العنصر غير موجود');
    res.json({ ok: true });
  }));

  return r;
}
