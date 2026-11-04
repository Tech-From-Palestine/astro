import { createContext, useContext, useEffect, useState } from 'react';

const CartCtx = createContext(null);
const KEY = 'astro_cart';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items]);

  const add = (p, qty = 1) => {
    setItems((list) => {
      const found = list.find((i) => i.product === p._id);
      const max = p.stock ?? 999;
      if (found) return list.map((i) => (i.product === p._id ? { ...i, qty: Math.min(i.qty + qty, max) } : i));
      return [...list, {
        product: p._id, slug: p.slug, name: p.name, price: p.price, image: p.images?.[0],
        icon: p.category?.icon, stock: max, qty: Math.min(qty, max),
      }];
    });
    setToast(`تمت إضافة "${p.name}" إلى السلة`);
    setTimeout(() => setToast(null), 2200);
  };
  const setQty = (id, qty) =>
    setItems((list) => list.map((i) => (i.product === id ? { ...i, qty: Math.max(1, Math.min(qty, i.stock || 999)) } : i)));
  const remove = (id) => setItems((list) => list.filter((i) => i.product !== id));
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);

  return (
    <CartCtx.Provider value={{ items, add, setQty, remove, clear, count, subtotal, toast }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
