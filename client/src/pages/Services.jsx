import { Link, useParams } from 'react-router-dom';
import { useFetch } from '../utils/useFetch';
import { useSettings } from '../context/SettingsContext';
import { Loader, PageHead, ErrorBox, Markdown } from '../components/UI';
import RequestForm from '../components/RequestForm';
import { money } from '../utils/format';

export function Services() {
  const { data, loading } = useFetch('/services');
  const { currency } = useSettings();
  return (
    <>
      <PageHead title="الخدمات التقنية والهندسية" subtitle="من الفكرة إلى المنتج: تصميم، تطوير، نمذجة أولية، وتجهيز وتنفيذ المشاريع." crumbs={[{ label: 'الخدمات' }]} />
      <div className="container section">
        {loading ? <Loader /> : (
          <div className="grid-3">
            {data.items.map((s) => (
              <div key={s._id} className="card service-card">
                <span className="service-icon">{s.icon}</span>
                <h3>{s.title}</h3>
                <p className="muted">{s.summary}</p>
                <ul className="checklist">{s.features?.map((f) => <li key={f}>{f}</li>)}</ul>
                <div className="row-between mt-auto">
                  {s.priceFrom ? <span className="muted small">يبدأ من <b>{money(s.priceFrom, currency)}</b></span> : <span className="muted small">حسب المشروع</span>}
                  <Link to={`/services/${s.slug}`} className="btn btn-sm">اطلب الخدمة</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function ServicePage() {
  const { slug } = useParams();
  const { data: s, loading, error } = useFetch(`/services/${encodeURIComponent(slug)}`, [slug]);
  if (loading) return <div className="container"><Loader /></div>;
  if (error) return <div className="container section"><ErrorBox error={error} /></div>;
  return (
    <>
      <PageHead title={`${s.icon} ${s.title}`} subtitle={s.summary} crumbs={[{ label: 'الخدمات', to: '/services' }, { label: s.title }]} />
      <div className="container section two-col">
        <div className="card">
          <Markdown text={s.description} />
          {s.features?.length > 0 && (<><h3>ما الذي تشمله الخدمة؟</h3><ul className="checklist">{s.features.map((f) => <li key={f}>{f}</li>)}</ul></>)}
        </div>
        <div className="card">
          <h3>اطلب هذه الخدمة</h3>
          <RequestForm type="service" service={s._id} />
        </div>
      </div>
    </>
  );
}

export function Quote() {
  return (
    <>
      <PageHead title="طلب عرض سعر / منتج مخصص" subtitle="للكميات الكبيرة، المؤسسات التعليمية، الشركات، أو المنتجات المصنعة حسب الطلب." crumbs={[{ label: 'طلب عرض سعر' }]} />
      <div className="container section narrow">
        <div className="card"><RequestForm type="quote" allowType /></div>
      </div>
    </>
  );
}
