import { NavLink, Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/UI';
import { Logo } from '../components/Layout';

export const ADMIN_NAV = [
  { group: 'عام', items: [['/admin', '📊 لوحة المؤشرات', null]] },
  { group: 'المتجر', items: [
    ['/admin/orders', '🧾 الطلبات', 'orders'],
    ['/admin/products', '📦 المنتجات', 'products'],
    ['/admin/categories', '🗂 التصنيفات', 'products'],
    ['/admin/inventory', '🏷 المخزون', 'products'],
    ['/admin/coupons', '🎟 العروض والكوبونات', 'offers'],
  ] },
  { group: 'العملاء', items: [
    ['/admin/customers', '👥 العملاء', 'customers'],
    ['/admin/messages', '✉️ الرسائل', 'customers'],
    ['/admin/requests', '📝 طلبات الخدمات والأسعار', 'content'],
  ] },
  { group: 'المحتوى', items: [
    ['/admin/services', '🛠 الخدمات', 'content'],
    ['/admin/projects', '🚀 المشاريع والحلول', 'content'],
    ['/admin/articles', '📚 المركز التقني', 'content'],
  ] },
  { group: 'المالية', items: [
    ['/admin/finance', '💰 التقارير المالية', 'finance'],
    ['/admin/expenses', '💸 المصاريف', 'finance'],
  ] },
  { group: 'النظام', items: [
    ['/admin/users', '🔐 المستخدمون والصلاحيات', 'users'],
    ['/admin/settings', '⚙️ إعدادات الموقع', 'settings'],
  ] },
];

export default function AdminLayout() {
  const { user, ready, isStaff, can, logout } = useAuth();
  if (!ready) return <Loader />;
  if (!user) return <Navigate to="/login?next=/admin" replace />;
  if (!isStaff) return <Navigate to="/" replace />;

  return (
    <div className="admin">
      <aside className="admin-side no-print">
        <Logo />
        {ADMIN_NAV.map((g) => {
          const items = g.items.filter(([, , p]) => !p || can(p));
          if (!items.length) return null;
          return (
            <div key={g.group} className="admin-group">
              <small>{g.group}</small>
              {items.map(([to, label]) => <NavLink key={to} to={to} end={to === '/admin'}>{label}</NavLink>)}
            </div>
          );
        })}
        <div className="admin-group">
          <Link to="/">↩ العودة للموقع</Link>
          <button onClick={logout}>تسجيل الخروج</button>
        </div>
      </aside>
      <main className="admin-main"><Outlet /></main>
    </div>
  );
}

export function RequirePerm({ perm, children }) {
  const { can } = useAuth();
  return can(perm) ? children : <div className="alert alert-bad">لا تملك صلاحية الوصول لهذا القسم.</div>;
}
