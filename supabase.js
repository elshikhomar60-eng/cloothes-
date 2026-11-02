import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const money = n => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n || 0) + ' ' + (process.env.NEXT_PUBLIC_CURRENCY || 'ج.م');
export const price = p => p.sale_price ?? p.price;
