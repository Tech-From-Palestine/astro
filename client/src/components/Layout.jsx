import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useEffect } from 'react';

const NAV = [
  ['/', 'الرئيسية'],
  ['/store', 'المتجر'],
  ['/services', 'الخدمات'],
  ['/projects', 'المشاريع والحلول'],
  ['/tech', 'المركز التقني'],
  ['/about', 'من نحن'],
  ['/contact', 'تواصل معنا'],
];

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Electronics Astro">
      <svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true">
        <circle cx="32" cy="32" r="9" fill="currentColor" />
        <ellipse cx="32" cy="32" rx="26" ry="10" fill="none" stroke="currentColor" strokeWidth="3.5" transform="rotate(-30 32 32)" />
      </svg>
      <span><b>Astro</b><small>Electronics</small></span>
    </Link>
  );
}

function Header() {
  const { user, isStaff, logout } = useAuth();
  const { count } = useCart();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);

  const search = (e) => {
    e.preventDefault();
    nav(`/store?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="header">
      <div className="topbar">
        <div className="container topbar-in">
          <span>⚡ توصيل لجميع المدن · دعم فني للطلاب والمهندسين</span>
          <span className="topbar-links">
            <Link to="/track">تتبع طلبك</Link>
            <Link to="/quote">طلب عرض سعر للكميات</Link>
          </span>
        </div>
      </div>
      <div className="container header-in">
        <button className="icon-btn burger" onClick={() => setOpen(!open)} aria-label="القائمة">☰</button>
        <Logo />
        <form className="search" onSubmit={search} role="search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن منتج، رقم قطعة، حساس…" aria-label="بحث" />
          <button aria-label="بحث">🔍</button>
        </form>
        <div className="header-actions">
          {isStaff && <Link to="/admin" className="hbtn">لوحة التحكم</Link>}
          {user ? (
            <div className="dropdown">
              <Link to="/account" className="hbtn">👤 <span className="hide-sm">{user.name.split(' ')[0]}</span></Link>
              <div className="dropdown-menu">
                <Link to="/account">حسابي</Link>
                <Link to="/account/orders">طلباتي</Link>
                <Link to="/account/favorites">المفضلة</Link>
                <button onClick={logout}>تسجيل الخروج</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="hbtn">👤 <span className="hide-sm">دخول</span></Link>
          )}
          <Link to="/cart" className="hbtn cart-btn" aria-label="السلة">
            🛒 {count > 0 && <span className="cart-count">{count}</span>}
          </Link>
        </div>
      </div>
      <nav className={`mainnav ${open ? 'open' : ''}`}>
        <div className="container mainnav-in">
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  const { settings, categories } = useSettings();
  const c = settings?.contact || {};
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="muted">{settings?.tagline}</p>
          <p className="muted small">📍 {c.address}<br />🕘 {c.hours}</p>
        </div>
        <div>
          <h4>المتجر</h4>
          {categories.slice(0, 6).map((cat) => <Link key={cat._id} to={`/store?category=${cat.slug}`}>{cat.name}</Link>)}
        </div>
        <div>
          <h4>Astro</h4>
          <Link to="/services">الخدمات الهندسية</Link>
          <Link to="/projects">المشاريع والحلول</Link>
          <Link to="/tech">المركز التقني</Link>
          <Link to="/about">من نحن</Link>
          <Link to="/contact">تواصل معنا</Link>
        </div>
        <div>
          <h4>السياسات</h4>
          <Link to="/policies/shipping">الشحن والتوصيل</Link>
          <Link to="/policies/returns">الاسترجاع والاستبدال</Link>
          <Link to="/policies/privacy">الخصوصية</Link>
          <Link to="/policies/terms">شروط الاستخدام</Link>
          <h4 className="mt">تواصل</h4>
          <a href={`mailto:${c.email}`}>{c.email}</a>
          <a href={`tel:${c.phone}`} dir="ltr">{c.phone}</a>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} Electronics Astro — جميع الحقوق محفوظة</div>
    </footer>
  );
}

export default function Layout() {
  const { toast } = useCart();
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return (
    <>
      <Header />
      <main className="main"><Outlet /></main>
      <Footer />
      {toast && <div className="toast">✓ {toast}</div>}
    </>
  );
}
