export const money = (n, cur = '₪') =>
  `${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${cur}`;

export const date = (d) => (d ? new Date(d).toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
export const dateTime = (d) => (d ? new Date(d).toLocaleString('ar-EG-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

export const ORDER_STATUS = {
  pending: 'قيد المراجعة', confirmed: 'مؤكد', processing: 'قيد التجهيز',
  shipped: 'تم الشحن', delivered: 'تم التسليم', cancelled: 'ملغي',
};
export const PAYMENT_STATUS = {
  pending: 'بانتظار الدفع', paid: 'مدفوع', partially_refunded: 'مسترد جزئياً', refunded: 'مسترد', failed: 'فشل',
};
export const PAYMENT_METHOD = {
  cod: 'الدفع عند الاستلام', bank_transfer: 'تحويل بنكي', wallet: 'محفظة إلكترونية', card: 'بطاقة ائتمان',
};
export const REQUEST_STATUS = {
  new: 'جديد', in_review: 'قيد الدراسة', quoted: 'تم إرسال عرض سعر', in_progress: 'قيد التنفيذ', done: 'منجز', rejected: 'مرفوض',
};
export const REQUEST_TYPE = { service: 'طلب خدمة', quote: 'عرض سعر / كميات', custom: 'منتج مخصص' };
export const CUSTOMER_TYPE = {
  student: 'طالب', engineer: 'مهندس', developer: 'مطور', hobbyist: 'هاوٍ / مبتكر', startup: 'مشروع ناشئ',
  school: 'مدرسة / مركز تعليمي', company: 'شركة / مؤسسة', lab: 'مختبر / مركز بحث', other: 'أخرى',
};
export const ARTICLE_TYPE = { article: 'مقال', tutorial: 'شرح', project: 'مشروع تعليمي', resource: 'مصدر تقني' };
export const LEVEL = { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' };
export const EXPENSE_CAT = {
  inventory: 'مشتريات مخزون', shipping: 'شحن', salaries: 'رواتب', rent: 'إيجار', marketing: 'تسويق', utilities: 'خدمات', other: 'أخرى',
};
export const PERMISSION_LABEL = {
  products: 'المنتجات والمخزون', orders: 'الطلبات', customers: 'العملاء والرسائل', offers: 'العروض والكوبونات',
  content: 'الخدمات والمحتوى', finance: 'الإدارة المالية', reports: 'التقارير', users: 'المستخدمون والصلاحيات', settings: 'إعدادات الموقع',
};
export const STATUS_TONE = {
  pending: 'warn', confirmed: 'info', processing: 'info', shipped: 'info', delivered: 'ok', cancelled: 'bad',
  paid: 'ok', partially_refunded: 'warn', refunded: 'bad', failed: 'bad',
  new: 'warn', in_review: 'info', quoted: 'info', in_progress: 'info', done: 'ok', rejected: 'bad',
};
