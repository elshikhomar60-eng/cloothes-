import './globals.css';
import { Reem_Kufi, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { StoreProvider } from '@/lib/store';
import Shell from '@/components/Shell';
const display = Reem_Kufi({ subsets: ['arabic', 'latin'], variable: '--f-display', display: 'swap' });
const body = IBM_Plex_Sans_Arabic({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600', '700'], variable: '--f-body', display: 'swap' });
export const metadata = { title: 'متجر الأزياء', description: 'أزياء رجالي وحريمي وأطفال' };
export default function RootLayout({ children }) {
  return <html lang="ar" dir="rtl" className={`${display.variable} ${body.variable}`}><body className="font-sans"><StoreProvider><Shell>{children}</Shell></StoreProvider></body></html>;
}
