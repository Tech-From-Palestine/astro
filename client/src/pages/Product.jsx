import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFetch } from '../utils/useFetch';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard, { Price } from '../components/ProductCard';
import { Loader, ErrorBox, Markdown, PageHead, ProductImage } from '../components/UI';

export default function Product() {
  const { slug } = useParams();
  const { data, loading, error } = useFetch(`/products/${encodeURIComponent(slug)}`, [slug]);
  const { add } = useCart();
  const { user, toggleFavorite } = useAuth();
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [tab, setTab] = useState('desc');

  if (loading) return <div className="container"><Loader /></div>;
  if (error) return <div className="container section"><ErrorBox error={error} /></div>;
  const { product: p, related } = data;
  const fav = user?.favorites?.includes(p._id);
  const stockLabel = p.stock <= 0 ? ['غير متوفر حالياً', 'bad'] : p.stock <= p.lowStockThreshold ? [`متبقٍ ${p.stock} فقط`, 'warn'] : ['متوفر', 'ok'];

  return (
    <>
      <PageHead title="" crumbs={[{ label: 'المتجر', to: '/store' }, { label: p.category?.name, to: `/store?category=${p.category?.slug}` }, { label: p.name }]} />
      <div className="container product">
        <div className="gallery">
          <ProductImage product={{ ...p, images: p.images?.length ? [p.images[img]] : [] }} className="big" />
          {p.images?.length > 1 && (
            <div className="thumbs">
              {p.images.map((src, i) => (
                <button key={src} className={i === img ? 'active' : ''} onClick={() => setImg(i)}><img src={src} alt="" /></button>
              ))}
            </div>
          )}
        </div>
        <div className="pinfo">
          {p.isAstro && <span className="tag tag-astro">منتج Astro</span>}
          <h1>{p.name}</h1>
          <div className="meta muted">
            {p.sku && <span>رقم القطعة: <b dir="ltr">{p.sku}</b></span>}
            {p.brand && <span>العلامة: <b>{p.brand}</b></span>}
          </div>
          <Price product={p} />
          <p>{p.shortDescription}</p>
          <span className={`badge badge-${stockLabel[1]}`}>{stockLabel[0]}</span>

          <div className="buy">
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="إنقاص">−</button>
              <input type="number" min="1" max={p.stock} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(+e.target.value || 1, p.stock)))} />
              <button onClick={() => setQty(Math.min(p.stock, qty + 1))} aria-label="زيادة">+</button>
            </div>
            <button className="btn btn-lg" disabled={p.stock <= 0} onClick={() => add(p, qty)}>أضف إلى السلة</button>
            {user && <button className={`btn btn-lg btn-ghost ${fav ? 'on' : ''}`} onClick={() => toggleFavorite(p._id)}>{fav ? '♥ في المفضلة' : '♡ المفضلة'}</button>}
          </div>
          <div className="assist">
            <span>تحتاج كمية كبيرة أو نسخة مخصصة؟</span>
            <Link to={`/quote?product=${encodeURIComponent(p.name)}`}>اطلب عرض سعر</Link>
          </div>
          {p.datasheetUrl && <a className="link" href={p.datasheetUrl} target="_blank" rel="noreferrer">📄 ورقة البيانات (Datasheet)</a>}
        </div>
      </div>

      <div className="container section">
        <div className="tabs">
          <button className={tab === 'desc' ? 'active' : ''} onClick={() => setTab('desc')}>الوصف</button>
          <button className={tab === 'specs' ? 'active' : ''} onClick={() => setTab('specs')}>المواصفات الفنية</button>
        </div>
        <div className="card">
          {tab === 'desc' ? <Markdown text={p.description} /> : p.specs?.length ? (
            <table className="specs"><tbody>{p.specs.map((s) => <tr key={s.key}><th>{s.key}</th><td>{s.value}</td></tr>)}</tbody></table>
          ) : <p className="muted">لا توجد مواصفات مضافة بعد.</p>}
        </div>
      </div>

      {related?.length > 0 && (
        <section className="container section">
          <div className="section-head"><h2>منتجات ذات صلة</h2></div>
          <div className="grid-products">{related.map((r) => <ProductCard key={r._id} product={r} />)}</div>
        </section>
      )}
    </>
  );
}
