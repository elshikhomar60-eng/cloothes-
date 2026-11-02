'use client';
import Link from 'next/link'; import { Heart } from 'lucide-react';
import { useStore } from '@/lib/store'; import { money } from '@/lib/supabase';
export default function ProductCard({ p }) {
  const { favs, toggleFav } = useStore(), on = favs.includes(p.id), im = p.images || [];
  const off = p.sale_price ? Math.round((1 - p.sale_price / p.price) * 100) : 0;
  return <Link href={`/product/${p.id}`} className="group block">
    <div className="relative aspect-[3/4] overflow-hidden bg-mist">
      {im[0] && <img src={im[0]} alt={p.name} loading="lazy" className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${im[1] ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`} />}
      {im[1] && <img src={im[1]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:opacity-100" />}
      {off > 0 && <span className="absolute start-0 top-3 bg-crimson px-3 py-1 text-sm font-bold text-white">-{off}%</span>}
      <button aria-label="مفضلة" onClick={e => { e.preventDefault(); toggleFav(p.id) }} className="absolute end-3 top-3 grid h-9 w-9 place-items-center bg-white/90 transition hover:bg-brass"><Heart size={18} fill={on ? '#A6192E' : 'none'} stroke={on ? '#A6192E' : 'currentColor'} /></button>
    </div>
    <div className="mt-3 truncate font-medium">{p.name}</div>
    <div className="mt-1 flex items-baseline gap-2"><span className="font-bold text-green">{money(p.sale_price ?? p.price)}</span>{p.sale_price && <s className="text-sm text-ink/50">{money(p.price)}</s>}</div>
  </Link>;
}
