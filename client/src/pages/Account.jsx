import { useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useFetch } from '../utils/useFetch';
import { Badge, Empty, ErrorBox, Field, Loader, PageHead } from '../components/UI';
import ProductCard from '../components/ProductCard';
import OrderTimeline from '../components/OrderTimeline';
import Invoice from '../components/Invoice';
import { CUSTOMER_TYPE, ORDER_STATUS, PAYMENT_STATUS, REQUEST_STATUS, REQUEST_TYPE, date, money } from '../utils/format';

function Profile() {
  const { user, setUser } = useAuth();
  const addr = user.addresses?.[0] || {};
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', customerType: user.customerType, company: user.company || '', city: addr.city || '', address: addr.address || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setError(null);
    try {
      const u = await api.put('/auth/me', { ...form, addresses: [{ label: 'الرئيسي', city: form.city, address: form.address, phone: form.phone }] });
      setUser(u); setMsg('تم حفظ البيانات');
    } catch (err) { setError(err); }
  };
  const changePw = async (e) => {
    e.preventDefault(); setError(null);
    try { await api.put('/auth/me/password', pw); setPw({ currentPassword: '', newPassword: '' }); setMsg('تم تغيير كلمة المرور'); } catch (err) { setError(err); }
  };

  return (
    <div className="stack">
      {msg && <div className="alert alert-ok">{msg}</div>}
      <ErrorBox error={error} />
      <form className="card form-grid" onSubmit={save}>
        <h3 className="full">البيانات الشخصية</h3>
        <Field label="الاسم"><input value={form.name} onChange={set('name')} /></Field>
        <Field label="البريد"><input value={user.email} disabled dir="ltr" /></Field>
        <Field label="الهاتف"><input dir="ltr" value={form.phone} onChange={set('phone')} /></Field>
        <Field label="الفئة"><select value={form.customerType} onChange={set('customerType')}>{Object.entries(CUSTOMER_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="الجهة"><input value={form.company} onChange={set('company')} /></Field>
        <Field label="المدينة"><input value={form.city} onChange={set('city')} /></Field>
        <Field label="عنوان التوصيل الافتراضي" full><input value={form.address} onChange={set('address')} /></Field>
        <button className="btn">حفظ</button>
      </form>
      <form className="card form-grid" onSubmit={changePw}>
        <h3 className="full">تغيير كلمة المرور</h3>
        <Field label="الحالية"><input type="password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
        <Field label="الجديدة"><input type="password" required minLength={6} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
        <button className="btn btn-ghost">تغيير</button>
      </form>
    </div>
  );
}

function Orders() {
  const { data, loading } = useFetch('/orders/mine');
  const { currency } = useSettings();
  if (loading) return <Loader />;
  if (!data.length) return <Empty icon="📦" title="لا توجد طلبات بعد"><Link to="/store" className="btn">ابدأ التسوق</Link></Empty>;
  return (
    <div className="card">
      <table className="table">
        <thead><tr><th>رقم الطلب</th><th>التاريخ</th><th>الإجمالي</th><th>الحالة</th><th>الدفع</th><th /></tr></thead>
        <tbody>
          {data.map((o) => (
            <tr key={o._id}>
              <td dir="ltr">{o.orderNumber}</td><td>{date(o.createdAt)}</td><td>{money(o.total, currency)}</td>
              <td><Badge value={o.status}>{ORDER_STATUS[o.status]}</Badge></td>
              <td><Badge value={o.paymentStatus}>{PAYMENT_STATUS[o.paymentStatus]}</Badge></td>
              <td><Link to={`/account/orders/${o._id}`} className="link">التفاصيل</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderDetail() {
  const { id } = useParams();
  const { data: o, loading, error, setData } = useFetch(`/orders/${id}`, [id]);
  const [err, setErr] = useState(null);
  if (loading) return <Loader />;
  if (error) return <ErrorBox error={error} />;
  const cancel = async () => {
    if (!window.confirm('هل تريد إلغاء الطلب؟')) return;
    try { setData(await api.post(`/orders/${id}/cancel`)); } catch (e) { setErr(e); }
  };
  return (
    <div className="stack">
      <div className="card">
        <div className="row-between"><h3 dir="ltr">{o.orderNumber}</h3>
          <div className="row-gap no-print">
            {['pending', 'confirmed'].includes(o.status) && <button className="btn btn-ghost btn-sm" onClick={cancel}>إلغاء الطلب</button>}
            <button className="btn btn-sm" onClick={() => window.print()}>🖨 طباعة الفاتورة</button>
          </div>
        </div>
        <ErrorBox error={err} />
        <OrderTimeline order={o} />
        {o.shipping.trackingNumber && <p>رقم الشحنة: <b dir="ltr">{o.shipping.trackingNumber}</b></p>}
      </div>
      <div className="card print-area"><Invoice order={o} /></div>
    </div>
  );
}

function Favorites() {
  const { data, loading } = useFetch('/auth/me/favorites');
  if (loading) return <Loader />;
  if (!data.length) return <Empty icon="♡" title="لا توجد منتجات في المفضلة" />;
  return <div className="grid-products">{data.map((p) => <ProductCard key={p._id} product={p} />)}</div>;
}

function Requests() {
  const { data, loading } = useFetch('/requests/mine');
  if (loading) return <Loader />;
  if (!data.length) return <Empty icon="📝" title="لا توجد طلبات خدمات"><Link to="/services" className="btn">تصفح الخدمات</Link></Empty>;
  return (
    <div className="card">
      <table className="table">
        <thead><tr><th>النوع</th><th>الخدمة</th><th>التاريخ</th><th>الحالة</th></tr></thead>
        <tbody>{data.map((r) => (
          <tr key={r._id}><td>{REQUEST_TYPE[r.type]}</td><td>{r.service?.title || '—'}</td><td>{date(r.createdAt)}</td><td><Badge value={r.status}>{REQUEST_STATUS[r.status]}</Badge></td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export default function Account() {
  const { user, ready, logout } = useAuth();
  if (!ready) return <Loader />;
  if (!user) return <Navigate to="/login?next=/account" replace />;
  return (
    <>
      <PageHead title={`مرحباً، ${user.name}`} crumbs={[{ label: 'حسابي' }]} />
      <div className="container section account">
        <aside className="card side-nav no-print">
          <NavLink to="/account" end>البيانات الشخصية</NavLink>
          <NavLink to="/account/orders">طلباتي</NavLink>
          <NavLink to="/account/favorites">المفضلة</NavLink>
          <NavLink to="/account/requests">طلبات الخدمات</NavLink>
          <button onClick={logout}>تسجيل الخروج</button>
        </aside>
        <section>
          <Routes>
            <Route index element={<Profile />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="requests" element={<Requests />} />
          </Routes>
        </section>
      </div>
    </>
  );
}
