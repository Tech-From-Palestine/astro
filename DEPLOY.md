# خطوات نشر Electronics Astro — بالترتيب

| الجزء | المكان | الرابط النهائي |
|---|---|---|
| الواجهة (React) | GitHub Pages | `https://USERNAME.github.io/astro/` |
| الباك اند (Express) | Render | `https://astro-api-xxxx.onrender.com` |
| قاعدة البيانات | MongoDB Atlas | — |

> **البيانات الأولية تُضاف تلقائياً**: عند أول تشغيل للخادم على Render، إذا كانت القاعدة `astro` فارغة،
> يضيف الخادم التصنيفات والمنتجات والخدمات والمحتوى والإعدادات وحساب المدير بنفسه — مرة واحدة فقط،
> ولا يلمس أي بيانات موجودة بعد ذلك. لا تحتاج تشغيل `npm run seed` أبداً.

استبدل `USERNAME` في كل مكان باسم حسابك على GitHub.

---

## الخطوة 0 — انقل المشروع من سطح المكتب (مرة واحدة)
سطح المكتب متزامن مع iCloud ويحذف ملفات المشروع من الجهاز. افتح **Terminal**:
```bash
mkdir -p ~/Projects
mv ~/Desktop/astro ~/Projects/astro
cd ~/Projects/astro
rm -rf server/node_modules client/node_modules _to_delete
```

## الخطوة 1 — MongoDB Atlas (دقيقتان)
1. ادخل https://cloud.mongodb.com ← مشروعك.
2. من القائمة اليسرى: **Security → Network Access → + Add IP Address → Allow Access from Anywhere** ← **Confirm**.
   (ضروري لأن Render لا يملك عنوان IP ثابتاً.)
3. **Database → Clusters → Connect → Drivers** وانسخ الرابط، وضع كلمة مرور مستخدم القاعدة مكان `<db_password>`.
   شكله: `mongodb+srv://USER:PASSWORD@astro.xxxxx.mongodb.net/?appName=astro`
   احتفظ به — ستلصقه في Render.

## الخطوة 2 — إنشاء الريبو على GitHub
1. https://github.com/new
   - Repository name: `astro`
   - **Public** (GitHub Pages المجاني لا يعمل مع Private)
   - لا تضف README ولا .gitignore ← **Create repository**
2. في الريبو الجديد: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## الخطوة 3 — رفع الكود
في Terminal:
```bash
cd ~/Projects/astro
git init -b main
git add .
git commit -m "Electronics Astro"
git remote add origin https://github.com/USERNAME/astro.git
git push -u origin main
```
- إذا طلب كلمة مرور: استخدم **Personal Access Token** وليس كلمة مرور GitHub
  (https://github.com/settings/tokens ← Generate new token (classic) ← فعّل `repo` و `workflow`).
- بعد الرفع سيفشل أول تشغيل في تبويب **Actions** برسالة "أضف المتغير VITE_API_URL" — هذا طبيعي، نصلحه في الخطوة 5.
- تأكد أن ملفات `.env` **لم** تُرفع (لن تظهر في الريبو لأنها في `.gitignore`).

## الخطوة 4 — الباك اند على Render
1. https://dashboard.render.com ← سجّل بحساب GitHub.
2. **New + → Blueprint** ← اربط GitHub واختر الريبو `astro` ← **Connect**.
3. Blueprint Name: `astro` — سيقرأ ملف `render.yaml` ويطلب 4 قيم:

   | المتغير | القيمة |
   |---|---|
   | `MONGODB_URI` | رابط Atlas من الخطوة 1 |
   | `CLIENT_URL` | `https://USERNAME.github.io` ← **بدون** `/astro` وبدون `/` في الآخر |
   | `ADMIN_EMAIL` | بريد المدير الذي ستدخل به، مثل `admin@astro.ps` |
   | `ADMIN_PASSWORD` | كلمة مرور قوية للمدير |

4. **Deploy Blueprint**. انتظر حتى تصبح الحالة **Live** (3–5 دقائق).
5. افتح الخدمة `astro-api` وانسخ رابطها من أعلى الصفحة، مثل `https://astro-api-xxxx.onrender.com`.
6. تحقق:
   - افتح `https://astro-api-xxxx.onrender.com/api/health` ← يجب أن ترى `{"ok":true}`
   - افتح `https://astro-api-xxxx.onrender.com/api/categories` ← يجب أن ترى 15 تصنيفاً (البيانات أضيفت تلقائياً)
   - في تبويب **Logs** ستجد: `✔ تمت إضافة البيانات الأولية`

## الخطوة 5 — ربط الواجهة بالباك اند ونشرها
1. في الريبو على GitHub: **Settings → Secrets and variables → Actions → تبويب Variables → New repository variable**
   - Name: `VITE_API_URL`
   - Value: رابط Render من الخطوة 4 (مثل `https://astro-api-xxxx.onrender.com`) ← بدون `/api` وبدون `/` في الآخر
   - **Add variable**
2. **Actions → Deploy client to GitHub Pages → Run workflow → Run workflow**.
3. انتظر العلامة الخضراء ✓ (دقيقتان تقريباً).
4. افتح الموقع: `https://USERNAME.github.io/astro/`

## الخطوة 6 — التأكد النهائي
- افتح `https://USERNAME.github.io/astro/login` وادخل بـ `ADMIN_EMAIL` و `ADMIN_PASSWORD` ← تنتقل للوحة التحكم.
- جرّب طلباً تجريبياً من المتجر وتأكد أنه ظهر في **لوحة التحكم → الطلبات**.

---

## بعد النشر
- أي `git push` على `main` يحدّث الواجهة (GitHub Actions) والباك اند (Render) تلقائياً:
  ```bash
  git add . && git commit -m "وصف التعديل" && git push
  ```
- تغيير كلمة مرور المدير: من الموقع ← حسابي ← تغيير كلمة المرور.
  (تغيير `ADMIN_PASSWORD` على Render لاحقاً لا يغيّر كلمة مرور حساب موجود.)

## للتشغيل على جهازك (اختياري)
```bash
cd ~/Projects/astro
npm install --prefix server && npm install --prefix client
cd server && npm run dev        # Terminal أول
cd client && npm run dev        # Terminal ثاني ← http://localhost:5173
```
ملف `server/.env` يحتاج `MONGODB_URI` و `JWT_SECRET` (انظر `server/.env.example`).
تنبيه: إذا وضعت نفس رابط Atlas فأنت تعمل على بيانات الموقع الحقيقي.

## حل المشاكل
| المشكلة | الحل |
|---|---|
| الموقع يفتح لكن بدون منتجات / يبقى "جارٍ التحميل" | خطة Render المجانية تُطفئ الخادم بعد 15 دقيقة؛ أول زيارة تأخذ ~50 ثانية. انتظر وحدّث. |
| خطأ CORS في Console المتصفح | `CLIENT_URL` على Render يجب أن يكون `https://USERNAME.github.io` بالضبط. بعد تعديله: Manual Deploy. |
| Render Logs: `MongoServerSelectionError` | الخطوة 1.2 (Network Access 0.0.0.0/0) أو كلمة المرور في الرابط خاطئة. |
| Actions فشل: "أضف المتغير VITE_API_URL" | الخطوة 5.1 ثم أعد تشغيل الـ workflow. |
| صفحة 404 من GitHub | تأكد من الخطوة 2.2 (Source: GitHub Actions) وأن اسم الريبو `astro`. |
| تريد إعادة البيانات الأولية من الصفر | احذف القاعدة `astro` من Atlas (Browse Collections ← Drop Database) ثم Render ← Manual Deploy ← Restart. **يحذف كل الطلبات والعملاء.** |
