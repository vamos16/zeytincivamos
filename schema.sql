-- ZEYTINYAGI SATIS SITESI - SUPABASE KURULUM SQL
-- Supabase Dashboard > SQL Editor > New query alanına tamamını yapıştırıp Run'a bas.
-- Bu dosya tekrar çalıştırılabilir şekilde hazırlanmıştır.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "admin_users_select_own" on public.admin_users;
create policy "admin_users_select_own"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  brand_name text,
  slogan text,
  short_description text,
  city text,
  address text,
  show_address boolean not null default false,
  phone text,
  whatsapp text,
  instagram_url text,
  facebook_url text,
  email text,
  bank_name text,
  iban_holder text,
  iban text,
  payment_note text,
  shipping_text text,
  hero_title text,
  hero_subtitle text,
  hero_image_url text,
  logo_url text,
  campaign_title text,
  campaign_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.settings (
  id, brand_name, slogan, short_description, payment_note, shipping_text,
  hero_title, hero_subtitle, logo_url, campaign_title, campaign_text
) values (
  1,
  'Köklü Zeytinyağı',
  'Kökünden gelen hakiki lezzet',
  'Marka açıklamanı admin panelinden ekleyebilirsin.',
  'Siparişten sonra IBAN bilgisine ödeme yapıp açıklamaya sipariş kodunu yazınız.',
  'Kargo ve teslimat bilgisi admin panelinden düzenlenebilir.',
  'Köklü Zeytinyağı için hazır premium satış sitesi.',
  'Ürünleri, fiyatları, IBAN bilgilerini, telefon numarasını, görselleri ve müşteri yorumlarını admin panelinden yönetebilirsin.',
  'assets/img/koklu-logo.png',
  'Admin panelinden kampanya başlığı gir.',
  'Bu bölüm ana sayfadaki kampanyayı, avantajı veya güven mesajını göstermek için hazırlandı.'
) on conflict (id) do nothing;

alter table public.settings enable row level security;

drop trigger if exists trg_settings_updated_at on public.settings;
create trigger trg_settings_updated_at
before update on public.settings
for each row execute function public.set_updated_at();

drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read"
on public.settings
for select
to anon, authenticated
using (true);

drop policy if exists "settings_admin_insert" on public.settings;
create policy "settings_admin_insert"
on public.settings
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "settings_admin_update" on public.settings;
create policy "settings_admin_update"
on public.settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  size_label text,
  price numeric(12,2) not null default 0,
  old_price numeric(12,2),
  badge text,
  short_description text,
  description text,
  image_url text,
  in_stock boolean not null default true,
  featured boolean not null default true,
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop policy if exists "products_public_read_active" on public.products;
create policy "products_public_read_active"
on public.products
for select
to anon, authenticated
using (active = true or public.is_admin());

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert"
on public.products
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update"
on public.products
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete"
on public.products
for delete
to authenticated
using (public.is_admin());

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  city text,
  rating int not null default 5 check (rating between 1 and 5),
  comment text not null,
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop trigger if exists trg_reviews_updated_at on public.reviews;
create trigger trg_reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

drop policy if exists "reviews_public_read_active" on public.reviews;
create policy "reviews_public_read_active"
on public.reviews
for select
to anon, authenticated
using (active = true or public.is_admin());

drop policy if exists "reviews_admin_insert" on public.reviews;
create policy "reviews_admin_insert"
on public.reviews
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "reviews_admin_update" on public.reviews;
create policy "reviews_admin_update"
on public.reviews
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "reviews_admin_delete" on public.reviews;
create policy "reviews_admin_delete"
on public.reviews
for delete
to authenticated
using (public.is_admin());

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  customer_name text not null,
  phone text not null,
  city text,
  address text not null,
  note text,
  items jsonb not null default '[]'::jsonb,
  total numeric(12,2) not null default 0,
  status text not null default 'payment_pending' check (status in ('payment_pending','approved','shipped','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop policy if exists "orders_public_insert" on public.orders;
create policy "orders_public_insert"
on public.orders
for insert
to anon, authenticated
with check (true);

drop policy if exists "orders_admin_select" on public.orders;
create policy "orders_admin_select"
on public.orders
for select
to authenticated
using (public.is_admin());

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update"
on public.orders
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete"
on public.orders
for delete
to authenticated
using (public.is_admin());

-- Görsel yüklemeleri için public bucket.
-- Public olması, görsel URL'sine sahip herkesin görselleri görüntüleyebileceği anlamına gelir.
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do update set public = true;

drop policy if exists "site_images_public_read" on storage.objects;
create policy "site_images_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'site-images');

drop policy if exists "site_images_admin_insert" on storage.objects;
create policy "site_images_admin_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'site-images' and public.is_admin());

drop policy if exists "site_images_admin_update" on storage.objects;
create policy "site_images_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'site-images' and public.is_admin())
with check (bucket_id = 'site-images' and public.is_admin());

drop policy if exists "site_images_admin_delete" on storage.objects;
create policy "site_images_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'site-images' and public.is_admin());
