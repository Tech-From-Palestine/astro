export function notFound(req, res) {
  res.status(404).json({ message: `المسار غير موجود: ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'خطأ في الخادم';
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join('، ');
  } else if (err.code === 11000) {
    status = 409;
    message = `القيمة مستخدمة مسبقاً: ${Object.keys(err.keyValue || {}).join(', ')}`;
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'معرّف غير صالح';
  }
  if (status >= 500) console.error(err);
  res.status(status).json({ message });
}
