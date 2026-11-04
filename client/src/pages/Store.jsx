import { Link, useSearchParams } from 'react-router-dom';
import { useFetch } from '../utils/useFetch';
import { useSettings } from '../context/SettingsContext';
import ProductCard from '../components/ProductCard';
import { Loader, Empty, Pagination, PageHead, ErrorBox } from '../components/UI';
import { qs } from '../api';

export default function Store() {
  const [sp, setSp] = useSearchParams();
  const { categories } = useSettings();
  const params = Object.fromEntries(sp.entries());
  const page = +params.page || 1;
  const { data, loading, error } = useFetch(`/products${qs({ ...params, limit: 12 })}`, [sp.toString()]);
  const cat = categories.find((c) => c.slug === params.category);

  const set = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v === '' || v === undefined || v === false) next.delete(k); else next.set(k, v);
    if (k !== 'page') next.delete('page');
    setSp(next);
  };

  return (
    <>
      <PageHead
        title={cat ? cat.name : params.q ? `نتائج البحث: ${params.q}` : 'المتجر'}
        subtitle={cat?.description || 'مكونات وأدوات ومنتجات تقنية بمواصفات واضحة وأسعار مناسبة'}
        crumbs={[{ label: 'المتجر', to: '/store' }, ...(cat ? [{ label: cat.name }] : [])]}
      />
      <div className="container store">
        <aside className="filters">
          <h4>التصنيفات</h4>
          <button className={`fitem ${!params.category ? 'active' : ''}`} onClick={() => set('category', '')}>كل التصنيفات</button>
          {categories.map((c) => (
            <button key={c._id} className={`fitem ${params.category === c.slug ? 'active' : ''}`} onClick={() => set('category', c.slug)}>
              <span>{c.icon} {c.name}</span><small>{c.productCount}</small>
            </button>
          ))}
          <h4>السعر</h4>
          <div className="row2">
            <input type="number" min="0" placeholder="من" defaultValue={params.minPrice} onBlur={(e) => set('minPrice', e.target.value)} />
            <input type="number" min="0" placeholder="إلى" defaultValue={params.maxPrice} onBlur={(e) => set('maxPrice', e.target.value)} />
          </div>
          <h4>تصفية</h4>
          <label className="check"><input type="checkbox" checked={params.inStock === '1'} onChange={(e) => set('inStock', e.target.checked && '1')} /> المتوفر فقط</label>
          <label className="check"><input type="checkbox" checked={params.onSale === '1'} onChange={(e) => set('onSale', e.target.checked && '1')} /> العروض</label>
          <label className="check"><input type="checkbox" checked={params.featured === '1'} onChange={(e) => set('featured', e.target.checked && '1')} /> المميزة</label>
          <label className="check"><input type="checkbox" checked={params.astro === '1'} onChange={(e) => set('astro', e.target.checked && '1')} /> منتجات Astro</label>
        </aside>
        <section>
          <div className="store-bar">
            <span className="muted">{data ? `${data.total} منتج` : ''}</span>
            <select value={params.sort || 'newest'} onChange={(e) => set('sort', e.target.value)} aria-label="ترتيب">
              <option value="newest">الأحدث</option>
              <option value="popular">الأكثر مبيعاً</option>
              <option value="price_asc">السعر: من الأقل</option>
              <option value="price_desc">السعر: من الأعلى</option>
              <option value="name">الاسم</option>
            </select>
          </div>
          <ErrorBox error={error} />
          {loading ? <Loader /> : data?.items?.length ? (
            <>
              <div className="grid-products">{data.items.map((p) => <ProductCard key={p._id} product={p} />)}</div>
              <Pagination page={page} pages={data.pages} onChange={(n) => set('page', n)} />
            </>
          ) : (
            <Empty icon="🔎" title="لا توجد منتجات مطابقة">
              <p className="muted">جرّب تغيير الفلاتر، أو <Link to="/quote">اطلب المنتج</Link> وسنوفره لك.</p>
            </Empty>
          )}
        </section>
      </div>
    </>
  );
}
