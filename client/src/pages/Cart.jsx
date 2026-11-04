import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { Empty, PageHead, ProductImage } from '../components/UI';
import { money } from '../utils/format';

export default function Cart() {
  const { items, setQty, remove, subtotal, clear } = useCart();
  const { currency } = useSettings();
  const nav = useNavigate();

  return (
    <>
      <PageHead title="سلة المشتريات" crumbs={[{ label: 'السلة' }]} />
      <div className="container section">
        {!items.length ? (
          <Empty icon="🛒" title="سلتك فارغة"><Link to="/store" className="btn">تصفح المتجر</Link></Empty>
        ) : (
          <div className="checkout-grid">
            <div className="card">
              <table className="table cart-table">
                <thead><tr><th>المنتج</th><th>السعر</th><th>الكمية</th><th>المجموع</th><th /></tr></thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.product}>
                      <td>
                        <Link to={`/product/${i.slug}`} className="cart-prod">
                          <ProductImage product={i} icon={i.icon} className="thumb" />
                          <span>{i.name}</span>
                        </Link>
                      </td>
                      <td>{money(i.price, currency)}</td>
                      <td>
                        <div className="qty sm">
                          <button onClick={() => setQty(i.product, i.qty - 1)} aria-label="إنقاص">−</button>
                          <input type="number" value={i.qty} min="1" onChange={(e) => setQty(i.product, +e.target.value || 1)} />
                          <button onClick={() => setQty(i.product, i.qty + 1)} aria-label="زيادة">+</button>
                        </div>
                      </td>
                      <td><b>{money(i.price * i.qty, currency)}</b></td>
                      <td><button className="icon-btn" onClick={() => remove(i.product)} aria-label="حذف">🗑</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="row-between mt">
                <Link to="/store" className="link">← متابعة التسوق</Link>
                <button className="btn btn-ghost btn-sm" onClick={clear}>تفريغ السلة</button>
              </div>
            </div>
            <aside className="card summary">
              <h3>ملخص الطلب</h3>
              <div className="totals">
                <div><span>المجموع الفرعي</span><span>{money(subtotal, currency)}</span></div>
                <div className="muted small"><span>التوصيل والخصومات تُحسب في الخطوة التالية</span></div>
              </div>
              <button className="btn btn-lg block" onClick={() => nav('/checkout')}>إتمام الطلب</button>
              <Link to="/quote" className="link small center block mt">تحتاج كميات كبيرة؟ اطلب عرض سعر</Link>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
