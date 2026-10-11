-- DULCES ANGIE: esquema y políticas de seguridad (RLS)
-- 1) Ejecutá este archivo en Supabase > SQL Editor.
-- 2) Creá el usuario de Angie en Authentication > Users (desactivá los registros públicos).
-- 3) Copiá el UUID de ese usuario y ejecutá el INSERT indicado al final.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  description text not null default '' check (char_length(description) <= 500),
  price numeric(12,2) null check (price is null or price >= 0),
  image_url text not null default '',
  badge text not null default '' check (char_length(badge) <= 30),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_active_sort_idx on public.products(is_active, sort_order, created_at desc);

create or replace function public.is_dulces_angie_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_dulces_angie_admin() from public;
grant execute on function public.is_dulces_angie_admin() to anon, authenticated;

alter table public.admin_users enable row level security;
alter table public.products enable row level security;

-- Solo la sesión del administrador puede consultar la lista de administradores.
drop policy if exists "admin can read own admin record" on public.admin_users;
create policy "admin can read own admin record" on public.admin_users
for select to authenticated using (user_id = auth.uid());

-- La tienda solo puede leer productos publicados. Angie puede leer todos.
drop policy if exists "public reads active products" on public.products;
create policy "public reads active products" on public.products
for select to anon, authenticated using (is_active = true or public.is_dulces_angie_admin());

-- Todas las escrituras requieren la identidad incluida en admin_users.
drop policy if exists "admin inserts products" on public.products;
create policy "admin inserts products" on public.products
for insert to authenticated with check (public.is_dulces_angie_admin());
drop policy if exists "admin updates products" on public.products;
create policy "admin updates products" on public.products
for update to authenticated using (public.is_dulces_angie_admin()) with check (public.is_dulces_angie_admin());
drop policy if exists "admin deletes products" on public.products;
create policy "admin deletes products" on public.products
for delete to authenticated using (public.is_dulces_angie_admin());

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select on public.admin_users to authenticated;

-- Bucket público para mostrar las fotos de los productos (las escrituras siguen protegidas).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "anyone can view product images" on storage.objects;
create policy "anyone can view product images" on storage.objects
for select to public using (bucket_id = 'product-images');
drop policy if exists "admin uploads product images" on storage.objects;
create policy "admin uploads product images" on storage.objects
for insert to authenticated with check (bucket_id = 'product-images' and public.is_dulces_angie_admin() and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "admin updates own product images" on storage.objects;
create policy "admin updates own product images" on storage.objects
for update to authenticated using (bucket_id = 'product-images' and public.is_dulces_angie_admin() and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'product-images' and public.is_dulces_angie_admin() and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "admin deletes own product images" on storage.objects;
create policy "admin deletes own product images" on storage.objects
for delete to authenticated using (bucket_id = 'product-images' and public.is_dulces_angie_admin() and (storage.foldername(name))[1] = auth.uid()::text);

-- Después de crear el usuario en Authentication > Users, reemplazá UUID_AQUI:
-- insert into public.admin_users (user_id) values ('UUID_AQUI');

-- Opcional: cargar tres productos iniciales. Solo ejecutar si la tabla está vacía.
insert into public.products (name, description, price, badge, is_active, sort_order)
select 'Caja sorpresa', 'Una presentación especial para un momento inolvidable.', null, 'Favorito', true, 0
where not exists (select 1 from public.products);
insert into public.products (name, description, price, badge, is_active, sort_order)
select 'Caja de golosinas', 'Golosinas elegidas para armar un regalo lleno de color.', null, 'Dulce', true, 1
where (select count(*) from public.products) = 1;
insert into public.products (name, description, price, badge, is_active, sort_order)
select 'Detalle personalizado', 'Un mensaje pensado especialmente para esa persona.', null, 'Especial', true, 2
where (select count(*) from public.products) = 2;
