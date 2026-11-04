import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Empty, ErrorBox, Field, PageHead } from '../components/UI';
import { money } from '../utils/format';

export default function Checkout() {
  const { items, clear } = useCart();
  const { user } = useAuth();
  const { settings, currency } = useSettings();
  const nav = useNavigate();
  const shippingMethods = settings?.shippingMethods?.filter((m) => m.isActive) || [];
  const paymentMethods = settings?.paymentMethods?.filter((m) => m.isActive) || [];
  const addr = user?.addresses?.[0];

  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || addr?.phone || '',
    city: addr?.city || '', address: addr?.address || '', notes: '',
  });
  const [shippingMethod, setShipping] = useState('');
  const [paymentMethod, setPayment] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState('');
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!shippingMethod && shippingMethods[0]) setShipping(shippingMethods[0].code); }, [shippingMethods, shippingMethod]);
  useEffect(() => { if (!paymentMethod && paymentMethods[0]) setPayment(paymentMethods[0].code); }, [paymentMethods, paymentMethod]);

  const payload = { items: items.map((i) => ({ product: i.product, qty: i.qty })), coupon, shippingMethod };
  useEffect(() => {
    if (!items.length || !shippingMethod) return;
    api.post('/orders/quote', payload).then((q) => { setQuote(q); setError(null); }).catch((e) => {
      if (coupon) { setCouponError(e); setCoupon(''); } else setError(e);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(payload)]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const order = await api.post('/orders', {
        ...payload, paymentMethod,
        customer: { name: form.name, email: form.email, phone: form.phone },
        shipping: { city: form.city, address: form.address, notes: form.notes },
      });
      clear();
      nav(`/order-success/${order.orderNumber}`, { state: { order } });
    } catch (err) { setError(err); } finally { setBusy(false); }
  };

  if (!items.length) return <div className="container section"><Empty icon="🛒" title="السلة فارغة"><Link to="/store" className="btn">تصفح المتجر</Link></Empty></div>;
  const pm = paymentMethods.find((p) => p.code === paymentMethod);

  return (
    <>
      <PageHead title="إتمام الطلب" crumbs={[{ label: 'السلة', to: '/cart' }, { label: 'إتمام الطلب' }]} />
      <form className="container section checkout-grid" onSubmit={submit}>
        <div className="stack">
          {!user && <div className="alert alert-info">لديك حساب؟ <Link to="/login?next=/checkout">سجّل الدخول</Link> لمتابعة طلباتك بسهولة، أو أكمل كزائر.</div>}
          <div className="card">
            <h3>1. بيانات التوصيل</h3>
            <div className="form-grid">
              <Field label="الاسم الكامل *"><input required value={form.name} onChange={set('name')} /></Field>
              <Field label="رقم الهاتف *"><input required type="tel" dir="ltr" value={form.phone} onChange={set('phone')} /></Field>
              <Field label="البريد الإلكتروني"><input type="email" dir="ltr" value={form.email} onChange={set('email')} /></Field>
              <Field label="المدينة *"><input required value={form.city} onChange={set('city')} /></Field>
              <Field label="العنوان التفصيلي *" full><input required value={form.address} onChange={set('address')} /></Field>
              <Field label="ملاحظات للطلب" full><textarea rows="2" value={form.notes} onChange={set('notes')} /></Field>
            </div>
          </div>
          <div className="card">
            <h3>2. طريقة التوصيل</h3>
            <div className="options">
              {shippingMethods.map((m) => (
                <label key={m.code} className={`option ${shippingMethod === m.code ? 'active' : ''}`}>
                  <input type="radio" name="ship" checked={shippingMethod === m.code} onChange={() => setShipping(m.code)} />
                  <span><b>{m.name}</b><small className="muted">{m.eta}{m.freeOver ? ` · مجاني فوق ${money(m.freeOver, currency)}` : ''}</small></span>
                  <b>{m.cost ? money(m.cost, currency) : 'مجاني'}</b>
                </label>
              ))}
            </div>
          </div>
          <div className="card">
            <h3>3. طريقة الدفع</h3>
            <div className="options">
              {paymentMethods.map((m) => (
                <label key={m.code} className={`option ${paymentMethod === m.code ? 'active' : ''}`}>
                  <input type="radio" name="pay" checked={paymentMethod === m.code} onChange={() => setPayment(m.code)} />
                  <span><b>{m.name}</b></span>
                </label>
              ))}
            </div>
            {pm?.instructions && <p className="alert alert-info mt">{pm.instructions}</p>}
          </div>
        </div>

        <aside className="card summary">
          <h3>مراجعة الطلب</h3>
          <ul className="mini-items">
            {(quote?.items || items).map((i) => (
              <li key={i.product}><span>{i.name} × {i.qty}</span><b>{money(i.price * i.qty, currency)}</b></li>
            ))}
          </ul>
          <div className="coupon">
            <input placeholder="كود الخصم" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} dir="ltr" />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setCouponError(null); setCoupon(couponInput.trim()); }}>تطبيق</button>
          </div>
          <ErrorBox error={couponError} />
          {quote?.discount > 0 && <div className="alert alert-ok small">تم تطبيق الكوبون {coupon.toUpperCase()}</div>}
          <ErrorBox error={error} />
          {quote && (
            <div className="totals">
              <div><span>المجموع الفرعي</span><span>{money(quote.subtotal, currency)}</span></div>
              {quote.discount > 0 && <div><span>الخصم</span><span>- {money(quote.discount, currency)}</span></div>}
              <div><span>التوصيل</span><span>{quote.shippingCost ? money(quote.shippingCost, currency) : 'مجاني'}</span></div>
              {quote.tax > 0 && <div><span>الضريبة</span><span>{money(quote.tax, currency)}</span></div>}
              <div className="grand"><span>الإجمالي</span><span>{money(quote.total, currency)}</span></div>
            </div>
          )}
          <button className="btn btn-lg block" disabled={busy || !quote}>{busy ? 'جارٍ إرسال الطلب…' : 'تأكيد الطلب'}</button>
          <p className="muted small center">بتأكيد الطلب فإنك توافق على <Link to="/policies/terms">الشروط</Link> و<Link to="/policies/returns">سياسة الاسترجاع</Link>.</p>
        </aside>
      </form>
    </>
  );
}
