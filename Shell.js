'use client';
import { usePathname } from 'next/navigation';
import Header from './Header'; import Footer from './Footer';
export default function Shell({ children }) {
  if (usePathname().startsWith('/admin')) return children;
  return <><Header /><main className="min-h-[70vh]">{children}</main><Footer /></>;
}
