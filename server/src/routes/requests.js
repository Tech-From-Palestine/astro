import { Router } from 'express';
import Request from '../models/Request.js';
import Message from '../models/Message.js';
import { asyncHandler, HttpError, pick } from '../utils/helpers.js';
import { optionalAuth, protect, requirePermission } from '../middleware/auth.js';

// طلبات الخدمات وعروض الأسعار
export const requestsRouter = Router();

requestsRouter.post('/', optionalAuth, asyncHandler(async (req, res) => {
  const data = pick(req.body, ['type', 'service', 'name', 'email', 'phone', 'organization', 'budget', 'details']);
  if (!data.service) delete data.service;
  data.user = req.user?._id;
  res.status(201).json(await Request.create(data));
}));

requestsRouter.get('/mine', protect, asyncHandler(async (req, res) => {
  res.json(await Request.find({ user: req.user._id }).populate('service', 'title').sort('-createdAt'));
}));

requestsRouter.get('/', ...requirePermission('content'), asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;
  res.json(await Request.find(filter).populate('service', 'title').sort('-createdAt').limit(500));
}));

requestsRouter.patch('/:id', ...requirePermission('content'), asyncHandler(async (req, res) => {
  const doc = await Request.findByIdAndUpdate(req.params.id, pick(req.body, ['status', 'adminNotes']), { new: true, runValidators: true });
  if (!doc) throw new HttpError(404, 'الطلب غير موجود');
  res.json(doc);
}));

// رسائل تواصل معنا
export const contactRouter = Router();

contactRouter.post('/', asyncHandler(async (req, res) => {
  res.status(201).json(await Message.create(pick(req.body, ['name', 'email', 'phone', 'subject', 'message'])));
}));

contactRouter.get('/', ...requirePermission('customers'), asyncHandler(async (_req, res) => {
  res.json(await Message.find().sort('-createdAt').limit(500));
}));

contactRouter.patch('/:id', ...requirePermission('customers'), asyncHandler(async (req, res) => {
  res.json(await Message.findByIdAndUpdate(req.params.id, { isRead: !!req.body.isRead }, { new: true }));
}));

contactRouter.delete('/:id', ...requirePermission('customers'), asyncHandler(async (req, res) => {
  await Message.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));
