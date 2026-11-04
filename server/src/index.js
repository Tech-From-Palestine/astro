import 'dotenv/config';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { bootstrap } from './bootstrap.js';

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('✖ JWT_SECRET غير معرّف في ملف .env');
  process.exit(1);
}

connectDB()
  .then(bootstrap)
  .then(() => {
    createApp().listen(PORT, () => console.log(`✔ Astro API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('✖ فشل تشغيل الخادم:', err.message);
    process.exit(1);
  });
