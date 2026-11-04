import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Category from './models/Category.js';
import Product from './models/Product.js';
import Service from './models/Service.js';
import Article from './models/Article.js';
import Project from './models/Project.js';
import Coupon from './models/Coupon.js';
import Settings from './models/Settings.js';
import Order from './models/Order.js';
import Expense from './models/Expense.js';
import { slugify } from './utils/helpers.js';
import * as data from './seedData.js';

/**
 * npm run seed            → يضيف البيانات الأولية (يحذف المنتجات/المحتوى الحالي ويعيد إنشاءه)
 * npm run seed -- --demo  → يضيف أيضاً طلبات ومصاريف تجريبية لتجربة التقارير المالية
 */
export async function seed({ demo = false } = {}) {
  await Promise.all([Category, Product, Service, Article, Project, Coupon, Settings].map((M) => M.deleteMany({})));

  await Settings.create(data.settings);
  const cats = await Category.insertMany(data.categories);
  const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c._id]));

  const products = await Product.insertMany(
    data.products.map(({ cat, ...p }, i) => ({
      ...p, category: catBySlug[cat], slug: `${slugify(p.name)}-${i + 1}`, lowStockThreshold: 5,
      tags: [cat], description: p.description || `${p.shortDescription || p.name}.\n\nمنتج أصلي مفحوص من فريق Astro مع دعم فني بعد البيع.`,
    }))
  );
  const bySku = Object.fromEntries(products.map((p) => [p.sku, p]));

  await Service.insertMany(data.services.map((s) => ({ ...s, slug: slugify(s.title) })));
  await Article.insertMany(data.articles.map(({ related, ...a }) => ({
    ...a, slug: slugify(a.title), relatedProducts: (related || []).map((s) => bySku[s]?._id).filter(Boolean),
  })));
  await Project.insertMany(data.projects.map(({ productSkus, ...p }) => ({
    ...p, slug: slugify(p.title), products: (productSkus || []).map((s) => bySku[s]?._id).filter(Boolean),
  })));
  await Coupon.create([
    { code: 'ASTRO10', type: 'percent', value: 10, description: 'خصم 10% للطلبات فوق 100', minOrder: 100 },
    { code: 'STUDENT', type: 'fixed', value: 15, description: 'خصم الطلاب 15 ₪', minOrder: 80 },
  ]);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@astro.ps';
  if (!(await User.exists({ email: adminEmail }))) {
    await User.create({ name: 'مدير Astro', email: adminEmail, password: process.env.ADMIN_PASSWORD || 'Admin@12345', role: 'admin' });
  }

  if (demo) {
    await Order.deleteMany({});
    await Expense.deleteMany({});
    const customer = (await User.findOne({ email: 'customer@astro.ps' }))
      || (await User.create({ name: 'عميل تجريبي', email: 'customer@astro.ps', password: 'Customer@123', phone: '0590000001', customerType: 'student' }));
    const statuses = ['delivered', 'delivered', 'shipped', 'processing', 'pending', 'confirmed', 'delivered', 'cancelled'];
    for (let i = 0; i < 24; i++) {
      const picks = [products[(i * 7) % products.length], products[(i * 3 + 1) % products.length]];
      const items = picks.map((p, k) => ({ product: p._id, name: p.name, sku: p.sku, price: p.price, cost: p.cost, qty: k + 1 }));
      const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0);
      const status = statuses[i % statuses.length];
      const created = new Date(Date.now() - (i * 4 + 1) * 864e5);
      const paid = status === 'delivered' || i % 3 === 0;
      await Order.create({
        orderNumber: `AST-DEMO-${String(i + 1).padStart(4, '0')}`, invoiceNumber: `INV-DEMO-${String(i + 1).padStart(5, '0')}`,
        user: customer._id, customer: { name: customer.name, email: customer.email, phone: customer.phone },
        shipping: { city: ['غزة', 'رام الله', 'نابلس', 'الخليل'][i % 4], address: 'عنوان تجريبي', method: { code: 'standard', name: 'توصيل عادي', eta: '2-4 أيام عمل' } },
        items, paymentMethod: i % 2 ? 'cod' : 'bank_transfer', status,
        paymentStatus: status === 'cancelled' ? 'pending' : paid ? 'paid' : 'pending',
        amountPaid: paid && status !== 'cancelled' ? subtotal + 20 : 0, paidAt: paid ? created : undefined,
        subtotal, shippingCost: 20, total: subtotal + 20,
        statusHistory: [{ status: 'pending', at: created }, { status, at: created }],
        createdAt: created, updatedAt: created,
      });
    }
    await Expense.insertMany([
      { title: 'شراء مخزون مكونات', category: 'inventory', amount: 300, date: new Date(Date.now() - 40 * 864e5) },
      { title: 'إيجار المعرض', category: 'rent', amount: 200, date: new Date(Date.now() - 20 * 864e5) },
      { title: 'حملة إعلانية', category: 'marketing', amount: 80, date: new Date(Date.now() - 10 * 864e5) },
      { title: 'تكاليف شحن', category: 'shipping', amount: 40, date: new Date(Date.now() - 5 * 864e5) },
    ]);
  }
  return { categories: cats.length, products: products.length };
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  connectDB()
    .then(() => seed({ demo: process.argv.includes('--demo') }))
    .then((r) => { console.log('✔ تمت إضافة البيانات الأولية', r); return mongoose.disconnect(); })
    .catch((e) => { console.error(e); process.exit(1); });
}
