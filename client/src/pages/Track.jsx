import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { ErrorBox, Field, PageHead, Badge } from '../components/UI';
import OrderTimeline from '../components/OrderTimeline';
import { useSettings } from '../context/SettingsContext';
import { money, PAYMENT_STATUS, date } from '../utils/format';

export default function Track() {
  const [sp] = useSearchParams();
  const [num, setNum] = useState(sp.get('order') || '');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const { currency } = useSettings();

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setOrder(null);
    try { setOrder(await api.get(`/orders/track/${encodeURIComponent(num.trim())}?phone=${encodeURIComponent(phone)}`)); }
    catch (err) { setError(err); }
  };

  return (
    <>
      <PageHead title="تتبع الطلب" subtitle="أدخل رقم الطلب ورقم الهاتف المستخدم عند الطلب" crumbs={[{ label: 'تتبع الطلب' }]} />
      <div className="container section narrow">
        <form className="card form-grid" onSubmit={submit}>
          <Field label="رقم الطلب"><input required dir="ltr" placeholder="AST-20260101-0001" value={num} onChange={(e) => setNum(e.target.value)} /></Field>
          <Field label="رقم الهاتف"><input required dir="ltr" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <button className="btn full">تتبع</button>
        </form>
        <ErrorBox error={error} />
        {order && (
          <div className="card mt">
            <div className="row-between">
              <h3 dir="ltr">{order.orderNumber}</h3>
              <Badge value={order.paymentStatus}>{PAYMENT_STATUS[order.paymentStatus]}</Badge>
            </div>
            <p className="muted">تاريخ الطلب: {date(order.createdAt)} · الإجمالي: {money(order.total, currency)}</p>
            <OrderTimeline order={order} />
            {order.shipping.trackingNumber && <p>رقم الشحنة: <b dir="ltr">{order.shipping.trackingNumber}</b></p>}
          </div>
        )}
      </div>
    </>
  );
}
