import { Link } from 'react-router-dom';
import { useFetch } from '../utils/useFetch';
import { useSettings } from '../context/SettingsContext';
import ProductCard from '../components/ProductCard';
import { Loader } from '../components/UI';
import { ARTICLE_TYPE } from '../utils/format';

function ProductRow({ title, query, link }) {
  const { data, loading } = useFetch(`/products${query}`);
  if (!loading && !data?.items?.length) return null;
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <h2>{title}</h2>
          <Link to={link} className="link">عرض الكل ←</Link>
        </div>
        {loading ? <Loader /> : (
          <div className="grid-products">{data.items.map((p) => <ProductCard key={p._id} product={p} />)}</div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const { settings, categories } = useSettings();
  const services = useFetch('/services?limit=6');
  const articles = useFetch('/articles?limit=3');
  const b = settings?.banner || {};

  return (
    <>
      <section className="hero">
        <div className="container hero-in">
          <div>
            <span className="eyebrow">Electronics Astro</span>
            <h1>{b.title || 'كل ما تحتاجه لمشروعك الإلكتروني في مكان واحد'}</h1>
            <p>{b.subtitle}</p>
            <div className="hero-actions">
              <Link to="/store" className="btn btn-lg">{b.cta || 'تسوّق الآن'}</Link>
              <Link to="/services" className="btn btn-lg btn-ghost">اطلب خدمة هندسية</Link>
            </div>
            <ul className="hero-points">
              <li>✓ مواصفات فنية دقيقة لكل منتج</li>
              <li>✓ دعم فني قبل وبعد الشراء</li>
              <li>✓ عروض أسعار للكميات والمؤسسات</li>
            </ul>
          </div>
          <div className="hero-art" aria-hidden="true">
            <svg viewBox="0 0 400 320">
              <defs>
                <linearGradient id="g" x1="0" x2="1"><stop offset="0" stopColor="#22d3ee" /><stop offset="1" stopColor="#6366f1" /></linearGradient>
              </defs>
              <rect x="70" y="60" width="260" height="200" rx="18" fill="#0f2b4f" stroke="url(#g)" strokeWidth="3" />
              <rect x="160" y="120" width="80" height="80" rx="8" fill="#13385f" stroke="#22d3ee" strokeWidth="2" />
              <text x="200" y="166" textAnchor="middle" fill="#22d3ee" fontSize="16" fontFamily="monospace">ASTRO</text>
              {Array.from({ length: 8 }).map((_, i) => (
                <g key={i} stroke="#22d3ee" strokeWidth="2" opacity=".8">
                  <line x1={170 + i * 9} y1="120" x2={170 + i * 9} y2="80" />
                  <line x1={170 + i * 9} y1="200" x2={170 + i * 9} y2="240" />
                </g>
              ))}
              {Array.from({ length: 6 }).map((_, i) => (
                <g key={i} stroke="#818cf8" strokeWidth="2" opacity=".8">
                  <line x1="160" y1={132 + i * 11} x2="95" y2={132 + i * 11} />
                  <line x1="240" y1={132 + i * 11} x2="305" y2={132 + i * 11} />
                </g>
              ))}
              <circle cx="95" cy="85" r="7" fill="#22d3ee" /><circle cx="305" cy="235" r="7" fill="#818cf8" />
              <circle cx="305" cy="85" r="5" fill="#f59e0b" /><circle cx="95" cy="235" r="5" fill="#10b981" />
            </svg>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head"><h2>تسوّق حسب التصنيف</h2><Link to="/store" className="link">كل المنتجات ←</Link></div>
          <div className="grid-cats">
            {categories.map((c) => (
              <Link key={c._id} to={`/store?category=${c.slug}`} className="cat-card">
                <span className="cat-icon">{c.icon}</span>
                <span className="cat-name">{c.name}</span>
                <small>{c.productCount} منتج</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ProductRow title="منتجات مميزة" query="?featured=1&limit=8" link="/store?featured=1" />
      <ProductRow title="العروض والخصومات" query="?onSale=1&limit=4" link="/store?onSale=1" />

      <section className="section band">
        <div className="container">
          <div className="section-head"><h2>خدمات Astro الهندسية</h2><Link to="/services" className="link">كل الخدمات ←</Link></div>
          <div className="grid-3">
            {services.data?.items?.map((s) => (
              <Link key={s._id} to={`/services/${s.slug}`} className="card service-card">
                <span className="service-icon">{s.icon}</span>
                <h3>{s.title}</h3>
                <p className="muted">{s.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ProductRow title="منتجات Astro الخاصة" query="?astro=1&limit=4" link="/store?astro=1" />

      <section className="section">
        <div className="container">
          <div className="section-head"><h2>من المركز التقني</h2><Link to="/tech" className="link">المزيد ←</Link></div>
          <div className="grid-3">
            {articles.data?.items?.map((a) => (
              <Link key={a._id} to={`/tech/${a.slug}`} className="card article-card">
                <span className="badge badge-info">{ARTICLE_TYPE[a.type]}</span>
                <h3>{a.title}</h3>
                <p className="muted">{a.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container cta-box">
          <div>
            <h2>لديك مشروع أو تحتاج كميات كبيرة؟</h2>
            <p>نوفر عروض أسعار خاصة للجامعات والمدارس والشركات، ونجهّز المكونات والمنتجات حسب الطلب.</p>
          </div>
          <Link to="/quote" className="btn btn-lg">اطلب عرض سعر</Link>
        </div>
      </section>
    </>
  );
}
