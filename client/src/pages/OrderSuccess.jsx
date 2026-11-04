import { Link, useLocation, useParams } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { money, PAYMENT_METHOD } from '../utils/format';

export default function OrderSuccess() {
  const { number } = useParams();
  const { state } = useLocation();
  const { settings, currency } = useSettings();
  const order = state?.order;
  const pm = settings?.paymentMethods?.find((p) => p.code === order?.paymentMethod);
  return (
    <div className="container section narrow center">
      <div className="success-icon">✓</div>
      <h1>تم استلام طلبك بنجاح</h1>
      <p>رقم الطلب: <b dir="ltr" className="code">{number}</b></p>
      {order && (
        <div className="card mt text-start">
          <div className="totals">
            <div><span>الإجمالي</span><b>{money(order.total, currency)}</b></div>
            <div><span>طريقة الدفع</span><span>{PAYMENT_METHOD[order.paymentMethod]}</span></div>
            <div><span>التوصيل</span><span>{order.shipping.method?.name} — {order.shipping.method?.eta}</span></div>
          </div>
          {pm?.instructions && <p className="alert alert-info">{pm.instructions}</p>}
        </div>
      )}
      <p className="muted">احتفظ برقم الطلب لمتابعة حالته. سيتواصل معك فريقنا لتأكيد الطلب.</p>
      <div className="hero-actions center-row">
        <Link className="btn" to={`/track?order=${number}`}>تتبع الطلب</Link>
        <Link className="btn btn-ghost" to="/store">متابعة التسوق</Link>
      </div>
    </div>
  );
}
