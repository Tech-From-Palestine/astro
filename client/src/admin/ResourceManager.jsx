import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useFetch } from '../utils/useFetch';
import { ErrorBox, Field, Loader, Modal, Empty } from '../components/UI';

/** حقل نموذج عام */
export function FormField({ f, value, onChange, options }) {
  const v = value ?? '';
  switch (f.type) {
    case 'textarea':
      return <textarea rows={f.rows || 4} value={v} onChange={(e) => onChange(e.target.value)} />;
    case 'number':
      return <input type="number" step="any" value={v} onChange={(e) => onChange(e.target.value === '' ? '' : +e.target.value)} />;
    case 'checkbox':
      return <label className="check"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {f.checkLabel || 'نعم'}</label>;
    case 'date':
      return <input type="date" value={v ? String(v).slice(0, 10) : ''} onChange={(e) => onChange(e.target.value)} />;
    case 'select':
      return (
        <select value={v} onChange={(e) => onChange(e.target.value)}>
          {f.placeholder && <option value="">{f.placeholder}</option>}
          {(options || f.options || []).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      );
    case 'multi':
      return (
        <select multiple size={6} value={value || []} onChange={(e) => onChange([...e.target.selectedOptions].map((o) => o.value))}>
          {(options || []).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      );
    case 'tags': // قائمة مفصولة بفواصل
      return <input value={(value || []).join('، ')} onChange={(e) => onChange(e.target.value.split(/[,،]/).map((s) => s.trim()).filter(Boolean))} />;
    case 'lines': // عنصر في كل سطر
      return <textarea rows={f.rows || 4} value={(value || []).join('\n')} onChange={(e) => onChange(e.target.value.split('\n'))} />;
    case 'specs':
      return <SpecsEditor value={value || []} onChange={onChange} />;
    default:
      return <input type={f.inputType || 'text'} dir={f.ltr ? 'ltr' : undefined} value={v} onChange={(e) => onChange(e.target.value)} />;
  }
}

function SpecsEditor({ value, onChange }) {
  const upd = (i, k, val) => onChange(value.map((s, j) => (j === i ? { ...s, [k]: val } : s)));
  return (
    <div className="specs-editor">
      {value.map((s, i) => (
        <div key={i} className="row-gap">
          <input placeholder="الخاصية" value={s.key} onChange={(e) => upd(i, 'key', e.target.value)} />
          <input placeholder="القيمة" value={s.value} onChange={(e) => upd(i, 'value', e.target.value)} />
          <button type="button" className="icon-btn" onClick={() => onChange(value.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange([...value, { key: '', value: '' }])}>+ إضافة مواصفة</button>
    </div>
  );
}

function normalize(item, fields) {
  const out = { ...item };
  for (const f of fields) {
    const v = out[f.name];
    if (f.type === 'multi' && Array.isArray(v)) out[f.name] = v.map((x) => (typeof x === 'object' ? x._id : x));
    else if (f.type === 'select' && v && typeof v === 'object') out[f.name] = v._id;
    if (f.type === 'lines' && Array.isArray(out[f.name])) out[f.name] = out[f.name].filter((s) => s.trim());
  }
  return out;
}

/**
 * مدير موارد عام: جدول + بحث + نموذج إضافة/تعديل + حذف
 */
export default function ResourceManager({
  title, endpoint, listPath, columns, fields, defaults = {}, optionsFor = {}, canDelete = true, searchable = true, extraActions,
}) {
  const [q, setQ] = useState('');
  const path = (listPath || `${endpoint}?all=1&limit=500`) + (q ? `&q=${encodeURIComponent(q)}` : '');
  const { data, loading, error, reload } = useFetch(path, [q]);
  const [editing, setEditing] = useState(null);
  const [saveErr, setSaveErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const items = useMemo(() => (Array.isArray(data) ? data : data?.items || []), [data]);

  useEffect(() => setSaveErr(null), [editing]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = normalize(editing, fields);
      if (editing._id) await api.put(`${endpoint}/${editing._id}`, body);
      else await api.post(endpoint, body);
      setEditing(null);
      reload();
    } catch (err) { setSaveErr(err); } finally { setBusy(false); }
  };

  const remove = async (item) => {
    if (!window.confirm('تأكيد الحذف؟')) return;
    try { await api.del(`${endpoint}/${item._id}`); reload(); } catch (err) { alert(err.message); }
  };

  return (
    <div className="stack">
      <div className="admin-head">
        <h1>{title}</h1>
        <div className="row-gap">
          {searchable && <input className="search-inline" placeholder="بحث…" onKeyDown={(e) => e.key === 'Enter' && setQ(e.target.value)} />}
          <button className="btn" onClick={() => setEditing({ ...defaults })}>+ إضافة</button>
        </div>
      </div>
      <ErrorBox error={error} />
      {loading ? <Loader /> : !items.length ? <Empty title="لا توجد عناصر" /> : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}<th /></tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it._id}>
                  {columns.map((c) => <td key={c.key}>{c.render ? c.render(it) : String(it[c.key] ?? '—')}</td>)}
                  <td className="actions">
                    {extraActions?.(it, reload)}
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(normalize(structuredClone(it), fields))}>تعديل</button>
                    {canDelete && <button className="btn btn-danger btn-sm" onClick={() => remove(it)}>حذف</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <Modal title={editing._id ? `تعديل — ${title}` : `إضافة — ${title}`} onClose={() => setEditing(null)} wide>
          <form className="form-grid" onSubmit={save}>
            {fields.map((f) => (
              <Field key={f.name} label={f.label + (f.required ? ' *' : '')} hint={f.hint} full={f.full || ['textarea', 'specs', 'lines', 'multi'].includes(f.type)}>
                <FormField f={f} value={editing[f.name]} options={optionsFor[f.name]} onChange={(v) => setEditing((s) => ({ ...s, [f.name]: v }))} />
              </Field>
            ))}
            <ErrorBox error={saveErr} />
            <div className="full row-gap">
              <button className="btn" disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'حفظ'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>إلغاء</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
