import { Router } from 'express';
import Coupon from '../models/Coupon.js';
import { asyncHandler, HttpError } from '../utils/helpers.js';
import { crudRouter } from './crud.js';

const r = Router();

r.post('/validate', asyncHandler(async (req, res) => {
  const c = await Coupon.findOne({ code: String(req.body.code || '').toUpperCase() });
  if (!c) throw new HttpError(404, 'كود الخصم غير صحيح');
  const ev = c.evaluate(+req.body.subtotal || 0);
  if (!ev.ok) throw new HttpError(400, ev.message);
  res.json({ code: c.code, discount: ev.discount, type: c.type, value: c.value });
}));

r.use('/', crudRouter(Coupon, { permission: 'offers', publicRead: false, searchFields: ['code', 'description'] }));

export default r;
