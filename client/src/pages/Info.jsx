import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useSettings } from '../context/SettingsContext';
import { ErrorBox, Field, Loader, Markdown, PageHead } from '../components/UI';

export function About() {
  const { settings } = useSettings();
  if (!settings) return <Loader />;
  const a = settings.about || {};
  return (
    <>
      <PageHead title="من نحن" subtitle={settings.tagline} crumbs={[{ label: 'من نحن' }]} />
      <div className="container section stack-lg">
        <div className="card lead"><p>{a.story}</p></div>
        <div className="grid-2">
          <div className="card"><h2>🔭 رؤيتنا</h2><p>{a.vision}</p></div>
          <div className="card"><h2>🎯 رسالتنا</h2><p>{a.mission}</p></div>
        </div>
        {a.goals?.length > 0 && (
          <div className="card">
            <h2>أهدافنا</h2>
            <ol className="goals">{a.goals.map((g) => <li key={g}>{g}</li>)}</ol>
          </div>
        )}
        {a.audiences?.length > 0 && (
          <div>
            <h2>لمن نعمل؟</h2>
            <div className="grid-4">{a.audiences.map((x) => <div key={x} className="card center audience">{x}</div>)}</div>
          </div>
        )}
        <div className="cta-box"><div><h2>لنبنِ مشروعك القادم معاً</h2></div><Link to="/contact" className="btn btn-lg">تواصل معنا</Link></div>
      </div>
    </>
  );
}

export function Contact() {
  const { settings } = useSettings();
  const c = settings?.contact || {};
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try { await api.post('/contact', form); setDone(true); } catch (err) { setError(err); }
  };
  return (
    <>
      <PageHead title="تواصل معنا" subtitle="فريقنا جاهز لمساعدتك في اختيار المكونات أو تنفيذ مشروعك." crumbs={[{ label: 'تواصل معنا' }]} />
      <div className="container section two-col">
        <div className="card stack">
          <h3>معلومات التواصل</h3>
          <p>📧 <a href={`mailto:${c.email}`}>{c.email}</a></p>
          <p>📞 <a href={`tel:${c.phone}`} dir="ltr">{c.phone}</a></p>
          {c.whatsapp && <p>💬 <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">واتساب</a></p>}
          <p>📍 {c.address}</p>
          <p>🕘 {c.hours}</p>
          <div className="chips">
            {Object.entries(settings?.social || {}).filter(([, v]) => v).map(([k, v]) => <a key={k} className="chip" href={v} target="_blank" rel="noreferrer">{k}</a>)}
          </div>
        </div>
        <div className="card">
          {done ? <div className="alert alert-ok">✓ تم إرسال رسالتك، سنرد عليك قريباً.</div> : (
            <form className="form-grid" onSubmit={submit}>
              <Field label="الاسم *"><input required value={form.name} onChange={set('name')} /></Field>
              <Field label="البريد *"><input required type="email" dir="ltr" value={form.email} onChange={set('email')} /></Field>
              <Field label="الهاتف"><input dir="ltr" value={form.phone} onChange={set('phone')} /></Field>
              <Field label="الموضوع"><input value={form.subject} onChange={set('subject')} /></Field>
              <Field label="الرسالة *" full><textarea required rows="5" value={form.message} onChange={set('message')} /></Field>
              <ErrorBox error={error} />
              <button className="btn full">إرسال</button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

const POLICY_TITLES = { shipping: 'سياسة الشحن والتوصيل', returns: 'سياسة الاسترجاع والاستبدال', privacy: 'سياسة الخصوصية', terms: 'شروط الاستخدام' };

export function Policy() {
  const { key } = useParams();
  const { settings } = useSettings();
  return (
    <>
      <PageHead title={POLICY_TITLES[key] || 'السياسات'} crumbs={[{ label: 'السياسات' }, { label: POLICY_TITLES[key] }]} />
      <div className="container section policy-layout">
        <aside className="card stack">
          {Object.entries(POLICY_TITLES).map(([k, v]) => <Link key={k} to={`/policies/${k}`} className={k === key ? 'active' : ''}>{v}</Link>)}
        </aside>
        <div className="card">{settings ? <Markdown text={settings.policies?.[key] || 'لم تتم إضافة هذه السياسة بعد.'} /> : <Loader />}</div>
      </div>
    </>
  );
}

export function NotFound() {
  return (
    <div className="container section center">
      <div className="success-icon bad">404</div>
      <h1>الصفحة غير موجودة</h1>
      <Link to="/" className="btn">العودة للرئيسية</Link>
    </div>
  );
}
