import { Link, useParams } from 'react-router-dom';
import { useFetch } from '../utils/useFetch';
import { Loader, PageHead, ErrorBox, Markdown, Empty } from '../components/UI';
import ProductCard from '../components/ProductCard';

export function Projects() {
  const { data, loading } = useFetch('/projects');
  return (
    <>
      <PageHead title="المشاريع والحلول" subtitle="نماذج من المشاريع والحلول التقنية التي نفذها فريق Astro." crumbs={[{ label: 'المشاريع والحلول' }]} />
      <div className="container section">
        {loading ? <Loader /> : !data.items.length ? <Empty title="لا توجد مشاريع بعد" /> : (
          <div className="grid-2">
            {data.items.map((p) => (
              <Link key={p._id} to={`/projects/${p.slug}`} className="card project-card">
                {p.image ? <img src={p.image} alt="" className="project-img" /> : <div className="project-img ph">🚀</div>}
                <div className="row-between"><span className="badge badge-info">{p.sector}</span><small className="muted">{p.year}</small></div>
                <h3>{p.title}</h3>
                <p className="muted">{p.summary}</p>
                <div className="chips">{p.technologies?.map((t) => <span key={t} className="chip">{t}</span>)}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function ProjectPage() {
  const { slug } = useParams();
  const { data: p, loading, error } = useFetch(`/projects/${encodeURIComponent(slug)}`, [slug]);
  if (loading) return <div className="container"><Loader /></div>;
  if (error) return <div className="container section"><ErrorBox error={error} /></div>;
  return (
    <>
      <PageHead title={p.title} subtitle={p.summary} crumbs={[{ label: 'المشاريع', to: '/projects' }, { label: p.title }]} />
      <div className="container section">
        <div className="card">
          <div className="meta muted">{p.client && <span>العميل: <b>{p.client}</b></span>}{p.sector && <span>القطاع: <b>{p.sector}</b></span>}{p.year && <span>السنة: <b>{p.year}</b></span>}</div>
          {p.image && <img src={p.image} alt="" className="project-img" />}
          <Markdown text={p.description} />
          <div className="chips">{p.technologies?.map((t) => <span key={t} className="chip">{t}</span>)}</div>
        </div>
        {p.products?.length > 0 && (
          <section className="section">
            <h2>منتجات مستخدمة في المشروع</h2>
            <div className="grid-products">{p.products.map((x) => <ProductCard key={x._id} product={x} />)}</div>
          </section>
        )}
        <div className="cta-box"><div><h2>تريد حلاً مشابهاً؟</h2><p>أخبرنا عن مشروعك وسنقترح الحل المناسب.</p></div><Link to="/quote" className="btn btn-lg">تواصل معنا</Link></div>
      </div>
    </>
  );
}
