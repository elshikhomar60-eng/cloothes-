'use client';
import Link from 'next/link'; import { useStore } from '@/lib/store';
export default function Footer() {
  const { settings: s, cats } = useStore();
  return <footer className="mt-24 bg-green text-stone"><div className="wrap grid gap-10 py-14 md:grid-cols-3">
    <div><div className="font-display text-3xl font-bold">{s.store_name || 'ATELIER'}</div><p className="mt-3 max-w-xs text-stone/70">{s.tagline}</p></div>
    <div><div className="mb-3 font-semibold">تسوّق</div>{cats.slice(0, 6).map(c => <Link key={c.id} href={`/shop?c=${c.slug}`} className="block py-1 text-stone/70 hover:text-brass">{c.name}</Link>)}</div>
    <div><div className="mb-3 font-semibold">تواصل معنا</div>
      {s.phone && <a href={`tel:${s.phone}`} dir="ltr" className="block py-1 text-start text-stone/70">{s.phone}</a>}
      {s.whatsapp && <a href={`https://wa.me/${s.whatsapp}`} className="block py-1 text-stone/70 hover:text-brass">واتساب</a>}
      <Link href="/track" className="block py-1 text-stone/70 hover:text-brass">متابعة طلب</Link></div>
  </div></footer>;
}
