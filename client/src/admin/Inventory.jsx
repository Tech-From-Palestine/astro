import { useState } from 'react';
import { api } from '../api';
import { useFetch } from '../utils/useFetch';
import { useSettings } from '../context/SettingsContext';
import { Badge, ErrorBox, Loader } from '../components/UI';
import { money } from '../utils/format';

export default function Inventory() {
  const [low, setLow] = useState(false);
  const { data, loading, error, reload } = useFetch(`/products?all=1&limit=200&sort=name${low ? '&lowStock=1' : ''}`, [low]);
  const { currency } = useSettings();
  const [edits, setEdits] = useState({});

  const save = async (p) => {
    await api.patch(`/products/${p._id}/stock`, { stock: edits[p._id] });
    setEdits((e) => { const n = { ...e }; delete n[p._id]; return n; });
    reload();
  };
  const items = data?.items || [];
  const value = items.reduce((s, p) => s + p.stock * (p.cost || 0), 0);

  return (
    <div className="stack">
      <div className="admin-head">
        <h1>إدارة المخزون</h1>
        <label className="check"><input type="checkbox" checked={low} onChange={(e) => setLow(e.target.checked)} /> المنخفض فقط</label>
      </div>
      <p className="muted">قيمة المخزون المعروض (بسعر التكلفة): <b>{money(value, currency)}</b></p>
      <ErrorBox error={error} />
      {loading ? <Loader /> : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>المنتج</th><th>SKU</th><th>التصنيف</th><th>التكلفة</th><th>السعر</th><th>المباع</th><th>المخزون</th><th>تعديل</th></tr></thead>
            <tbody>{items.map((p) => (
              <tr key={p._id}>
                <td>{p.name}{!p.isActive && <small className="muted"> (مخفي)</small>}</td>
                <td dir="ltr" className="muted">{p.sku}</td>
                <td>{p.category?.name}</td>
                <td>{money(p.cost, currency)}</td>
                <td>{money(p.price, currency)}</td>
                <td>{p.sold}</td>
                <td><Badge tone={p.stock === 0 ? 'bad' : p.stock <= p.lowStockThreshold ? 'warn' : 'ok'}>{p.stock}</Badge></td>
                <td className="row-gap">
                  <input type="number" min="0" className="w-80" value={edits[p._id] ?? p.stock} onChange={(e) => setEdits({ ...edits, [p._id]: e.target.value })} />
                  {edits[p._id] !== undefined && <button className="btn btn-sm" onClick={() => save(p)}>حفظ</button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
