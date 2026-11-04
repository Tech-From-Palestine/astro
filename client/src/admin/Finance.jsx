import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useFetch } from '../utils/useFetch';
import { useSettings } from '../context/SettingsContext';
import { ErrorBox, Loader } from '../components/UI';
import { Stat } from './Dashboard';
import { EXPENSE_CAT, PAYMENT_METHOD, money } from '../utils/format';
import { qs } from '../api';

const iso = (d) => d.toISOString().slice(0, 10);

export default function Finance() {
  const today = new Date();
  const [range, setRange] = useState({ from: iso(new Date(today.getFullYear(), today.getMonth() - 2, 1)), to: iso(today) });
  const { data: f, loading, error } = useFetch(`/admin/finance${qs(range)}`, [range.from, range.to]);
  const { currency } = useSettings();
  const m = (v) => money(v, currency);

  const exportCsv = () => {
    const rows = [['الشهر', 'المبيعات', 'تكلفة البضاعة', 'المصاريف', 'الربح'], ...f.monthly.map((x) => [x.month, x.sales, x.cogs, x.expenses, x.profit])];
    const blob = new Blob(['﻿' + rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `astro-finance-${range.from}_${range.to}.csv`;
    a.click();
  };

  return (
    <div className="stack">
      <div className="admin-head">
        <h1>التقارير المالية</h1>
        <div className="row-gap no-print">
          <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} aria-label="من" />
          <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} aria-label="إلى" />
          {f && <button className="btn btn-ghost btn-sm" onClick={exportCsv}>⬇ CSV</button>}
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>🖨 طباعة</button>
        </div>
      </div>
      <ErrorBox error={error} />
      {loading ? <Loader /> : f && (
        <>
          <div className="grid-4">
            <Stat label="إجمالي المبيعات" value={m(f.sales)} sub={`${f.ordersCount} طلب · متوسط ${m(f.averageOrder)}`} />
            <Stat label="المبالغ المحصّلة" value={m(f.collected)} />
            <Stat label="تكلفة البضاعة المباعة" value={m(f.cogs)} />
            <Stat label="الربح الإجمالي" value={m(f.grossProfit)} sub={`هامش ${f.grossMargin}%`} tone="ok" />
            <Stat label="المصاريف" value={m(f.expenses)} tone="warn" />
            <Stat label="الاستردادات" value={m(f.refunds)} sub={`${f.refundsCount} عملية`} tone={f.refunds ? 'bad' : ''} />
            <Stat label="صافي الربح" value={m(f.netProfit)} sub={`هامش ${f.netMargin}%`} tone={f.netProfit >= 0 ? 'ok' : 'bad'} />
            <Stat label="المبالغ المستحقة (غير محصلة)" value={m(f.receivables.amount)} sub={`${f.receivables.count} طلب`} tone="warn" />
          </div>

          <div className="card">
            <h3>الأداء الشهري</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={f.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis dataKey="month" reversed />
                  <YAxis orientation="right" />
                  <Tooltip formatter={(v) => m(v)} />
                  <Legend />
                  <Bar dataKey="sales" name="المبيعات" fill="#0891b2" />
                  <Bar dataKey="cogs" name="تكلفة البضاعة" fill="#94a3b8" />
                  <Bar dataKey="expenses" name="المصاريف" fill="#f59e0b" />
                  <Bar dataKey="profit" name="الربح" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>الأكثر مبيعاً وربحاً</h3>
              <table className="table">
                <thead><tr><th>المنتج</th><th>الكمية</th><th>الإيراد</th><th>الربح</th></tr></thead>
                <tbody>{f.topProducts.map((p) => <tr key={p._id}><td>{p.name}</td><td>{p.qty}</td><td>{m(p.revenue)}</td><td>{m(p.profit)}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="stack">
              <div className="card">
                <h3>المصاريف حسب البند</h3>
                <table className="table"><tbody>{Object.entries(f.expensesByCategory).map(([k, v]) => <tr key={k}><td>{EXPENSE_CAT[k] || k}</td><td>{m(v)}</td></tr>)}</tbody></table>
              </div>
              <div className="card">
                <h3>المبيعات حسب طريقة الدفع</h3>
                <table className="table"><tbody>{f.byPayment.map((p) => <tr key={p._id}><td>{PAYMENT_METHOD[p._id] || p._id}</td><td>{p.count} طلب</td><td>{m(p.total)}</td></tr>)}</tbody></table>
              </div>
              <div className="card">
                <h3>ملخص الإيرادات</h3>
                <div className="totals">
                  <div><span>إيراد المنتجات (بعد الخصم)</span><span>{m(f.productRevenue)}</span></div>
                  <div><span>إيراد التوصيل</span><span>{m(f.shippingRevenue)}</span></div>
                  <div><span>− تكلفة البضاعة</span><span>{m(f.cogs)}</span></div>
                  <div><span>− المصاريف</span><span>{m(f.expenses)}</span></div>
                  <div><span>− الاستردادات</span><span>{m(f.refunds)}</span></div>
                  <div className="grand"><span>صافي الربح</span><span>{m(f.netProfit)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
