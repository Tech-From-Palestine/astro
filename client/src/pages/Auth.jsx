import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorBox, Field } from '../components/UI';
import { CUSTOMER_TYPE } from '../utils/format';

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      const u = await login(form.email, form.password);
      nav(sp.get('next') || (['admin', 'staff'].includes(u.role) ? '/admin' : '/account'));
    } catch (err) { setError(err); } finally { setBusy(false); }
  };
  return (
    <div className="auth-wrap">
      <form className="card auth" onSubmit={submit}>
        <h1>تسجيل الدخول</h1>
        <Field label="البريد الإلكتروني"><input required type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="كلمة المرور"><input required type="password" dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <ErrorBox error={error} />
        <button className="btn btn-lg block" disabled={busy}>{busy ? '…' : 'دخول'}</button>
        <p className="center">ليس لديك حساب؟ <Link to="/register">أنشئ حساباً</Link></p>
      </form>
    </div>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', customerType: 'student', company: '' });
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setError(null);
    try { await register(form); nav('/account'); } catch (err) { setError(err); }
  };
  return (
    <div className="auth-wrap">
      <form className="card auth" onSubmit={submit}>
        <h1>إنشاء حساب</h1>
        <Field label="الاسم الكامل"><input required value={form.name} onChange={set('name')} /></Field>
        <Field label="البريد الإلكتروني"><input required type="email" dir="ltr" value={form.email} onChange={set('email')} /></Field>
        <Field label="رقم الهاتف"><input type="tel" dir="ltr" value={form.phone} onChange={set('phone')} /></Field>
        <Field label="أنا">
          <select value={form.customerType} onChange={set('customerType')}>
            {Object.entries(CUSTOMER_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        {['startup', 'school', 'company', 'lab'].includes(form.customerType) && (
          <Field label="اسم الجهة"><input value={form.company} onChange={set('company')} /></Field>
        )}
        <Field label="كلمة المرور" hint="6 أحرف على الأقل"><input required minLength={6} type="password" dir="ltr" value={form.password} onChange={set('password')} /></Field>
        <ErrorBox error={error} />
        <button className="btn btn-lg block">إنشاء الحساب</button>
        <p className="center">لديك حساب؟ <Link to="/login">سجّل الدخول</Link></p>
      </form>
    </div>
  );
}
