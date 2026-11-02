-- شغّل هذا الملف كاملًا في Supabase > SQL Editor
create table admins(user_id uuid primary key references auth.users on delete cascade);
create function is_admin() returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from admins where user_id=auth.uid()) $$;

create table settings(id int primary key default 1 check(id=1), store_name text default 'ATELIER', tagline text default 'أزياء تُلبس بثقة', about text default '', phone text, whatsapp text, address text, shipping_fee numeric default 50, free_shipping_over numeric default 1500);
insert into settings default values;
create table categories(id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, image text, sort int default 0, visible bool default true, created_at timestamptz default now());
create table products(id uuid primary key default gen_random_uuid(), category_id uuid references categories on delete set null, name text not null, description text, price numeric not null, sale_price numeric, images text[] default '{}', sizes text[] default '{S,M,L,XL,XXL}', colors jsonb default '[]', featured bool default false, best_seller bool default false, visible bool default true, created_at timestamptz default now());
create table stock(product_id uuid references products on delete cascade, size text, color text, qty int not null default 0 check(qty>=0), primary key(product_id,size,color));
create table banners(id uuid primary key default gen_random_uuid(), title text, subtitle text, image text, link text, sort int default 0, visible bool default true, created_at timestamptz default now());
create table coupons(id uuid primary key default gen_random_uuid(), code text unique not null, percent int not null check(percent between 1 and 100), starts_at timestamptz, ends_at timestamptz, category_ids uuid[], product_ids uuid[], active bool default true, created_at timestamptz default now());
create table orders(id uuid primary key default gen_random_uuid(), number bigint generated always as identity, name text, phone text, address text, payment text, status text default 'new', coupon text, subtotal numeric, discount numeric, shipping numeric, total numeric, created_at timestamptz default now());
create table order_items(id uuid primary key default gen_random_uuid(), order_id uuid references orders on delete cascade, product_id uuid references products on delete set null, name text, size text, color text, qty int, price numeric);

-- الصلاحيات: الزائر يقرأ المحتوى المعروض فقط، والمدير يتحكم بكل شيء
do $$ declare t text; begin
 for t in select unnest(array['settings','categories','products','stock','banners','coupons','orders','order_items','admins']) loop
  execute format('alter table %I enable row level security',t);
  execute format('create policy "admin all" on %I for all using(is_admin()) with check(is_admin())',t);
 end loop; end $$;
create policy "pub" on settings for select using(true);
create policy "pub" on categories for select using(visible);
create policy "pub" on products for select using(visible);
create policy "pub" on stock for select using(true);
create policy "pub" on banners for select using(visible);

-- حساب السعر والخصم والشحن داخل قاعدة البيانات (لا نثق بأسعار المتصفح)
create function quote_order(items jsonb, p_coupon text default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare it jsonb; p products; c coupons; s settings; unit numeric; sub numeric:=0; disc numeric:=0; ship numeric; lines jsonb:='[]'; q int; av int;
begin
 select * into s from settings limit 1;
 if coalesce(p_coupon,'')<>'' then
  select * into c from coupons where code=upper(p_coupon) and active and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>=now());
  if not found then raise exception 'coupon_invalid'; end if;
 end if;
 if jsonb_array_length(items)=0 then raise exception 'empty_cart'; end if;
 for it in select * from jsonb_array_elements(items) loop
  select * into p from products where id=(it->>'product_id')::uuid and visible;
  if not found then raise exception 'product_missing'; end if;
  q:=(it->>'qty')::int; if q<1 then raise exception 'bad_qty'; end if;
  select qty into av from stock where product_id=p.id and size=it->>'size' and color=it->>'color';
  if coalesce(av,0)<q then raise exception 'out_of_stock: %',p.name; end if;
  unit:=coalesce(p.sale_price,p.price); sub:=sub+unit*q;
  if c.code is not null and ((c.product_ids is null and c.category_ids is null) or p.id=any(coalesce(c.product_ids,'{}'::uuid[])) or p.category_id=any(coalesce(c.category_ids,'{}'::uuid[]))) then disc:=disc+unit*q*c.percent/100; end if;
  lines:=lines||jsonb_build_object('product_id',p.id,'name',p.name,'size',it->>'size','color',it->>'color','qty',q,'price',unit);
 end loop;
 disc:=round(disc); ship:=case when sub>=s.free_shipping_over then 0 else s.shipping_fee end;
 return jsonb_build_object('lines',lines,'subtotal',sub,'discount',disc,'shipping',ship,'total',sub-disc+ship);
end $$;

create function place_order(p_name text,p_phone text,p_address text,p_payment text,items jsonb,p_coupon text default null) returns bigint language plpgsql security definer set search_path=public as $$
declare q jsonb; l jsonb; oid uuid; num bigint; n int;
begin
 if length(trim(coalesce(p_name,'')))<2 or length(trim(coalesce(p_phone,'')))<7 or length(trim(coalesce(p_address,'')))<5 then raise exception 'bad_details'; end if;
 q:=quote_order(items,p_coupon);
 insert into orders(name,phone,address,payment,coupon,subtotal,discount,shipping,total) values(p_name,p_phone,p_address,p_payment,nullif(upper(p_coupon),''),(q->>'subtotal')::numeric,(q->>'discount')::numeric,(q->>'shipping')::numeric,(q->>'total')::numeric) returning id,number into oid,num;
 for l in select * from jsonb_array_elements(q->'lines') loop
  update stock set qty=qty-(l->>'qty')::int where product_id=(l->>'product_id')::uuid and size=l->>'size' and color=l->>'color' and qty>=(l->>'qty')::int;
  get diagnostics n=row_count; if n=0 then raise exception 'out_of_stock'; end if;
  insert into order_items(order_id,product_id,name,size,color,qty,price) values(oid,(l->>'product_id')::uuid,l->>'name',l->>'size',l->>'color',(l->>'qty')::int,(l->>'price')::numeric);
 end loop;
 return num;
end $$;

create function track_order(p_number bigint,p_phone text) returns jsonb language sql security definer set search_path=public as $$
 select jsonb_build_object('number',o.number,'status',o.status,'total',o.total,'created_at',o.created_at,'items',(select coalesce(jsonb_agg(jsonb_build_object('name',i.name,'size',i.size,'color',i.color,'qty',i.qty)),'[]'::jsonb) from order_items i where i.order_id=o.id)) from orders o where o.number=p_number and o.phone=p_phone $$;

-- إلغاء الطلب يُرجع الكميات للمخزون تلقائيًا
create function restore_stock() returns trigger language plpgsql security definer set search_path=public as $$
begin if new.status='cancelled' and old.status<>'cancelled' then
 update stock s set qty=s.qty+oi.qty from order_items oi where oi.order_id=new.id and s.product_id=oi.product_id and s.size=oi.size and s.color=oi.color; end if; return new; end $$;
create trigger t_restore after update of status on orders for each row execute function restore_stock();

-- تخزين الصور
insert into storage.buckets(id,name,public) values('media','media',true) on conflict do nothing;
create policy "media read" on storage.objects for select using(bucket_id='media');
create policy "media admin" on storage.objects for all using(bucket_id='media' and is_admin()) with check(bucket_id='media' and is_admin());
