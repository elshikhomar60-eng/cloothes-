'use client';
import Link from 'next/link'; import { useState } from 'react'; import { useRouter } from 'next/navigation';
import { Search, User, ShoppingBag, Menu, X, Heart } from 'lucide-react';
import { useStore } from '@/lib/store';
export default function Header() {
  const { count, cats, settings } = useStore(), [open, setOpen] = useState(false), [s, setS] = useState(false), r = useRouter();
  const links = [['/', 'الرئيسية'], ['/shop', 'المنتجات'], ['/shop?sale=1', 'العروض'], ['/about', 'من نحن'], ['/contact', 'اتصل بنا']];
  return <header className="sticky top-0 z-40 border-b border-mist bg-stone/95 backdrop-blur">
    <div className="wrap flex h-16 items-center gap-6">
      <button className="md:hidden" aria-label="القائمة" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      <Link href="/" className="font-display text-2xl font-bold tracking-wide text-green">{settings.store_name || 'ATELIER'}</Link>
      <nav className="hidden flex-1 items-center gap-7 md:flex">
        {links.slice(0, 2).map(([h, t]) => <Link key={h} href={h} className="hover:text-brass2">{t}</Link>)}
        <div className="group relative"><span className="cursor-pointer hover:text-brass2">الأقسام</span>
          <div className="invisible absolute start-0 top-full w-56 border border-mist bg-white py-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
            {cats.map(c => <Link key={c.id} href={`/shop?c=${c.slug}`} className="block px-4 py-2 hover:bg-stone">{c.name}</Link>)}
            {!cats.length && <span className="block px-4 py-2 text-ink/50">لا توجد أقسام بعد</span>}</div></div>
        {links.slice(2).map(([h, t]) => <Link key={h} href={h} className="hover:text-brass2">{t}</Link>)}
      </nav>
      <div className="ms-auto flex items-center gap-4">
        <button aria-label="بحث" onClick={() => setS(!s)}><Search size={20} /></button>
        <Link href="/wishlist" aria-label="المفضلة" className="hidden sm:block"><Heart size={20} /></Link>
        <Link href="/track" aria-label="متابعة الطلب"><User size={20} /></Link>
        <Link href="/cart" aria-label="السلة" className="relative"><ShoppingBag size={20} />
          {count > 0 && <span className="absolute -end-2 -top-2 grid h-5 min-w-5 place-items-center bg-brass px-1 text-xs font-bold text-ink">{count}</span>}</Link>
      </div></div>
    {s && <form className="wrap pb-3" onSubmit={e => { e.preventDefault(); r.push(`/shop?q=${encodeURIComponent(e.target.q.value)}`); setS(false) }}><input name="q" autoFocus className="input" placeholder="ابحث عن منتج…" /></form>}
    {open && <nav className="wrap grid gap-1 pb-4 md:hidden">
      {links.map(([h, t]) => <Link key={h} href={h} onClick={() => setOpen(false)} className="py-2">{t}</Link>)}
      <div className="border-t border-mist pt-2 text-sm text-ink/60">الأقسام</div>
      {cats.map(c => <Link key={c.id} href={`/shop?c=${c.slug}`} onClick={() => setOpen(false)} className="py-1.5 ps-3">{c.name}</Link>)}</nav>}
  </header>;
}
