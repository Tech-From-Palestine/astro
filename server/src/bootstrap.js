import User from './models/User.js';
import Category from './models/Category.js';
import Product from './models/Product.js';
import Settings from './models/Settings.js';
import { seed } from './seed.js';

/**
 * يعمل تلقائياً عند كل تشغيل للخادم:
 * 1) في أول تشغيل على قاعدة فارغة تماماً يضيف البيانات الأولية مرة واحدة فقط.
 *    لا يحذف أو يعدّل أي بيانات موجودة. لإيقافه: AUTO_SEED=false
 * 2) يتأكد من وجود حساب مدير واحد على الأقل (من ADMIN_EMAIL / ADMIN_PASSWORD).
 * 3) يتأكد من وجود إعدادات الموقع.
 */
export async function bootstrap() {
  if (process.env.AUTO_SEED !== 'false') {
    // يعمل فقط في أول تشغيل على قاعدة جديدة تماماً (لا إعدادات ولا تصنيفات ولا منتجات)
    const [settings, cats, prods] = await Promise.all([
      Settings.exists({ _id: 'site' }), Category.estimatedDocumentCount(), Product.estimatedDocumentCount(),
    ]);
    if (!settings && cats === 0 && prods === 0) {
      console.log('… القاعدة فارغة، جارٍ إضافة البيانات الأولية');
      const r = await seed({ demo: false });
      console.log('✔ تمت إضافة البيانات الأولية', r);
    }
  }

  if (!(await User.exists({ role: 'admin' }))) {
    const email = (process.env.ADMIN_EMAIL || 'admin@astro.ps').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const existing = await User.findOne({ email });
    if (existing) {
      existing.role = 'admin';
      await existing.save();
    } else {
      await User.create({ name: 'مدير Astro', email, password, role: 'admin' });
    }
    console.log(`✔ تم إنشاء حساب المدير: ${email}`);
    if (!process.env.ADMIN_PASSWORD) console.warn('⚠ تُستخدم كلمة مرور المدير الافتراضية — غيّرها فوراً من صفحة حسابي');
  }

  await Settings.get();
}
