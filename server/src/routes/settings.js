import { Router } from 'express';
import Settings from '../models/Settings.js';
import { asyncHandler } from '../utils/helpers.js';
import { requirePermission } from '../middleware/auth.js';

const r = Router();

r.get('/', asyncHandler(async (_req, res) => res.json(await Settings.get())));

r.put('/', ...requirePermission('settings'), asyncHandler(async (req, res) => {
  const data = { ...req.body };
  delete data._id;
  const s = await Settings.findByIdAndUpdate('site', data, { new: true, upsert: true, runValidators: true });
  res.json(s);
}));

export default r;
