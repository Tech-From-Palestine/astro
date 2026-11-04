import { useEffect, useState } from 'react';
import { api } from '../api';
import { useFetch } from '../utils/useFetch';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import ResourceManager from './ResourceManager';
import { Badge, ErrorBox, Loader, Modal, Empty, Field } from '../components/UI';
import { FormField } from './ResourceManager';
import {
  ARTICLE_TYPE, CUSTOMER_TYPE, EXPENSE_CAT, LEVEL, PERMISSION_LABEL, REQUEST_STATUS, REQUEST_TYPE, date, dateTime, money,
} from '../utils/format';

const yes = (v) => (v ? <Badge tone="ok">نعم</Badge> : <Badge tone="muted">لا</Badge>);
const opts = (obj) => Object.entries(obj);

function useProductOptions() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get('/products?all=1&limit=200&sort=name').then((d) => setList(d.items.map((p) => [p._id, p.name]))); }, []);
  return list;
}

export function Products() {
  const { categories, currency } = useSettings();
  const [cats, setCats] = useState([]);
  useEffect(() => { api.get('/categories?all=1').then(setCats); }, [categories]);
  return (
    <ResourceManager
      title="المنتجات"
      endpoint="/products"
      listPath="/products?all=1&limit=200&sort=newest"
      defaults={{ isActive: true, stock: 0, lowStockThreshold: 5, specs: [], images: [], cost: 0 }}
      optionsFor={{ category: cats.map((c) => [c._id, `${c.icon} ${c.name}`]) }}
      columns={[
        { key: 'name', label: 'المنتج', render: (p) => <><b>{p.name}</b><br /><small className="muted" dir="ltr">{p.sku}</small></> },
        { key: 'category', label: 'التصنيف', render: (p) => p.category?.name },
        { key: 'price', label: 'السعر', render: (p) => <>{money(p.price, currency)}{p.comparePrice > p.price && <><br /><del className="muted small">{money(p.comparePrice, currency)}</del></>}</> },
        { key: 'margin', label: 'هامش الربح', render: (p) => (p.price ? `${Math.round(((p.price - p.cost) / p.price) * 100)}%` : '—') },
        { key: 'stock', label: 'المخزون', render: (p) => <Badge tone={p.stock === 0 ? 'bad' : p.stock <= p.lowStockThreshold ? 'warn' : 'ok'}>{p.stock}</Badge> },
        { key: 'featured', label: 'مميز', render: (p) => yes(p.featured) },
        { key: 'isActive', label: 'ظاهر', render: (p) => yes(p.isActive) },
      ]}
      fields={[
        { name: 'name', label: 'اسم المنتج', required: true, full: true },
        { name: 'category', label: 'التصنيف', type: 'select', placeholder: 'اختر التصنيف', required: true },
        { name: 'sku', label: 'رقم القطعة SKU', ltr: true },
        { name: 'brand', label: 'العلامة التجارية' },
        { name: 'price', label: 'سعر البيع', type: 'number', required: true },
        { name: 'comparePrice', label: 'السعر قبل الخصم (للعروض)', type: 'number' },
        { name: 'cost', label: 'تكلفة الشراء', type: 'number', hint: 'لحساب الأرباح — لا تظهر للعملاء' },
        { name: 'stock', label: 'الكمية بالمخزون', type: 'number' },
        { name: 'lowStockThreshold', label: 'حد التنبيه للمخزون', type: 'number' },
        { name: 'shortDescription', label: 'وصف مختصر', full: true },
        { name: 'description', label: 'الوصف التفصيلي (Markdown)', type: 'textarea', rows: 6 },
        { name: 'specs', label: 'المواصفات الفنية', type: 'specs' },
        { name: 'images', label: 'روابط الصور (رابط في كل سطر)', type: 'lines', rows: 3 },
        { name: 'datasheetUrl', label: 'رابط ورقة البيانات', ltr: true },
        { name: 'tags', label: 'كلمات مفتاحية (مفصولة بفواصل)', type: 'tags' },
        { name: 'featured', label: 'منتج مميز', type: 'checkbox' },
        { name: 'isAstro', label: 'منتج Astro خاص', type: 'checkbox' },
        { name: 'isActive', label: 'ظاهر في المتجر', type: 'checkbox' },
      ]}
    />
  );
}

export function Categories() {
  const { reload } = useSettings();
  const [cats, setCats] = useState([]);
  useEffect(() => { api.get('/categories?all=1').then(setCats); return reload; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      <ResourceManager
        title="التصنيفات" endpoint="/categories" listPath="/categories?all=1" searchable={false}
        defaults={{ icon: '🔧', isActive: true, order: 0 }}
        optionsFor={{ parent: cats.map((c) => [c._id, c.name]) }}
        columns={[
          { key: 'icon', label: '', render: (c) => <span className="big-emoji">{c.icon}</span> },
          { key: 'name', label: 'التصنيف' },
          { key: 'slug', label: 'الرابط', render: (c) => <span dir="ltr" className="muted">{c.slug}</span> },
          { key: 'productCount', label: 'المنتجات' },
          { key: 'order', label: 'الترتيب' },
          { key: 'isActive', label: 'ظاهر', render: (c) => yes(c.isActive) },
        ]}
        fields={[
          { name: 'name', label: 'الاسم', required: true },
          { name: 'slug', label: 'الرابط (slug)', ltr: true, hint: 'يُولّد تلقائياً إن تُرك فارغاً' },
          { name: 'icon', label: 'أيقونة (إيموجي)' },
          { name: 'order', label: 'الترتيب', type: 'number' },
          { name: 'parent', label: 'تصنيف أب (اختياري)', type: 'select', placeholder: '— بدون —' },
          { name: 'description', label: 'الوصف', type: 'textarea', rows: 2 },
          { name: 'isActive', label: 'ظاهر', type: 'checkbox' },
        ]}
      />
    </div>
  );
}

export function Coupons() {
  const { currency } = useSettings();
  return (
    <ResourceManager
      title="العروض والكوبونات" endpoint="/coupons"
      defaults={{ type: 'percent', isActive: true, minOrder: 0, usageLimit: 0 }}
      columns={[
        { key: 'code', label: 'الكود', render: (c) => <b dir="ltr">{c.code}</b> },
        { key: 'value', label: 'القيمة', render: (c) => (c.type === 'percent' ? `${c.value}%` : money(c.value, currency)) },
        { key: 'minOrder', label: 'الحد الأدنى', render: (c) => money(c.minOrder, currency) },
        { key: 'used', label: 'الاستخدام', render: (c) => `${c.used}${c.usageLimit ? ` / ${c.usageLimit}` : ''}` },
        { key: 'expiresAt', label: 'ينتهي', render: (c) => date(c.expiresAt) },
        { key: 'isActive', label: 'مفعل', render: (c) => yes(c.isActive) },
      ]}
      fields={[
        { name: 'code', label: 'الكود', required: true, ltr: true },
        { name: 'type', label: 'النوع', type: 'select', options: [['percent', 'نسبة مئوية %'], ['fixed', 'مبلغ ثابت']] },
        { name: 'value', label: 'القيمة', type: 'number', required: true },
        { name: 'minOrder', label: 'الحد الأدنى للطلب', type: 'number' },
        { name: 'usageLimit', label: 'عدد مرات الاستخدام (0 = غير محدود)', type: 'number' },
        { name: 'expiresAt', label: 'تاريخ الانتهاء', type: 'date' },
        { name: 'description', label: 'الوصف', full: true },
        { name: 'isActive', label: 'مفعل', type: 'checkbox' },
      ]}
    />
  );
}

export function Services() {
  return (
    <ResourceManager
      title="الخدمات" endpoint="/services" defaults={{ icon: '🛠️', isActive: true, features: [], order: 0 }}
      columns={[
        { key: 'icon', label: '', render: (s) => <span className="big-emoji">{s.icon}</span> },
        { key: 'title', label: 'الخدمة' },
        { key: 'priceFrom', label: 'يبدأ من', render: (s) => s.priceFrom || '—' },
        { key: 'order', label: 'الترتيب' },
        { key: 'isActive', label: 'ظاهرة', render: (s) => yes(s.isActive) },
      ]}
      fields={[
        { name: 'title', label: 'العنوان', required: true },
        { name: 'icon', label: 'أيقونة' },
        { name: 'priceFrom', label: 'السعر يبدأ من', type: 'number' },
        { name: 'order', label: 'الترتيب', type: 'number' },
        { name: 'summary', label: 'ملخص', full: true },
        { name: 'description', label: 'الوصف (Markdown)', type: 'textarea', rows: 6 },
        { name: 'features', label: 'ما تشمله الخدمة (بند في كل سطر)', type: 'lines' },
        { name: 'isActive', label: 'ظاهرة', type: 'checkbox' },
      ]}
    />
  );
}

export function Articles() {
  const products = useProductOptions();
  return (
    <ResourceManager
      title="المركز التقني" endpoint="/articles" defaults={{ type: 'article', level: 'beginner', isPublished: true, author: 'فريق Astro', tags: [], relatedProducts: [] }}
      optionsFor={{ relatedProducts: products }}
      columns={[
        { key: 'title', label: 'العنوان' },
        { key: 'type', label: 'النوع', render: (a) => ARTICLE_TYPE[a.type] },
        { key: 'level', label: 'المستوى', render: (a) => LEVEL[a.level] },
        { key: 'views', label: 'المشاهدات' },
        { key: 'isPublished', label: 'منشور', render: (a) => yes(a.isPublished) },
      ]}
      fields={[
        { name: 'title', label: 'العنوان', required: true, full: true },
        { name: 'type', label: 'النوع', type: 'select', options: opts(ARTICLE_TYPE) },
        { name: 'level', label: 'المستوى', type: 'select', options: opts(LEVEL) },
        { name: 'author', label: 'الكاتب' },
        { name: 'cover', label: 'رابط صورة الغلاف', ltr: true },
        { name: 'excerpt', label: 'مقتطف', full: true },
        { name: 'body', label: 'المحتوى (Markdown)', type: 'textarea', rows: 12 },
        { name: 'tags', label: 'الوسوم', type: 'tags' },
        { name: 'relatedProducts', label: 'منتجات مرتبطة (Ctrl/⌘ للاختيار المتعدد)', type: 'multi' },
        { name: 'isPublished', label: 'منشور', type: 'checkbox' },
      ]}
    />
  );
}

export function Projects() {
  const products = useProductOptions();
  return (
    <ResourceManager
      title="المشاريع والحلول" endpoint="/projects" defaults={{ isPublished: true, technologies: [], products: [], year: new Date().getFullYear() }}
      optionsFor={{ products }}
      columns={[
        { key: 'title', label: 'المشروع' },
        { key: 'sector', label: 'القطاع' },
        { key: 'year', label: 'السنة' },
        { key: 'isPublished', label: 'منشور', render: (p) => yes(p.isPublished) },
      ]}
      fields={[
        { name: 'title', label: 'العنوان', required: true, full: true },
        { name: 'client', label: 'العميل' },
        { name: 'sector', label: 'القطاع' },
        { name: 'year', label: 'السنة', type: 'number' },
        { name: 'image', label: 'رابط الصورة', ltr: true },
        { name: 'summary', label: 'ملخص', full: true },
        { name: 'description', label: 'التفاصيل (Markdown)', type: 'textarea', rows: 8 },
        { name: 'technologies', label: 'التقنيات', type: 'tags' },
        { name: 'products', label: 'المنتجات المستخدمة', type: 'multi' },
        { name: 'isPublished', label: 'منشور', type: 'checkbox' },
      ]}
    />
  );
}

export function Expenses() {
  const { currency } = useSettings();
  return (
    <ResourceManager
      title="المصاريف" endpoint="/admin/expenses" defaults={{ category: 'other', date: new Date().toISOString().slice(0, 10) }}
      columns={[
        { key: 'date', label: 'التاريخ', render: (e) => date(e.date) },
        { key: 'title', label: 'البيان' },
        { key: 'category', label: 'البند', render: (e) => EXPENSE_CAT[e.category] },
        { key: 'amount', label: 'المبلغ', render: (e) => <b>{money(e.amount, currency)}</b> },
        { key: 'notes', label: 'ملاحظات', render: (e) => e.notes || '—' },
      ]}
      fields={[
        { name: 'title', label: 'البيان', required: true },
        { name: 'category', label: 'البند', type: 'select', options: opts(EXPENSE_CAT) },
        { name: 'amount', label: 'المبلغ', type: 'number', required: true },
        { name: 'date', label: 'التاريخ', type: 'date' },
        { name: 'notes', label: 'ملاحظات', type: 'textarea', rows: 2 },
      ]}
    />
  );
}

export function Customers() {
  const [q, setQ] = useState('');
  const { data, loading, error, reload } = useFetch(`/users?role=customer${q ? `&q=${encodeURIComponent(q)}` : ''}`, [q]);
  const { currency } = useSettings();
  const { can } = useAuth();
  const toggle = async (u) => { await api.put(`/users/${u._id}`, { isActive: !u.isActive }); reload(); };
  return (
    <div className="stack">
      <div className="admin-head"><h1>العملاء</h1><input className="search-inline" placeholder="بحث بالاسم/البريد/الهاتف" onKeyDown={(e) => e.key === 'Enter' && setQ(e.target.value)} /></div>
      <ErrorBox error={error} />
      {loading ? <Loader /> : !data.length ? <Empty title="لا يوجد عملاء" /> : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>الاسم</th><th>البريد</th><th>الهاتف</th><th>الفئة</th><th>الطلبات</th><th>إجمالي المشتريات</th><th>التسجيل</th><th>الحالة</th></tr></thead>
            <tbody>{data.map((u) => (
              <tr key={u._id}>
                <td>{u.name}{u.company && <><br /><small className="muted">{u.company}</small></>}</td>
                <td dir="ltr">{u.email}</td><td dir="ltr">{u.phone || '—'}</td>
                <td>{CUSTOMER_TYPE[u.customerType]}</td><td>{u.orders}</td><td>{money(u.spent, currency)}</td><td>{date(u.createdAt)}</td>
                <td>{can('users') ? <button className={`btn btn-sm ${u.isActive ? 'btn-ghost' : 'btn-danger'}`} onClick={() => toggle(u)}>{u.isActive ? 'نشط' : 'موقوف'}</button> : yes(u.isActive)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function Users() {
  const { data, loading, error, reload } = useFetch('/users');
  const [edit, setEdit] = useState(null);
  const [err, setErr] = useState(null);
  const staff = (data || []).filter((u) => u.role !== 'customer');
  const save = async (e) => {
    e.preventDefault(); setErr(null);
    try {
      if (edit._id) await api.put(`/users/${edit._id}`, edit); else await api.post('/users', edit);
      setEdit(null); reload();
    } catch (x) { setErr(x); }
  };
  const togglePerm = (p) => setEdit((u) => ({ ...u, permissions: u.permissions?.includes(p) ? u.permissions.filter((x) => x !== p) : [...(u.permissions || []), p] }));
  return (
    <div className="stack">
      <div className="admin-head"><h1>المستخدمون والصلاحيات</h1><button className="btn" onClick={() => setEdit({ role: 'staff', permissions: ['orders'] })}>+ إضافة موظف</button></div>
      <p className="muted">المدير يملك كل الصلاحيات. الموظف يصل فقط للأقسام المحددة له. لتحويل عميل لموظف ابحث عنه وعدّل دوره.</p>
      <ErrorBox error={error} />
      {loading ? <Loader /> : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>الاسم</th><th>البريد</th><th>الدور</th><th>الصلاحيات</th><th>الحالة</th><th /></tr></thead>
            <tbody>{staff.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td><td dir="ltr">{u.email}</td>
                <td><Badge tone={u.role === 'admin' ? 'info' : 'muted'}>{u.role === 'admin' ? 'مدير' : 'موظف'}</Badge></td>
                <td className="small">{u.role === 'admin' ? 'كل الصلاحيات' : u.permissions.map((p) => PERMISSION_LABEL[p]).join('، ')}</td>
                <td>{yes(u.isActive)}</td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => setEdit(structuredClone(u))}>تعديل</button></td>
              </tr>
            ))}</tbody>
          </table>
          <h4 className="mt">ترقية عميل إلى موظف</h4>
          <select onChange={(e) => { const u = data.find((x) => x._id === e.target.value); if (u) setEdit({ ...structuredClone(u), role: 'staff' }); }} value="">
            <option value="">اختر عميلاً…</option>
            {data.filter((u) => u.role === 'customer').map((u) => <option key={u._id} value={u._id}>{u.name} — {u.email}</option>)}
          </select>
        </div>
      )}
      {edit && (
        <Modal title={edit._id ? 'تعديل مستخدم' : 'موظف جديد'} onClose={() => setEdit(null)}>
          <form className="form-grid" onSubmit={save}>
            <Field label="الاسم"><input required value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="البريد"><input required type="email" dir="ltr" disabled={!!edit._id} value={edit.email || ''} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
            <Field label={edit._id ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور'}><input type="password" required={!edit._id} minLength={6} onChange={(e) => setEdit({ ...edit, password: e.target.value })} /></Field>
            <Field label="الدور">
              <FormField f={{ type: 'select', options: [['customer', 'عميل'], ['staff', 'موظف'], ['admin', 'مدير']] }} value={edit.role} onChange={(v) => setEdit({ ...edit, role: v })} />
            </Field>
            {edit.role === 'staff' && (
              <div className="full perms">
                {Object.entries(PERMISSION_LABEL).map(([k, v]) => (
                  <label key={k} className="check"><input type="checkbox" checked={edit.permissions?.includes(k) || false} onChange={() => togglePerm(k)} /> {v}</label>
                ))}
              </div>
            )}
            {edit._id && <Field label="الحساب"><FormField f={{ type: 'checkbox', checkLabel: 'نشط' }} value={edit.isActive} onChange={(v) => setEdit({ ...edit, isActive: v })} /></Field>}
            <ErrorBox error={err} />
            <button className="btn full">حفظ</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function Requests() {
  const [type, setType] = useState('');
  const { data, loading, error, reload } = useFetch(`/requests${type ? `?type=${type}` : ''}`, [type]);
  const [open, setOpen] = useState(null);
  const update = async (r, patch) => { await api.patch(`/requests/${r._id}`, patch); reload(); setOpen(null); };
  return (
    <div className="stack">
      <div className="admin-head">
        <h1>طلبات الخدمات وعروض الأسعار</h1>
        <select value={type} onChange={(e) => setType(e.target.value)}><option value="">كل الأنواع</option>{opts(REQUEST_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      </div>
      <ErrorBox error={error} />
      {loading ? <Loader /> : !data.length ? <Empty title="لا توجد طلبات" /> : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>التاريخ</th><th>النوع</th><th>الاسم</th><th>الجهة</th><th>الخدمة</th><th>الحالة</th><th /></tr></thead>
            <tbody>{data.map((r) => (
              <tr key={r._id}>
                <td>{date(r.createdAt)}</td><td>{REQUEST_TYPE[r.type]}</td><td>{r.name}</td><td>{r.organization || '—'}</td><td>{r.service?.title || '—'}</td>
                <td><Badge value={r.status}>{REQUEST_STATUS[r.status]}</Badge></td>
                <td><button className="btn btn-sm" onClick={() => setOpen(structuredClone(r))}>عرض</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {open && (
        <Modal title={`${REQUEST_TYPE[open.type]} — ${open.name}`} onClose={() => setOpen(null)}>
          <div className="stack">
            <p><b>البريد:</b> <a href={`mailto:${open.email}`}>{open.email}</a> · <b>الهاتف:</b> <span dir="ltr">{open.phone || '—'}</span></p>
            {open.budget && <p><b>الميزانية:</b> {open.budget}</p>}
            <div className="card flat pre">{open.details}</div>
            <Field label="الحالة"><select value={open.status} onChange={(e) => setOpen({ ...open, status: e.target.value })}>{opts(REQUEST_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label="ملاحظات داخلية"><textarea rows="3" value={open.adminNotes || ''} onChange={(e) => setOpen({ ...open, adminNotes: e.target.value })} /></Field>
            <button className="btn" onClick={() => update(open, { status: open.status, adminNotes: open.adminNotes })}>حفظ</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function Messages() {
  const { data, loading, error, reload } = useFetch('/contact');
  const [open, setOpen] = useState(null);
  const view = async (m) => { setOpen(m); if (!m.isRead) { await api.patch(`/contact/${m._id}`, { isRead: true }); reload(); } };
  const del = async (m) => { if (window.confirm('حذف الرسالة؟')) { await api.del(`/contact/${m._id}`); setOpen(null); reload(); } };
  return (
    <div className="stack">
      <div className="admin-head"><h1>رسائل تواصل معنا</h1></div>
      <ErrorBox error={error} />
      {loading ? <Loader /> : !data.length ? <Empty title="لا توجد رسائل" /> : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>التاريخ</th><th>الاسم</th><th>الموضوع</th><th /></tr></thead>
            <tbody>{data.map((m) => (
              <tr key={m._id} className={m.isRead ? '' : 'unread'}>
                <td>{dateTime(m.createdAt)}</td><td>{m.name}</td><td>{m.subject || m.message.slice(0, 50)}</td>
                <td><button className="btn btn-sm btn-ghost" onClick={() => view(m)}>{m.isRead ? 'عرض' : 'جديد • عرض'}</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {open && (
        <Modal title={open.subject || 'رسالة'} onClose={() => setOpen(null)}>
          <p><b>{open.name}</b> · <a href={`mailto:${open.email}`}>{open.email}</a> · <span dir="ltr">{open.phone}</span></p>
          <div className="card flat pre">{open.message}</div>
          <div className="row-gap mt"><a className="btn" href={`mailto:${open.email}?subject=${encodeURIComponent('رد: ' + (open.subject || ''))}`}>رد بالبريد</a><button className="btn btn-danger" onClick={() => del(open)}>حذف</button></div>
        </Modal>
      )}
    </div>
  );
}
