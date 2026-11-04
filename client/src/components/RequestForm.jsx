import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { ErrorBox, Field } from './UI';

export default function RequestForm({ type = 'service', service, allowType }) {
  const { user } = useAuth();
  const [sp] = useSearchParams();
  const product = sp.get('product');
  const [form, setForm] = useState({
    type, name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
    organization: '', budget: '', details: product ? `أرغب بعرض سعر للمنتج: ${product}\nالكمية: ` : '',
  });
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try { await api.post('/requests', { ...form, service }); setDone(true); } catch (err) { setError(err); } finally { setBusy(false); }
  };

  if (done) return <div className="alert alert-ok">✓ تم استلام طلبك، سيتواصل معك فريق Astro خلال يوم عمل.</div>;
  return (
    <form className="form-grid" onSubmit={submit}>
      {allowType && (
        <Field label="نوع الطلب" full>
          <select value={form.type} onChange={set('type')}>
            <option value="quote">عرض سعر لكميات كبيرة</option>
            <option value="custom">منتج مخصص / تصنيع حسب الطلب</option>
            <option value="service">خدمة هندسية</option>
          </select>
        </Field>
      )}
      <Field label="الاسم *"><input required value={form.name} onChange={set('name')} /></Field>
      <Field label="البريد الإلكتروني *"><input required type="email" dir="ltr" value={form.email} onChange={set('email')} /></Field>
      <Field label="الهاتف"><input type="tel" dir="ltr" value={form.phone} onChange={set('phone')} /></Field>
      <Field label="الجهة / المؤسسة"><input value={form.organization} onChange={set('organization')} /></Field>
      <Field label="الميزانية التقريبية" full><input value={form.budget} onChange={set('budget')} /></Field>
      <Field label="تفاصيل الطلب *" full><textarea required rows="5" value={form.details} onChange={set('details')} placeholder="صف مشروعك أو المنتجات والكميات المطلوبة…" /></Field>
      <ErrorBox error={error} />
      <button className="btn full" disabled={busy}>{busy ? 'جارٍ الإرسال…' : 'إرسال الطلب'}</button>
    </form>
  );
}
