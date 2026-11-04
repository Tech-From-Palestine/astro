import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useFetch } from '../utils/useFetch';
import { Loader, PageHead, ErrorBox, Markdown, Empty } from '../components/UI';
import ProductCard from '../components/ProductCard';
import { ARTICLE_TYPE, LEVEL, date } from '../utils/format';
import { qs } from '../api';

export function TechCenter() {
  const [sp, setSp] = useSearchParams();
  const type = sp.get('type') || '';
  const q = sp.get('q') || '';
  const { data, loading } = useFetch(`/articles${qs({ type, q })}`, [type, q]);
  return (
    <>
      <PageHead title="المركز التقني" subtitle="مقالات، شروحات، مشاريع تعليمية ومصادر تقنية مرتبطة بالمنتجات." crumbs={[{ label: 'المركز التقني' }]} />
      <div className="container section">
        <div className="row-between wrap">
          <div className="tabs">
            <button className={!type ? 'active' : ''} onClick={() => setSp({})}>الكل</button>
            {Object.entries(ARTICLE_TYPE).map(([k, v]) => (
              <button key={k} className={type === k ? 'active' : ''} onClick={() => setSp({ type: k })}>{v}</button>
            ))}
          </div>
          <input className="search-inline" placeholder="ابحث في المحتوى…" defaultValue={q}
            onKeyDown={(e) => e.key === 'Enter' && setSp({ ...(type && { type }), q: e.target.value })} />
        </div>
        {loading ? <Loader /> : !data.items.length ? <Empty icon="📚" title="لا يوجد محتوى" /> : (
          <div className="grid-3">
            {data.items.map((a) => (
              <Link key={a._id} to={`/tech/${a.slug}`} className="card article-card">
                {a.cover && <img src={a.cover} alt="" className="project-img" />}
                <div className="row-between"><span className="badge badge-info">{ARTICLE_TYPE[a.type]}</span><small className="muted">{LEVEL[a.level]}</small></div>
                <h3>{a.title}</h3>
                <p className="muted">{a.excerpt}</p>
                <small className="muted">{date(a.createdAt)}</small>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function ArticlePage() {
  const { slug } = useParams();
  const { data: a, loading, error } = useFetch(`/articles/${encodeURIComponent(slug)}`, [slug]);
  if (loading) return <div className="container"><Loader /></div>;
  if (error) return <div className="container section"><ErrorBox error={error} /></div>;
  return (
    <>
      <PageHead title={a.title} subtitle={a.excerpt} crumbs={[{ label: 'المركز التقني', to: '/tech' }, { label: ARTICLE_TYPE[a.type] }]}>
        <div className="meta"><span>{a.author}</span><span>{date(a.createdAt)}</span><span>المستوى: {LEVEL[a.level]}</span></div>
      </PageHead>
      <div className="container section article-layout">
        <article className="card">
          {a.cover && <img src={a.cover} alt="" className="project-img" />}
          <Markdown text={a.body} />
          <div className="chips mt">{a.tags?.map((t) => <span key={t} className="chip">#{t}</span>)}</div>
        </article>
        {a.relatedProducts?.length > 0 && (
          <aside>
            <h3>المنتجات المستخدمة</h3>
            <div className="stack">{a.relatedProducts.map((p) => <ProductCard key={p._id} product={p} />)}</div>
          </aside>
        )}
      </div>
    </>
  );
}
