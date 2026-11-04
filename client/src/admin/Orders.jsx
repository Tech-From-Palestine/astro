import { useState } from 'react';
import { api, qs } from '../api';
import { useFetch } from '../utils/useFetch';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { Badge, ErrorBox, Field, Loader, Modal, Pagination, Empty } from '../components/UI';
import Invoice from '../components/Invoice';
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD, date, dateTime, money } from '../utils/format';

function OrderModal({ id, onClose, onChanged }) {
  const { data: o, loading, setData } = useFetch(`/orders/${id}`, [id]);
  const { currency } = useSettings();
  const { can } = useAuth();
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [tracking, setTracking] = useState('');
  const [refund, setRefund] = useState({ amount: '', reason: '', restock: false });
  const [error, setError] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  const run = async (fn) => {
    setError(null);
    try { setData(await fn()); onChanged(); } catch (e) { setError(e); }
  };

  if (loading) return <Modal title="الطلب" onClose={onClose}><Loader /></Modal>;
  return (
    <Modal title={`الطلب ${o.orderNumber}`} onClose={onClose} wide>
      {showInvoice ? (
        <div className="print-area">
          <div className="row-gap no-print mb"><button className="btn" onClick={() => window.print()}>🖨 طباعة / حفظ PDF</button><button className="btn btn-ghost" onClick={() => setShowInvoice(false)}>رجوع</button></div>
          <Invoice order={o} />
        </div>
      ) : (
        <div className="stack">
          <ErrorBox error={error} />
          <div className="grid-3">
            <div className="card flat"><b>العميل</b><p>{o.customer.name}<br /><span dir="ltr">{o.customer.phone}</span><br />{o.customer.email}</p></div>
            <div className="card flat"><b>التوصيل</b><p>{o.shipping.city} — {o.shipping.address}<br />{o.shipping.method?.name}{o.shipping.notes && <><br /><i>📝 {o.shipping.notes}</i></>}</p></div>
            <div className="card flat"><b>الدفع</b><p>{PAYMENT_METHOD[o.paymentMethod]}<br /><Badge value={o.paymentStatus}>{PAYMENT_STATUS[o.paymentStatus]}</Badge><br />مدفوع: {money(o.amountPaid, currency)}</p></div>
          </div>
          <table className="table">
            <thead><tr><th>المنتج</th><th>السعر</th><th>الكمية</th><th>التكلفة</th><th>المجموع</th></tr></thead>
            <tbody>{o.items.map((i, k) => <tr key={k}><td>{i.name}</td><td>{money(i.price, currency)}</td><td>{i.qty}</td><td className="muted">{money(i.cost * i.qty, currency)}</td><td>{money(i.price * i.qty, currency)}</td></tr>)}</tbody>
          </table>
          <div className="totals narrow-totals">
            <div><span>المجموع الفرعي</span><span>{money(o.subtotal, currency)}</span></div>
            {o.discount > 0 && <div><span>الخصم ({o.coupon})</span><span>-{money(o.discount, currency)}</span></div>}
            <div><span>التوصيل</span><span>{money(o.shippingCost, currency)}</span></div>
            <div className="grand"><span>الإجمالي</span><span>{money(o.total, currency)}</span></div>
            <div className="muted"><span>تكلفة البضاعة / الربح الإجمالي</span><span>{money(o.costOfGoods, currency)} / {money(o.subtotal - o.discount - o.costOfGoods, currency)}</span></div>
          </div>

          <div className="grid-2">
            <div className="card flat">
              <h4>تحديث حالة الطلب</h4>
              <Field label="الحالة"><select value={status || o.status} onChange={(e) => setStatus(e.target.value)}>{Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
              <Field label="رقم الشحنة"><input dir="ltr" defaultValue={o.shipping.trackingNumber} onChange={(e) => setTracking(e.target.value)} /></Field>
              <Field label="ملاحظة"><input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
              <button className="btn btn-sm" disabled={o.status === 'cancelled'} onClick={() => run(() => api.patch(`/orders/${id}/status`, { status: status || o.status, note, trackingNumber: tracking || undefined }))}>حفظ الحالة</button>
              <h4 className="mt">سجل الحالة</h4>
              <ul className="history">{o.statusHistory.map((h, i) => <li key={i}><b>{ORDER_STATUS[h.status]}</b> <small className="muted">{dateTime(h.at)}</small>{h.note && <> — {h.note}</>}</li>)}</ul>
            </div>
            <div className="card flat">
              <h4>الدفع</h4>
              <div className="row-gap wrap">
                {o.paymentStatus !== 'paid' && <button className="btn btn-sm" onClick={() => run(() => api.patch(`/orders/${id}/payment`, { paymentStatus: 'paid' }))}>تسجيل كمدفوع</button>}
                {o.paymentStatus === 'paid' && <button className="btn btn-ghost btn-sm" onClick={() => run(() => api.patch(`/orders/${id}/payment`, { paymentStatus: 'pending' }))}>إلغاء الدفع</button>}
                <button className="btn btn-ghost btn-sm" onClick={() => setShowInvoice(true)}>🧾 الفاتورة</button>
              </div>
              {can('finance') && o.amountPaid > o.refundedTotal && (
                <>
                  <h4 className="mt">استرداد مبلغ</h4>
                  <div className="row-gap">
                    <input type="number" placeholder="المبلغ" value={refund.amount} onChange={(e) => setRefund({ ...refund, amount: e.target.value })} />
                    <input placeholder="السبب" value={refund.reason} onChange={(e) => setRefund({ ...refund, reason: e.target.value })} />
                  </div>
                  <label className="check"><input type="checkbox" checked={refund.restock} onChange={(e) => setRefund({ ...refund, restock: e.target.checked })} /> إعادة المنتجات للمخزون</label>
                  <button className="btn btn-danger btn-sm" onClick={() => run(() => api.post(`/orders/${id}/refund`, refund))}>تنفيذ الاسترداد</button>
                </>
              )}
              {o.refunds?.length > 0 && <ul className="history">{o.refunds.map((r) => <li key={r._id}>{money(r.amount, currency)} — {r.reason} <small className="muted">{date(r.at)}</small></li>)}</ul>}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Orders() {
  const [f, setF] = useState({ status: '', paymentStatus: '', q: '', from: '', to: '', page: 1 });
  const { data, loading, error, reload } = useFetch(`/orders${qs(f)}`, [JSON.stringify(f)]);
  const [open, setOpen] = useState(null);
  const { currency } = useSettings();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value, page: 1 });

  return (
    <div className="stack">
      <div className="admin-head"><h1>الطلبات</h1></div>
      <div className="card filters-row">
        <input placeholder="رقم الطلب / الاسم / الهاتف" onKeyDown={(e) => e.key === 'Enter' && setF({ ...f, q: e.target.value, page: 1 })} />
        <select value={f.status} onChange={set('status')}><option value="">كل الحالات</option>{Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={f.paymentStatus} onChange={set('paymentStatus')}><option value="">كل حالات الدفع</option>{Object.entries(PAYMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <input type="date" value={f.from} onChange={set('from')} aria-label="من" />
        <input type="date" value={f.to} onChange={set('to')} aria-label="إلى" />
      </div>
      <ErrorBox error={error} />
      {loading ? <Loader /> : !data.items.length ? <Empty title="لا توجد طلبات" /> : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>رقم الطلب</th><th>العميل</th><th>التاريخ</th><th>الإجمالي</th><th>الدفع</th><th>الحالة</th><th /></tr></thead>
            <tbody>{data.items.map((o) => (
              <tr key={o._id}>
                <td dir="ltr">{o.orderNumber}</td>
                <td>{o.customer.name}<br /><small className="muted" dir="ltr">{o.customer.phone}</small></td>
                <td>{date(o.createdAt)}</td>
                <td>{money(o.total, currency)}</td>
                <td><Badge value={o.paymentStatus}>{PAYMENT_STATUS[o.paymentStatus]}</Badge><br /><small className="muted">{PAYMENT_METHOD[o.paymentMethod]}</small></td>
                <td><Badge value={o.status}>{ORDER_STATUS[o.status]}</Badge></td>
                <td><button className="btn btn-sm" onClick={() => setOpen(o._id)}>إدارة</button></td>
              </tr>
            ))}</tbody>
          </table>
          <Pagination page={data.page} pages={data.pages} onChange={(page) => setF({ ...f, page })} />
        </div>
      )}
      {open && <OrderModal id={open} onClose={() => setOpen(null)} onChanged={reload} />}
    </div>
  );
}
