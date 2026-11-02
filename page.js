'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase as db, money } from '@/lib/supabase';
const TABS = [['stats', 'الإحصائيات'], ['orders', 'الطلبات'], ['products', 'المنتجات'], ['cats', 'الأقسام'], ['banners', 'الصفحة الرئيسية'], ['coupons', 'الكوبونات'], ['customers', 'العملاء'], ['settings', 'الإعدادات']];
const STATUS = { new: 'جديد', processing: 'قيد التجهيز', shipped: 'تم الشحن', delivered: 'تم التسليم', cancelled: 'ملغي' };
const slug = s => s.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}-]/gu, '') + '-' + Math.random().toString(36).slice(2, 5);
async function up(file) { const path = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${file.name.split('.').pop()}`; const { error } = await db.storage.from('media').upload(path, file); if (error) throw error; return db.storage.from('media').getPublicUrl(path).data.publicUrl }
function useTable(t, order = 'created_at', asc = false, sel = '*') { const [rows, set] = useState([]); const load = useCallback(async () => { const { data } = await db.from(t).select(sel).order(order, { ascending: asc }); set(data || []) }, [t]); useEffect(() => { load() }, [load]); return [rows, load] }

function Crud({ table, fields, blank, sortable, show, pre }) {
  const [rows, load] = useTable(table, sortable ? 'sort' : 'created_at', sortable), [f, setF] = useState(null), set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const save = async e => { e.preventDefault(); const { id, created_at, ...r } = f; const row = pre ? pre(r) : r; const { error } = id ? await db.from(table).update(row).eq('id', id) : await db.from(table).insert(row); if (error) return alert(error.message); setF(null); load() };
  const del = async id => { if (confirm('تأكيد الحذف؟')) { await db.from(table).delete().eq('id', id); load() } };
  const move = async (a, b) => { if (!b) return; await Promise.all([db.from(table).update({ sort: b.sort }).eq('id', a.id), db.from(table).update({ sort: a.sort }).eq('id', b.id)]); load() };
  return <div><button className="btn" onClick={() => setF({ ...blank, sort: (rows.at(-1)?.sort ?? 0) + 1 })}>+ إضافة</button>
    {f && <form onSubmit={save} className="card my-4 grid gap-3 md:grid-cols-2">{fields.map(([k, label, type, opts]) => <label key={k} className={type === 'area' ? 'md:col-span-2' : ''}><span className="lbl">{label}</span>
      {type === 'bool' ? <input type="checkbox" checked={!!f[k]} onChange={e => set(k, e.target.checked)} />
        : type === 'image' ? <div>{f[k] && <img src={f[k]} className="mb-2 h-20" />}<input type="file" accept="image/*" onChange={async e => { try { set(k, await up(e.target.files[0])) } catch (x) { alert(x.message) } }} /></div>
          : type === 'multi' ? <select multiple className="input h-32" value={f[k] || []} onChange={e => set(k, [...e.target.selectedOptions].map(o => o.value))}>{opts.map(o => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>
            : type === 'area' ? <textarea className="input" rows={3} value={f[k] || ''} onChange={e => set(k, e.target.value)} />
              : <input className="input" required={type !== 'datetime' && k !== 'link' && k !== 'subtitle'} type={type === 'datetime' ? 'datetime-local' : type || 'text'} value={type === 'datetime' ? (f[k] ? f[k].slice(0, 16) : '') : (f[k] ?? '')} onChange={e => set(k, e.target.value)} />}</label>)}
      <div className="flex gap-2 md:col-span-2"><button className="btn">حفظ</button><button type="button" className="btn-out" onClick={() => setF(null)}>إلغاء</button></div></form>}
    <div className="mt-4 grid gap-2">{rows.map((r, i) => <div key={r.id} className="card flex items-center gap-3">{r.image && <img src={r.image} className="h-14 w-14 object-cover" />}<div className="flex-1">{show(r)}</div>
      {sortable && <><button onClick={() => move(r, rows[i - 1])}>↑</button><button onClick={() => move(r, rows[i + 1])}>↓</button></>}
      <button onClick={() => setF(r)} className="text-brass2">تعديل</button><button onClick={() => del(r.id)} className="text-crimson">حذف</button></div>)}</div></div>;
}
const Cats = () => <Crud table="categories" sortable blank={{ name: '', image: '', visible: true }} fields={[['name', 'اسم القسم'], ['image', 'صورة القسم', 'image'], ['sort', 'الترتيب', 'number'], ['visible', 'ظاهر في الموقع', 'bool']]}
  pre={r => ({ ...r, slug: r.slug || slug(r.name), sort: +r.sort })} show={r => <b className={r.visible ? '' : 'text-ink/40 line-through'}>{r.name}</b>} />;
const Banners = () => <Crud table="banners" sortable blank={{ title: '', subtitle: '', image: '', link: '/shop', visible: true }} fields={[['title', 'العنوان'], ['subtitle', 'النص'], ['image', 'الصورة', 'image'], ['link', 'الرابط'], ['sort', 'الترتيب', 'number'], ['visible', 'ظاهر', 'bool']]}
  pre={r => ({ ...r, sort: +r.sort })} show={r => <b>{r.title}</b>} />;
function Coupons() {
  const [cats] = useTable('categories', 'sort', true), [prods] = useTable('products', 'name', true);
  return <Crud table="coupons" blank={{ code: '', percent: 10, active: true, category_ids: [], product_ids: [] }} fields={[['code', 'الكود'], ['percent', 'نسبة الخصم %', 'number'], ['starts_at', 'يبدأ', 'datetime'], ['ends_at', 'ينتهي', 'datetime'], ['category_ids', 'أقسام الخصم (فارغ = الكل)', 'multi', cats.map(c => [c.id, c.name])], ['product_ids', 'منتجات الخصم (فارغ = الكل)', 'multi', prods.map(c => [c.id, c.name])], ['active', 'مفعّل', 'bool']]}
    pre={r => ({ ...r, code: r.code.toUpperCase().trim(), percent: +r.percent, starts_at: r.starts_at || null, ends_at: r.ends_at || null, category_ids: r.category_ids?.length ? r.category_ids : null, product_ids: r.product_ids?.length ? r.product_ids : null })}
    show={r => <span><b dir="ltr">{r.code}</b> — {r.percent}% {r.active ? '' : '(متوقف)'}</span>} />;
}
function Products() {
  const [rows, load] = useTable('products', 'created_at', false, '*, stock(*)'), [cats] = useTable('categories', 'sort', true), [f, setF] = useState(null), [busy, setBusy] = useState(false);
  const blank = { name: '', description: '', price: '', sale_price: '', category_id: '', images: [], sizesTxt: 'S, M, L, XL, XXL', colorsTxt: 'أسود:#111111, أبيض:#ffffff', featured: false, best_seller: false, visible: true, stock: {} };
  const edit = p => setF({ ...p, sale_price: p.sale_price ?? '', sizesTxt: p.sizes.join(', '), colorsTxt: p.colors.map(c => `${c.name}:${c.hex}`).join(', '), stock: Object.fromEntries((p.stock || []).map(s => [s.size + '|' + s.color, s.qty])) });
  const sizes = f ? f.sizesTxt.split(/[,،]/).map(x => x.trim()).filter(Boolean) : [];
  let colors = f ? f.colorsTxt.split(/[,،]/).map(x => { const [n, h] = x.split(':'); return { name: (n || '').trim(), hex: (h || '#cccccc').trim() } }).filter(c => c.name) : []; if (f && !colors.length) colors = [{ name: 'افتراضي', hex: '#cccccc' }];
  const save = async e => {
    e.preventDefault(); setBusy(true);
    try {
      const row = { name: f.name, description: f.description, price: +f.price, sale_price: f.sale_price === '' ? null : +f.sale_price, category_id: f.category_id || null, images: f.images, sizes, colors, featured: f.featured, best_seller: f.best_seller, visible: f.visible };
      let id = f.id; if (id) { const { error } = await db.from('products').update(row).eq('id', id); if (error) throw error } else { const { data, error } = await db.from('products').insert(row).select().single(); if (error) throw error; id = data.id }
      await db.from('stock').delete().eq('product_id', id);
      const st = []; sizes.forEach(s => colors.forEach(c => st.push({ product_id: id, size: s, color: c.name, qty: +(f.stock[s + '|' + c.name] || 0) })));
      if (st.length) { const { error } = await db.from('stock').insert(st); if (error) throw error }
      setF(null); load();
    } catch (err) { alert(err.message) } setBusy(false);
  };
  const del = async id => { if (confirm('حذف المنتج نهائيًا؟')) { await db.from('products').delete().eq('id', id); load() } };
  const mv = async (id, cid) => { await db.from('products').update({ category_id: cid || null }).eq('id', id); load() };
  const t = (k, v) => setF({ ...f, [k]: v });
  return <div><button className="btn" onClick={() => setF(blank)}>+ منتج جديد</button>
    {f && <form onSubmit={save} className="card my-4 grid gap-3 md:grid-cols-2">
      <label><span className="lbl">اسم المنتج</span><input required className="input" value={f.name} onChange={e => t('name', e.target.value)} /></label>
      <label><span className="lbl">القسم</span><select className="input" value={f.category_id || ''} onChange={e => t('category_id', e.target.value)}><option value="">بدون قسم</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label><span className="lbl">السعر الأصلي</span><input required type="number" min="0" className="input" value={f.price} onChange={e => t('price', e.target.value)} /></label>
      <label><span className="lbl">سعر الخصم (اختياري)</span><input type="number" min="0" className="input" value={f.sale_price} onChange={e => t('sale_price', e.target.value)} /></label>
      <label className="md:col-span-2"><span className="lbl">الوصف</span><textarea rows={4} className="input" value={f.description || ''} onChange={e => t('description', e.target.value)} /></label>
      <label><span className="lbl">المقاسات (مفصولة بفاصلة)</span><input className="input" value={f.sizesTxt} onChange={e => t('sizesTxt', e.target.value)} /></label>
      <label><span className="lbl">الألوان (اسم:لون، مثال أسود:#111111)</span><input className="input" value={f.colorsTxt} onChange={e => t('colorsTxt', e.target.value)} /></label>
      <div className="md:col-span-2"><span className="lbl">الصور (الأولى هي الرئيسية)</span><div className="mb-2 flex flex-wrap gap-2">{f.images.map((u, n) => <div key={u} className="relative"><img src={u} className="h-24 w-20 object-cover" /><button type="button" onClick={() => t('images', f.images.filter((_, j) => j !== n))} className="absolute end-0 top-0 bg-crimson px-1.5 text-white">×</button></div>)}</div>
        <input type="file" accept="image/*" multiple onChange={async e => { try { const us = []; for (const x of e.target.files) us.push(await up(x)); t('images', [...f.images, ...us]) } catch (x) { alert(x.message) } }} /></div>
      <div className="overflow-x-auto md:col-span-2"><span className="lbl">المخزون لكل مقاس ولون</span><table className="w-full text-center"><thead><tr><th></th>{colors.map(c => <th key={c.name} className="p-1">{c.name}</th>)}</tr></thead>
        <tbody>{sizes.map(s => <tr key={s}><td className="p-1 font-bold">{s}</td>{colors.map(c => <td key={c.name} className="p-1"><input type="number" min="0" className="input !w-20 !px-2 !py-1" value={f.stock[s + '|' + c.name] ?? 0} onChange={e => t('stock', { ...f.stock, [s + '|' + c.name]: e.target.value })} /></td>)}</tr>)}</tbody></table></div>
      <div className="flex flex-wrap gap-5 md:col-span-2">{[['featured', 'مختار في الرئيسية'], ['best_seller', 'الأكثر مبيعًا'], ['visible', 'ظاهر']].map(([k, l]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={f[k]} onChange={e => t(k, e.target.checked)} />{l}</label>)}</div>
      <div className="flex gap-2 md:col-span-2"><button className="btn" disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'حفظ'}</button><button type="button" className="btn-out" onClick={() => setF(null)}>إلغاء</button></div></form>}
    <div className="mt-4 grid gap-2">{rows.map(p => <div key={p.id} className="card flex flex-wrap items-center gap-3">{p.images[0] && <img src={p.images[0]} className="h-16 w-14 object-cover" />}
      <div className="min-w-40 flex-1"><b className={p.visible ? '' : 'text-ink/40'}>{p.name}</b><div className="text-sm text-ink/60">{money(p.sale_price ?? p.price)} — مخزون: {(p.stock || []).reduce((s, x) => s + x.qty, 0)}</div></div>
      <select className="input !w-40 !py-1" value={p.category_id || ''} onChange={e => mv(p.id, e.target.value)}><option value="">بدون قسم</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <button onClick={() => edit(p)} className="text-brass2">تعديل</button><button onClick={() => del(p.id)} className="text-crimson">حذف</button></div>)}</div></div>;
}
function Orders() {
  const [rows, load] = useTable('orders', 'created_at', false, '*, order_items(*)'), [flt, setFlt] = useState('');
  const setS = async (id, status) => { await db.from('orders').update({ status }).eq('id', id); load() };
  return <div><select className="input mb-4 !w-auto" value={flt} onChange={e => setFlt(e.target.value)}><option value="">كل الحالات</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
    <div className="grid gap-3">{rows.filter(o => !flt || o.status === flt).map(o => <div key={o.id} className="card"><div className="flex flex-wrap items-center justify-between gap-2"><b>طلب #{o.number}</b><span className="text-sm text-ink/60">{new Date(o.created_at).toLocaleString('ar-EG')}</span>
      <select className="input !w-auto !py-1" value={o.status} onChange={e => setS(o.id, e.target.value)}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      <div className="mt-2 text-sm">{o.name} — <span dir="ltr">{o.phone}</span><br />{o.address}<br />الدفع: {o.payment === 'cod' ? 'عند الاستلام' : 'تحويل'}{o.coupon && ` — كوبون ${o.coupon}`}</div>
      <ul className="mt-2 text-sm">{o.order_items.map(i => <li key={i.id}>{i.name} — {i.size} / {i.color} × {i.qty}</li>)}</ul><div className="mt-2 font-bold">الإجمالي: {money(o.total)}</div></div>)}</div></div>;
}
function Customers() {
  const [rows] = useTable('orders'), m = {}; rows.forEach(o => { const c = m[o.phone] ||= { name: o.name, phone: o.phone, address: o.address, n: 0, sum: 0, list: [] }; c.list.push(o.number); if (o.status !== 'cancelled') { c.n++; c.sum += +o.total } });
  return <div className="grid gap-2">{Object.values(m).map(c => <div key={c.phone} className="card"><b>{c.name}</b> — <span dir="ltr">{c.phone}</span><div className="text-sm text-ink/70">{c.address}</div><div className="text-sm">الطلبات: {c.list.map(n => '#' + n).join('، ')} — الإجمالي: {money(c.sum)}</div></div>)}</div>;
}
function Stats() {
  const [rows] = useTable('orders', 'created_at', false, '*, order_items(*)'), [pc, setPc] = useState(0), ok = rows.filter(o => o.status !== 'cancelled');
  useEffect(() => { db.from('products').select('id', { count: 'exact', head: true }).then(({ count }) => setPc(count || 0)) }, []);
  const sum = a => a.reduce((s, o) => s + +o.total, 0), day = new Date().toISOString().slice(0, 10), mon = day.slice(0, 7), top = {};
  ok.forEach(o => o.order_items.forEach(i => top[i.name] = (top[i.name] || 0) + i.qty));
  const K = ({ t, v }) => <div className="card"><div className="text-sm text-ink/60">{t}</div><div className="mt-1 text-2xl font-bold text-green">{v}</div></div>;
  return <div className="grid gap-4"><div className="grid grid-cols-2 gap-3 md:grid-cols-4"><K t="إجمالي المبيعات" v={money(sum(ok))} /><K t="عدد الطلبات" v={rows.length} /><K t="عدد المنتجات" v={pc} /><K t="عدد العملاء" v={new Set(rows.map(o => o.phone)).size} /><K t="مبيعات اليوم" v={money(sum(ok.filter(o => o.created_at.startsWith(day))))} /><K t="مبيعات الشهر" v={money(sum(ok.filter(o => o.created_at.startsWith(mon))))} /></div>
    <div className="card"><b>الأكثر مبيعًا</b>{Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n, q]) => <div key={n} className="flex justify-between border-b border-mist py-1"><span>{n}</span><span>{q}</span></div>)}</div></div>;
}
function Settings() {
  const [s, setS] = useState(null); useEffect(() => { db.from('settings').select('*').limit(1).then(({ data }) => setS(data?.[0])) }, []);
  if (!s) return null; const t = k => e => setS({ ...s, [k]: e.target.value });
  const save = async e => { e.preventDefault(); const { id, ...r } = s; r.shipping_fee = +r.shipping_fee; r.free_shipping_over = +r.free_shipping_over; const { error } = await db.from('settings').update(r).eq('id', 1); alert(error ? error.message : 'تم الحفظ') };
  return <form onSubmit={save} className="card grid gap-3 md:grid-cols-2">{[['store_name', 'اسم المتجر'], ['tagline', 'شعار قصير'], ['phone', 'الهاتف'], ['whatsapp', 'واتساب (بدون +)'], ['address', 'العنوان'], ['shipping_fee', 'تكلفة الشحن', 'number'], ['free_shipping_over', 'شحن مجاني فوق مبلغ', 'number']].map(([k, l, ty]) => <label key={k}><span className="lbl">{l}</span><input type={ty || 'text'} className="input" value={s[k] ?? ''} onChange={t(k)} /></label>)}
    <label className="md:col-span-2"><span className="lbl">من نحن</span><textarea rows={5} className="input" value={s.about || ''} onChange={t('about')} /></label><button className="btn md:col-span-2">حفظ</button></form>;
}
const VIEW = { stats: Stats, orders: Orders, products: Products, cats: Cats, banners: Banners, coupons: Coupons, customers: Customers, settings: Settings };
export default function Admin() {
  const [st, setSt] = useState('load'), [tab, setTab] = useState('orders'), [em, setEm] = useState(''), [pw, setPw] = useState('');
  const check = async () => { const { data } = await db.auth.getSession(); if (!data.session) return setSt('login'); const { data: a } = await db.rpc('is_admin'); setSt(a ? 'ok' : 'denied') };
  useEffect(() => { check() }, []);
  const login = async e => { e.preventDefault(); const { error } = await db.auth.signInWithPassword({ email: em, password: pw }); if (error) return alert('بيانات الدخول غير صحيحة'); check() };
  if (st === 'load') return <p className="py-32 text-center">…</p>;
  if (st !== 'ok') return <div className="grid min-h-screen place-items-center p-4"><form onSubmit={login} className="card grid w-full max-w-sm gap-3"><h1 className="h2">لوحة التحكم</h1>
    {st === 'denied' && <p className="text-crimson">هذا الحساب ليس مديرًا.</p>}<input required type="email" dir="ltr" className="input text-start" placeholder="البريد الإلكتروني" value={em} onChange={e => setEm(e.target.value)} /><input required type="password" dir="ltr" className="input text-start" placeholder="كلمة المرور" value={pw} onChange={e => setPw(e.target.value)} /><button className="btn">دخول</button></form></div>;
  const V = VIEW[tab];
  return <div className="min-h-screen md:flex"><aside className="bg-green p-3 text-stone md:w-56 md:min-h-screen"><div className="mb-3 hidden px-3 font-display text-xl font-bold md:block">لوحة التحكم</div>
    <nav className="flex gap-1 overflow-x-auto md:flex-col">{TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`whitespace-nowrap px-4 py-2 text-start ${tab === k ? 'bg-brass text-ink' : 'hover:bg-white/10'}`}>{l}</button>)}
      <button className="px-4 py-2 text-start text-stone/60" onClick={async () => { await db.auth.signOut(); setSt('login') }}>تسجيل الخروج</button></nav></aside>
    <main className="flex-1 p-4 md:p-8"><h1 className="h2 mb-6">{TABS.find(t => t[0] === tab)[1]}</h1><V key={tab} /></main></div>;
}
