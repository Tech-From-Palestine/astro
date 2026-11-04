import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Store from './pages/Store';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Track from './pages/Track';
import Account from './pages/Account';
import { Services, ServicePage, Quote } from './pages/Services';
import { Projects, ProjectPage } from './pages/Projects';
import { TechCenter, ArticlePage } from './pages/Tech';
import { About, Contact, Policy, NotFound } from './pages/Info';
import { Login, Register } from './pages/Auth';

import { lazy, Suspense } from 'react';
import { Loader } from './components/UI';

// لوحة التحكم تُحمّل عند الحاجة فقط لتسريع الموقع للزوار
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const RequirePerm = lazy(() => import('./admin/AdminLayout').then((m) => ({ default: m.RequirePerm })));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const AdminOrders = lazy(() => import('./admin/Orders'));
const Inventory = lazy(() => import('./admin/Inventory'));
const Finance = lazy(() => import('./admin/Finance'));
const AdminSettings = lazy(() => import('./admin/Settings'));
const res = (name) => lazy(() => import('./admin/Resources').then((m) => ({ default: m[name] })));
const R = Object.fromEntries(
  ['Products', 'Categories', 'Coupons', 'Customers', 'Messages', 'Requests', 'Services', 'Projects', 'Articles', 'Expenses', 'Users'].map((n) => [n, res(n)])
);

const guard = (perm, el) => <Suspense fallback={<Loader />}><RequirePerm perm={perm}>{el}</RequirePerm></Suspense>;

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="store" element={<Store />} />
        <Route path="product/:slug" element={<Product />} />
        <Route path="services" element={<Services />} />
        <Route path="services/:slug" element={<ServicePage />} />
        <Route path="quote" element={<Quote />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:slug" element={<ProjectPage />} />
        <Route path="tech" element={<TechCenter />} />
        <Route path="tech/:slug" element={<ArticlePage />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order-success/:number" element={<OrderSuccess />} />
        <Route path="track" element={<Track />} />
        <Route path="account/*" element={<Account />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="policies/:key" element={<Policy />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="admin" element={<Suspense fallback={<Loader />}><AdminLayout /></Suspense>}>
        <Route index element={<Suspense fallback={<Loader />}><Dashboard /></Suspense>} />
        <Route path="orders" element={guard('orders', <AdminOrders />)} />
        <Route path="products" element={guard('products', <R.Products />)} />
        <Route path="categories" element={guard('products', <R.Categories />)} />
        <Route path="inventory" element={guard('products', <Inventory />)} />
        <Route path="coupons" element={guard('offers', <R.Coupons />)} />
        <Route path="customers" element={guard('customers', <R.Customers />)} />
        <Route path="messages" element={guard('customers', <R.Messages />)} />
        <Route path="requests" element={guard('content', <R.Requests />)} />
        <Route path="services" element={guard('content', <R.Services />)} />
        <Route path="projects" element={guard('content', <R.Projects />)} />
        <Route path="articles" element={guard('content', <R.Articles />)} />
        <Route path="finance" element={guard('finance', <Finance />)} />
        <Route path="expenses" element={guard('finance', <R.Expenses />)} />
        <Route path="users" element={guard('users', <R.Users />)} />
        <Route path="settings" element={guard('settings', <AdminSettings />)} />
      </Route>
    </Routes>
  );
}
