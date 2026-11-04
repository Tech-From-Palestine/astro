import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Link } from 'react-router-dom';
import { STATUS_TONE } from '../utils/format';

export const Loader = ({ text = 'جارٍ التحميل…' }) => (
  <div className="loader"><span className="spinner" /> {text}</div>
);

export const ErrorBox = ({ error }) =>
  error ? <div className="alert alert-bad">{error.message || String(error)}</div> : null;

export const Empty = ({ icon = '📭', title, children }) => (
  <div className="empty">
    <div className="empty-icon">{icon}</div>
    <h3>{title}</h3>
    {children}
  </div>
);

export const Badge = ({ tone, value, children }) => (
  <span className={`badge badge-${tone || STATUS_TONE[value] || 'muted'}`}>{children}</span>
);

export function Markdown({ text }) {
  const html = DOMPurify.sanitize(marked.parse(text || ''));
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => Math.abs(n - page) < 3 || n === 1 || n === pages);
  return (
    <nav className="pagination">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>السابق</button>
      {nums.map((n, i) => (
        <span key={n}>
          {i > 0 && nums[i - 1] !== n - 1 && <span className="dots">…</span>}
          <button className={n === page ? 'active' : ''} onClick={() => onChange(n)}>{n}</button>
        </span>
      ))}
      <button disabled={page >= pages} onClick={() => onChange(page + 1)}>التالي</button>
    </nav>
  );
}

export function ProductImage({ product, icon, className = '' }) {
  const src = product?.images?.[0] || product?.image;
  if (src) return <img className={`pimg ${className}`} src={src} alt={product?.name || ''} loading="lazy" />;
  return <div className={`pimg pimg-ph ${className}`} aria-hidden="true">{icon || product?.category?.icon || product?.icon || '🔧'}</div>;
}

export const PageHead = ({ title, subtitle, crumbs, children }) => (
  <section className="page-head">
    <div className="container">
      {crumbs && (
        <div className="crumbs">
          <Link to="/">الرئيسية</Link>
          {crumbs.map((c) => (
            <span key={c.label}> / {c.to ? <Link to={c.to}>{c.label}</Link> : c.label}</span>
          ))}
        </div>
      )}
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {children}
    </div>
  </section>
);

export function Field({ label, hint, children, full }) {
  return (
    <label className={`field ${full ? 'full' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <small className="hint">{hint}</small>}
    </label>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
