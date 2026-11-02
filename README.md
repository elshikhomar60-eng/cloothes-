# متجر ملابس — Next.js + Supabase

## التشغيل (مرة واحدة)
1. أنشئ مشروعًا مجانيًا على supabase.com، ثم افتح SQL Editor والصق محتوى `supabase/schema.sql` ونفّذه.
2. من Authentication > Users أنشئ مستخدمًا (بريدك + كلمة مرور قوية)، وانسخ الـ UUID الخاص به.
3. في SQL Editor نفّذ: `insert into admins values ('ضع-الـUUID-هنا');`
4. انسخ `.env.example` إلى `.env.local` وضع الرابط والـ anon key (من Project Settings > API).
5. `npm install` ثم `npm run dev` ثم افتح http://localhost:3000 ولوحة التحكم على /admin
6. للنشر: ارفع المشروع على GitHub واربطه بـ Vercel، وأضف نفس المتغيرات في إعدادات المشروع.

## الأمان
مفتاح anon علني بطبيعته؛ الحماية الفعلية في سياسات RLS داخل schema.sql: الزائر لا يقرأ الطلبات ولا العملاء ولا الكوبونات، والطلبات تُنشأ عبر دالة تحسب الأسعار على الخادم. فعّل أيضًا في Supabase: تعطيل التسجيل العام (Authentication > Providers > Email > Disable signups) حتى لا يُنشئ أحد حسابًا.
