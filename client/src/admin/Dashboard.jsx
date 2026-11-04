import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useFetch } from '../utils/useFetch';
import { useSettings } from '../context/SettingsContext';
import { Badge, ErrorBox, Loader } from '../components/UI';
import { ORDER_STATUS, PAYMENT_STATUS, date, money } from '../utils/format';

export const Stat = ({ label, value, sub, tone }) => (
  <div className={`card stat ${tone ? `stat-${tone}` : ''}`}>
    <small>{label}</small>
    <b>{value}</b>
    {sub && <span className="muted small">{sub}</span>}
  </div>
);

export default function Dashboard() {
  const { data: s, loading, error } = useFetch('/admin/stats');
  const { currency } = useSettings();
  if (loading) return <Loader />;
  if (error) return <ErrorBox error={error} />;
  const pendingOrders = (s.ordersByStatus.pending || 0) + (s.ordersByStatus.confirmed || 0) + (s.ordersByStatus.processing || 0);

  return (
    <div className="stack">
      <div className="admin-head"><h1>لوحة المؤشرات</h1></div>
      <div className="grid-4">
        <Stat label="مبيعات آخر 30 يوماً" value={money(s.sales30.total, currency)} sub={`${s.sales30.count} طلب`} />
        <Stat label="طلبات بحاجة لمعالجة" value={pendingOrders} tone={pendingOrders ? 'warn' : ''} />
        <Stat label="العملاء" value={s.customers} />
        <Stat label="المنتجات النشطة" value={s.products} />
        <Stat label="طلبات خدمات جديدة" value={s.newRequests} tone={s.newRequests ? 'warn' : ''} />
        <Stat label="رسائل غير مقروءة" value={s.unreadMessages} />
        <Stat label="تم التسليم" value={s.ordersByStatus.delivered || 0} tone="ok" />
        <Stat label="منتجات منخفضة المخزون" value={s.lowStock.length} tone={s.lowStock.length ? 'bad' : ''} />
      </div>

      <div className="card">
        <h3>المبيعات اليومية (30 يوماً)</h3>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={s.daily.map((d) => ({ day: d._id.slice(5), total: d.total }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="day" reversed tick={{ fontSize: 12 }} />
              <YAxis orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => money(v, currency)} />
              <Area type="monotone" dataKey="total" name="المبيعات" stroke="#0891b2" fill="#22d3ee55" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="row-between"><h3>أحدث الطلبات</h3><Link to="/admin/orders" className="link">الكل</Link></div>
          <table className="table">
            <tbody>{s.recent.map((o) => (
              <tr key={o._id}>
                <td dir="ltr">{o.orderNumber}</td><td>{o.customer?.name}</td><td>{money(o.total, currency)}</td>
                <td><Badge value={o.status}>{ORDER_STATUS[o.status]}</Badge></td>
                <td><Badge value={o.paymentStatus}>{PAYMENT_STATUS[o.paymentStatus]}</Badge></td>
                <td className="muted small">{date(o.createdAt)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="card">
          <div className="row-between"><h3>تنبيهات المخزون</h3><Link to="/admin/inventory" className="link">إدارة المخزون</Link></div>
          {!s.lowStock.length ? <p className="muted">كل المنتجات بمخزون جيد ✓</p> : (
            <table className="table"><tbody>{s.lowStock.map((p) => (
              <tr key={p._id}><td>{p.name}</td><td dir="ltr" className="muted">{p.sku}</td><td><Badge tone={p.stock ? 'warn' : 'bad'}>{p.stock} متبقٍ</Badge></td></tr>
            ))}</tbody></table>
          )}
        </div>
      </div>
    </div>
  );
}
