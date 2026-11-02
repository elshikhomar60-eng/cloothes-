'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } };
export function StoreProvider({ children }) {
  const [cart, setCart] = useState([]), [favs, setFavs] = useState([]), [settings, setSettings] = useState({}), [cats, setCats] = useState([]), [ready, setReady] = useState(false);
  useEffect(() => {
    setCart(load('cart', [])); setFavs(load('favs', [])); setReady(true);
    supabase.from('settings').select('*').limit(1).then(({ data }) => setSettings(data?.[0] || {}));
    supabase.from('categories').select('*').eq('visible', true).order('sort').then(({ data }) => setCats(data || []));
  }, []);
  useEffect(() => { if (ready) { localStorage.setItem('cart', JSON.stringify(cart)); localStorage.setItem('favs', JSON.stringify(favs)); } }, [cart, favs, ready]);
  const add = it => setCart(c => { const i = c.findIndex(x => x.product_id === it.product_id && x.size === it.size && x.color === it.color); if (i >= 0) { const n = [...c]; n[i] = { ...n[i], qty: n[i].qty + it.qty }; return n } return [...c, it] });
  const upd = (i, patch) => setCart(c => c.map((x, j) => j === i ? { ...x, ...patch } : x));
  const del = i => setCart(c => c.filter((_, j) => j !== i));
  const toggleFav = id => setFavs(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
  return <Ctx.Provider value={{ cart, add, upd, del, clear: () => setCart([]), count: cart.reduce((s, x) => s + x.qty, 0), favs, toggleFav, settings, cats }}>{children}</Ctx.Provider>;
}
