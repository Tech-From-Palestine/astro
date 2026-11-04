import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { money } from '../utils/format';
import { ProductImage } from './UI';

export function Price({ product }) {
  const { currency } = useSettings();
  const onSale = product.comparePrice > product.price;
  return (
    <div className="price">
      <strong>{money(product.price, currency)}</strong>
      {onSale && <del>{money(product.comparePrice, currency)}</del>}
    </div>
  );
}

export default function ProductCard({ product }) {
  const { add } = useCart();
  const { user, toggleFavorite } = useAuth();
  const fav = user?.favorites?.includes(product._id);
  const onSale = product.comparePrice > product.price;
  const out = product.stock <= 0;

  return (
    <article className="pcard">
      <Link to={`/product/${product.slug}`} className="pcard-media">
        <ProductImage product={product} />
        <div className="pcard-tags">
          {onSale && <span className="tag tag-sale">-{Math.round((1 - product.price / product.comparePrice) * 100)}%</span>}
          {product.isAstro && <span className="tag tag-astro">Astro</span>}
          {out && <span className="tag tag-out">نفد</span>}
        </div>
      </Link>
      {user && (
        <button className={`fav ${fav ? 'on' : ''}`} onClick={() => toggleFavorite(product._id)} aria-label="المفضلة" title="المفضلة">
          {fav ? '♥' : '♡'}
        </button>
      )}
      <div className="pcard-body">
        <span className="pcard-cat">{product.category?.name}</span>
        <Link to={`/product/${product.slug}`} className="pcard-title">{product.name}</Link>
        <div className="pcard-foot">
          <Price product={product} />
          <button className="btn btn-sm" disabled={out} onClick={() => add(product)}>
            {out ? 'غير متوفر' : 'أضف للسلة'}
          </button>
        </div>
      </div>
    </article>
  );
}
