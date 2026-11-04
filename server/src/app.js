import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import couponRoutes from './routes/coupons.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import settingsRoutes from './routes/settings.js';
import { requestsRouter, contactRouter } from './routes/requests.js';
import { crudRouter } from './routes/crud.js';
import Service from './models/Service.js';
import Article from './models/Article.js';
import Project from './models/Project.js';
import { notFound, errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  // CLIENT_URL: نطاقات الواجهة المسموح لها، مفصولة بفواصل (مثل https://username.github.io)
  const origins = (process.env.CLIENT_URL || '').split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean);
  app.set('trust proxy', 1);
  app.use(cors({ origin: origins.length ? origins : true }));
  app.use(express.json({ limit: '2mb' }));
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/', (_req, res, next) => (fs.existsSync(dist) ? next() : res.json({ name: 'Electronics Astro API', health: '/api/health' })));
  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/coupons', couponRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/requests', requestsRouter);
  app.use('/api/contact', contactRouter);
  app.use('/api/services', crudRouter(Service, {
    permission: 'content', publicFilter: { isActive: true }, slugFrom: 'title', sort: 'order', searchFields: ['title', 'summary'],
  }));
  app.use('/api/articles', crudRouter(Article, {
    permission: 'content', publicFilter: { isPublished: true }, slugFrom: 'title',
    searchFields: ['title', 'excerpt', 'tags'], filterFields: ['type', 'level'],
    populate: { path: 'relatedProducts', select: 'name slug price comparePrice images stock' },
  }));
  app.use('/api/projects', crudRouter(Project, {
    permission: 'content', publicFilter: { isPublished: true }, slugFrom: 'title',
    searchFields: ['title', 'summary', 'sector'], filterFields: ['sector'],
    populate: { path: 'products', select: 'name slug price images' },
  }));
  app.use('/api', notFound);

  // في الإنتاج: تقديم ملفات React المبنية من نفس الخادم
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
