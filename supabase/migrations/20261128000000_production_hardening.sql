-- Production hardening. Additive and safe to apply to a database that already has data:
-- no table or column is dropped, every new object is created only if missing, and
-- policies are replaced by name.
--
-- 1. Functions pin search_path (Supabase linter: function_search_path_mutable).
-- 2. Staff can only change workflow columns on orders and reservations through their
--    own Supabase session; money, payment and customer columns stay server-only.
-- 3. Order and reservation status history, with who made each change.
-- 4. Atomic product save (product + customisations + image in one transaction).
-- 5. Public menu read limited to products in visible categories.
-- 6. Media bucket: size and type limits, fixed folders, no anonymous listing.

-- ───────────── 1. search_path on helper functions ─────────────
alter function public.set_updated_at() set search_path = public;
alter function public.is_staff() set search_path = public;
alter function public.is_manager() set search_path = public;
alter function public.is_owner() set search_path = public;
alter function public.reservations_set_window() set search_path = public;

-- ───────────── 2. column-level write limits for signed-in staff ─────────────
-- RLS decides WHICH rows staff may update; these grants decide WHICH columns. The app's
-- server uses the service role and is unaffected. Without this, a staff login used
-- directly against the REST API could rewrite totals or mark an order paid.
alter table public.orders add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table public.reservations add column if not exists updated_by uuid references auth.users(id) on delete set null;

revoke update on public.orders from anon, authenticated;
grant update (status, updated_by) on public.orders to authenticated;
revoke update on public.reservations from anon, authenticated;
grant update (status, date, time, guests, table_id, staff_note, updated_by) on public.reservations to authenticated;
revoke insert, delete on public.orders, public.order_items, public.payments, public.reservations,
  public.customers, public.webhook_events, public.notification_logs, public.contact_messages from anon, authenticated;

-- ───────────── 3. status history ─────────────
create table if not exists public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  from_payment_status text,
  to_payment_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists order_status_history_order_idx on public.order_status_history (order_id, created_at);

create table if not exists public.reservation_status_history (
  id bigint generated always as identity primary key,
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists reservation_status_history_res_idx on public.reservation_status_history (reservation_id, created_at);

create or replace function public.log_order_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status or new.payment_status is distinct from old.payment_status then
    insert into order_status_history (order_id, from_status, to_status, from_payment_status, to_payment_status, changed_by)
    values (new.id, case when tg_op = 'UPDATE' then old.status end, new.status,
            case when tg_op = 'UPDATE' then old.payment_status end, new.payment_status,
            coalesce(auth.uid(), new.updated_by));
  end if;
  return new;
end $$;
drop trigger if exists orders_status_history on public.orders;
create trigger orders_status_history after insert or update of status, payment_status on public.orders
  for each row execute function public.log_order_status();

create or replace function public.log_reservation_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into reservation_status_history (reservation_id, from_status, to_status, changed_by)
    values (new.id, case when tg_op = 'UPDATE' then old.status end, new.status, coalesce(auth.uid(), new.updated_by));
  end if;
  return new;
end $$;
drop trigger if exists reservations_status_history on public.reservations;
create trigger reservations_status_history after insert or update of status on public.reservations
  for each row execute function public.log_reservation_status();

alter table public.order_status_history enable row level security;
alter table public.reservation_status_history enable row level security;
drop policy if exists "staff read order history" on public.order_status_history;
create policy "staff read order history" on public.order_status_history for select using (public.is_staff());
drop policy if exists "staff read reservation history" on public.reservation_status_history;
create policy "staff read reservation history" on public.reservation_status_history for select using (public.is_staff());
revoke insert, update, delete on public.order_status_history, public.reservation_status_history from anon, authenticated;

-- ───────────── 4. atomic product save ─────────────
create or replace function public.save_product(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare cz jsonb; opt jsonb; i int := 0; j int;
begin
  insert into products (id, slug, category_id, name, description, price, is_veg, is_available, is_featured, sort_order, verification, source_note)
  values (p->>'id', p->>'slug', p->>'category_id', p->>'name', nullif(p->>'description',''), (p->>'price')::int,
          (p->>'is_veg')::boolean, coalesce((p->>'is_available')::boolean, true), coalesce((p->>'is_featured')::boolean, false),
          coalesce((p->>'sort_order')::int, 0), coalesce(p->>'verification', 'owner_to_confirm'), nullif(p->>'source_note',''))
  on conflict (id) do update set
    slug = excluded.slug, category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, is_veg = excluded.is_veg, is_available = excluded.is_available, is_featured = excluded.is_featured,
    sort_order = excluded.sort_order, verification = excluded.verification,
    source_note = coalesce(excluded.source_note, products.source_note);

  delete from product_customizations where product_id = p->>'id';
  for cz in select * from jsonb_array_elements(coalesce(p->'customizations', '[]'::jsonb)) loop
    insert into product_customizations (id, product_id, name, required, max_select, sort_order)
    values (cz->>'id', p->>'id', cz->>'name', coalesce((cz->>'required')::boolean, false), coalesce((cz->>'max_select')::int, 1), i);
    j := 0;
    for opt in select * from jsonb_array_elements(coalesce(cz->'options', '[]'::jsonb)) loop
      insert into customization_options (id, customization_id, label, price_delta, sort_order)
      values (opt->>'id', cz->>'id', opt->>'label', coalesce((opt->>'price_delta')::int, 0), j);
      j := j + 1;
    end loop;
    i := i + 1;
  end loop;

  delete from product_images where product_id = p->>'id';
  if nullif(p->>'image_url', '') is not null then
    insert into product_images (product_id, url, storage_path, alt, is_primary)
    values (p->>'id', p->>'image_url', nullif(p->>'image_path',''), coalesce(nullif(p->>'image_alt',''), p->>'name'), true);
  end if;
end $$;
revoke all on function public.save_product(jsonb) from public, anon, authenticated;

-- ───────────── 5. public menu read ─────────────
drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select using (
  public.is_staff() or exists (select 1 from public.categories c where c.id = category_id and c.is_active)
);

-- ───────────── 6. media storage ─────────────
-- One public bucket, four fixed folders: menu/ (dish photos), gallery/, site/ (banners,
-- hero) and platforms/ (partner and brand logos). Public URLs need no SELECT policy, so
-- the old one, which let anyone list every file, is removed.
update storage.buckets
   set public = true,
       file_size_limit = 8000000,
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif']
 where id = 'media';

drop policy if exists "public read media" on storage.objects;
drop policy if exists "managers upload media" on storage.objects;
drop policy if exists "managers update media" on storage.objects;
drop policy if exists "managers delete media" on storage.objects;
create policy "managers upload media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_manager() and (storage.foldername(name))[1] in ('menu','gallery','site','platforms'));
create policy "managers update media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_manager());
create policy "managers delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_manager());
