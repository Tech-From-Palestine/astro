import { money, date, PAYMENT_METHOD, PAYMENT_STATUS } from '../utils/format';
import { useSettings } from '../context/SettingsContext';

// فاتورة قابلة للطباعة/الحفظ PDF من المتصفح
export default function Invoice({ order }) {
  const { settings, currency } = useSettings();
  const c = settings?.contact || {};
  return (
    <div className="invoice">
      <div className="inv-head">
        <div>
          <h2>Electronics Astro</h2>
          <div className="muted small">{c.address} · {c.phone} · {c.email}</div>
        </div>
        <div className="inv-meta">
          <h3>فاتورة</h3>
          <div>رقم الفاتورة: <b dir="ltr">{order.invoiceNumber}</b></div>
          <div>رقم الطلب: <b dir="ltr">{order.orderNumber}</b></div>
          <div>التاريخ: {date(order.createdAt)}</div>
        </div>
      </div>
      <div className="inv-parties">
        <div><b>العميل</b><br />{order.customer.name}<br /><span dir="ltr">{order.customer.phone}</span><br />{order.customer.email}</div>
        <div><b>التوصيل</b><br />{order.shipping.city} — {order.shipping.address}<br />{order.shipping.method?.name}</div>
        <div><b>الدفع</b><br />{PAYMENT_METHOD[order.paymentMethod] || order.paymentMethod}<br />{PAYMENT_STATUS[order.paymentStatus]}</div>
      </div>
      <table className="table">
        <thead><tr><th>#</th><th>المنتج</th><th>السعر</th><th>الكمية</th><th>المجموع</th></tr></thead>
        <tbody>
          {order.items.map((i, k) => (
            <tr key={k}><td>{k + 1}</td><td>{i.name}{i.sku && <small className="muted" dir="ltr"> ({i.sku})</small>}</td><td>{money(i.price, currency)}</td><td>{i.qty}</td><td>{money(i.price * i.qty, currency)}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="totals">
        <div><span>المجموع الفرعي</span><span>{money(order.subtotal, currency)}</span></div>
        {order.discount > 0 && <div><span>الخصم {order.coupon && `(${order.coupon})`}</span><span>- {money(order.discount, currency)}</span></div>}
        <div><span>التوصيل</span><span>{money(order.shippingCost, currency)}</span></div>
        <div className="grand"><span>الإجمالي</span><span>{money(order.total, currency)}</span></div>
        {order.refundedTotal > 0 && <div><span>المسترد</span><span>- {money(order.refundedTotal, currency)}</span></div>}
      </div>
      <p className="muted small center">شكراً لاختيارك Electronics Astro</p>
    </div>
  );
}
