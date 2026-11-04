import { useEffect, useState } from 'react';
import { api } from '../api';
import { useSettings } from '../context/SettingsContext';
import { ErrorBox, Field, Loader } from '../components/UI';
import { FormField } from './ResourceManager';

const TABS = { general: 'عام', shipping: 'التوصيل', payment: 'الدفع', about: 'من نحن', policies: 'السياسات' };

export default function Settings() {
  const { settings, reload } = useSettings();
  const [s, setS] = useState(null);
  const [tab, setTab] = useState('general');
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { if (settings) setS(structuredClone(settings)); }, [settings]);
  if (!s) return <Loader />;

  const setPath = (path, v) => setS((prev) => {
    const n = structuredClone(prev);
    const keys = path.split('.');
    let o = n;
    keys.slice(0, -1).forEach((k) => { o[k] ??= {}; o = o[k]; });
    o[keys.at(-1)] = v;
    return n;
  });
  const inp = (path, label, type = 'text', extra = {}) => {
    const v = path.split('.').reduce((o, k) => o?.[k], s);
    return <Field label={label} full={type === 'textarea' || type === 'lines'}><FormField f={{ type, ...extra }} value={v} onChange={(x) => setPath(path, x)} /></Field>;
  };
  const listEditor = (key, cols) => (
    <div className="stack">
      {(s[key] || []).map((row, i) => (
        <div key={i} className="card flat form-grid">
          {cols.map(([k, label, type]) => (
            <Field key={k} label={label}><FormField f={{ type: type || 'text' }} value={row[k]} onChange={(v) => setPath(`${key}.${i}.${k}`, v)} /></Field>
          ))}
          <button type="button" className="btn btn-danger btn-sm" onClick={() => setS({ ...s, [key]: s[key].filter((_, j) => j !== i) })}>حذف</button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setS({ ...s, [key]: [...(s[key] || []), { isActive: true }] })}>+ إضافة</button>
    </div>
  );

  const save = async () => {
    setError(null);
    try { await api.put('/settings', s); setMsg('تم حفظ الإعدادات'); reload(); setTimeout(() => setMsg(null), 2500); } catch (e) { setError(e); }
  };

  return (
    <div className="stack">
      <div className="admin-head"><h1>إعدادات الموقع</h1><button className="btn" onClick={save}>حفظ الإعدادات</button></div>
      {msg && <div className="alert alert-ok">{msg}</div>}
      <ErrorBox error={error} />
      <div className="tabs">{Object.entries(TABS).map(([k, v]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{v}</button>)}</div>
      <div className="card">
        {tab === 'general' && (
          <div className="form-grid">
            {inp('siteName', 'اسم الموقع')}
            {inp('tagline', 'الشعار')}
            {inp('currency', 'رمز العملة')}
            {inp('taxRate', 'نسبة الضريبة %', 'number')}
            {inp('banner.title', 'عنوان الواجهة الرئيسية')}
            {inp('banner.cta', 'نص زر الواجهة')}
            {inp('banner.subtitle', 'وصف الواجهة', 'textarea')}
            {inp('contact.email', 'البريد')}
            {inp('contact.phone', 'الهاتف')}
            {inp('contact.whatsapp', 'واتساب')}
            {inp('contact.address', 'العنوان')}
            {inp('contact.hours', 'ساعات العمل')}
            {inp('social.facebook', 'فيسبوك')}
            {inp('social.instagram', 'إنستغرام')}
            {inp('social.youtube', 'يوتيوب')}
            {inp('social.linkedin', 'لينكدإن')}
          </div>
        )}
        {tab === 'shipping' && listEditor('shippingMethods', [['code', 'الرمز'], ['name', 'الاسم'], ['cost', 'التكلفة', 'number'], ['eta', 'المدة'], ['freeOver', 'مجاني فوق (0 = لا)', 'number'], ['isActive', 'مفعل', 'checkbox']])}
        {tab === 'payment' && (
          <>
            <p className="muted small">الرموز المدعومة: cod، bank_transfer، wallet، card. يمكن ربط بوابة دفع إلكتروني لاحقاً.</p>
            {listEditor('paymentMethods', [['code', 'الرمز'], ['name', 'الاسم'], ['instructions', 'تعليمات للعميل', 'textarea'], ['isActive', 'مفعل', 'checkbox']])}
          </>
        )}
        {tab === 'about' && (
          <div className="form-grid">
            {inp('about.story', 'المقدمة', 'textarea')}
            {inp('about.vision', 'الرؤية', 'textarea')}
            {inp('about.mission', 'الرسالة', 'textarea')}
            {inp('about.goals', 'الأهداف (هدف في كل سطر)', 'lines', { rows: 8 })}
            {inp('about.audiences', 'الفئات المستهدفة (فئة في كل سطر)', 'lines', { rows: 6 })}
          </div>
        )}
        {tab === 'policies' && (
          <div className="form-grid">
            <p className="full muted small">يدعم تنسيق Markdown (## عنوان، - قائمة).</p>
            {inp('policies.shipping', 'سياسة الشحن', 'textarea', { rows: 8 })}
            {inp('policies.returns', 'سياسة الاسترجاع', 'textarea', { rows: 8 })}
            {inp('policies.privacy', 'سياسة الخصوصية', 'textarea', { rows: 8 })}
            {inp('policies.terms', 'شروط الاستخدام', 'textarea', { rows: 8 })}
          </div>
        )}
      </div>
    </div>
  );
}
