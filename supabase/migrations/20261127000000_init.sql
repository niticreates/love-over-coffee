-- Love Over Coffee — initial schema
-- Users: Supabase's auth.users is the users table. Staff access is granted by a row
-- in admin_profiles. Customers check out as guests; their records live in customers.
-- Money columns are integer paise. All timestamps are timestamptz (UTC); reservation
-- wall-clock date/time are Asia/Kolkata.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ───────────────────────── helpers ─────────────────────────
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ───────────────────────── staff ─────────────────────────
create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null check (role in ('owner','manager','staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger admin_profiles_updated before update on public.admin_profiles for each row execute function set_updated_at();

create or replace function public.admin_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.admin_profiles where user_id = auth.uid() and is_active
$$;
create or replace function public.is_staff() returns boolean language sql stable as $$ select public.admin_role() is not null $$;
create or replace function public.is_manager() returns boolean language sql stable as $$ select public.admin_role() in ('owner','manager') $$;
create or replace function public.is_owner() returns boolean language sql stable as $$ select public.admin_role() = 'owner' $$;

-- ───────────────────────── menu ─────────────────────────
create table public.categories (
  id text primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (length(name) between 1 and 80),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger categories_updated before update on public.categories for each row execute function set_updated_at();

create table public.products (
  id text primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  category_id text not null references public.categories(id) on delete restrict,
  name text not null check (length(name) between 1 and 120),
  description text check (length(description) <= 600),
  price integer check (price is null or price between 0 and 10000000), -- null = owner hasn't priced it; not orderable
  is_veg boolean,                -- null = unverified
  is_available boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  verification text not null default 'owner_to_confirm' check (verification in ('verified','owner_to_confirm')),
  source_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id, sort_order);
create index products_featured_idx on public.products (is_featured) where is_featured;
create trigger products_updated before update on public.products for each row execute function set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  storage_path text,
  url text not null,
  alt text not null default '',
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create unique index product_images_one_primary on public.product_images (product_id) where is_primary;

create table public.product_customizations (
  id text primary key,
  product_id text not null references public.products(id) on delete cascade,
  name text not null,
  required boolean not null default false,
  max_select int not null default 1 check (max_select between 1 and 10),
  sort_order int not null default 0
);
create index product_customizations_product_idx on public.product_customizations (product_id);

create table public.customization_options (
  id text primary key,
  customization_id text not null references public.product_customizations(id) on delete cascade,
  label text not null,
  price_delta integer not null default 0 check (price_delta between -1000000 and 1000000),
  sort_order int not null default 0
);
create index customization_options_cz_idx on public.customization_options (customization_id);

-- ───────────────────────── commerce ─────────────────────────
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique check (phone ~ '^\+91[6-9][0-9]{9}$'),
  name text not null,
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger customers_updated before update on public.customers for each row execute function set_updated_at();

create table public.coupons (
  code text primary key check (code ~ '^[A-Z0-9_-]{3,24}$'),
  kind text not null check (kind in ('percent','flat')),
  value integer not null check (value > 0),
  min_subtotal integer not null default 0,
  max_discount integer,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  check (kind <> 'percent' or value <= 10000)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  public_token text not null unique,
  idempotency_key text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  fulfilment text not null check (fulfilment in ('pickup','delivery')),
  address text,
  landmark text,
  notes text check (length(notes) <= 500),
  coupon_code text references public.coupons(code) on delete set null,
  subtotal integer not null check (subtotal >= 0),
  discount integer not null default 0 check (discount >= 0),
  tax integer not null default 0 check (tax >= 0),
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  total integer not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending','confirmed','preparing','ready_for_pickup','out_for_delivery','completed','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','created','paid','failed','refunded')),
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fulfilment = 'pickup' or address is not null)
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_phone_idx on public.orders (customer_phone);
create trigger orders_updated before update on public.orders for each row execute function set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  name text not null,              -- snapshot at time of order
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 20),
  selections jsonb not null default '[]',
  line_total integer not null check (line_total >= 0)
);
create index order_items_order_idx on public.order_items (order_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider text not null check (provider in ('razorpay','simulated')),
  provider_order_id text,
  provider_payment_id text not null unique,   -- duplicate-callback guard
  amount integer not null check (amount >= 0),
  status text not null check (status in ('captured','authorized','failed')),
  method text,
  raw jsonb,
  created_at timestamptz not null default now()
);
create index payments_order_idx on public.payments (order_id);

create table public.webhook_events (
  provider text not null,
  event_id text not null,
  payload jsonb,
  received_at timestamptz not null default now(),
  primary key (provider, event_id)
);

-- ───────────────────────── reservations ─────────────────────────
create table public.reservation_settings (
  id boolean primary key default true check (id),   -- single row
  enabled boolean not null default true,
  slot_minutes int not null default 30 check (slot_minutes in (15,30,60)),
  seating_minutes int not null default 90 check (seating_minutes between 30 and 300),
  max_guests_per_booking int not null default 10 check (max_guests_per_booking between 1 and 50),
  max_covers_per_slot int check (max_covers_per_slot is null or max_covers_per_slot > 0), -- null = owner hasn't set capacity
  min_lead_minutes int not null default 60,
  max_days_ahead int not null default 30 check (max_days_ahead between 1 and 180),
  last_booking_before_close_minutes int not null default 60,
  updated_at timestamptz not null default now()
);
insert into public.reservation_settings (id) values (true);

create table public.cafe_tables (
  id text primary key,
  label text not null,
  seats int not null check (seats between 1 and 20),
  is_active boolean not null default true
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  public_token text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  name text not null,
  phone text not null check (phone ~ '^\+91[6-9][0-9]{9}$'),
  email text,
  date date not null,
  time time not null,
  start_at timestamptz not null,   -- set by trigger from date+time (IST)
  end_at timestamptz not null,     -- start_at + seating_minutes
  guests int not null check (guests between 1 and 50),
  occasion text,
  requests text check (length(requests) <= 500),
  status text not null default 'requested' check (status in ('requested','confirmed','rejected','cancelled','completed','no_show')),
  table_id text references public.cafe_tables(id) on delete set null,
  seating_minutes int not null default 90,
  staff_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reservations_date_idx on public.reservations (date, time);
create index reservations_status_idx on public.reservations (status, date);
-- Duplicate submission guard: one active booking per phone per slot.
create unique index reservations_no_dup on public.reservations (phone, date, time) where status in ('requested','confirmed');
-- Double-booking guard: an allocated table can't have overlapping active bookings.
alter table public.reservations add constraint reservations_no_table_overlap exclude using gist (
  table_id with =,
  tstzrange(start_at, end_at) with &&
) where (table_id is not null and status in ('requested','confirmed'));
create trigger reservations_updated before update on public.reservations for each row execute function set_updated_at();
create or replace function public.reservations_set_window() returns trigger language plpgsql as $$
begin
  new.start_at := (new.date + new.time) at time zone 'Asia/Kolkata';
  new.end_at := new.start_at + make_interval(mins => new.seating_minutes);
  return new;
end $$;
create trigger reservations_window before insert or update of date, time, seating_minutes on public.reservations
  for each row execute function reservations_set_window();

-- ───────────────────────── content ─────────────────────────
create table public.gallery_images (
  id text primary key,
  category text not null check (category in ('interiors','beverages','food','desserts','experiences')),
  url text,                      -- null = placeholder awaiting a real photograph
  storage_path text,
  alt text not null,
  caption text,
  width int not null default 1200,
  height int not null default 1500,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index gallery_sort_idx on public.gallery_images (sort_order);

create table public.website_settings (
  key text primary key check (key in ('business','commerce','content','notifications')),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('email','whatsapp')),
  template text not null,
  recipient text not null,
  status text not null check (status in ('sent','skipped','failed')),
  detail text,
  created_at timestamptz not null default now()
);
create index notification_logs_created_idx on public.notification_logs (created_at desc);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  message text not null check (length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- ───────────────────────── transactional functions ─────────────────────────
-- Idempotent order creation (order + items in one transaction).
create or replace function public.create_order(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_customer uuid; item jsonb;
begin
  select id into v_id from orders where idempotency_key = p->>'idempotency_key';
  if v_id is not null then return v_id; end if;

  insert into customers (phone, name, email) values (p->>'customer_phone', p->>'customer_name', nullif(p->>'customer_email',''))
  on conflict (phone) do update set name = excluded.name, email = coalesce(excluded.email, customers.email)
  returning id into v_customer;

  insert into orders (reference, public_token, idempotency_key, customer_id, customer_name, customer_phone, customer_email,
    fulfilment, address, landmark, notes, coupon_code, subtotal, discount, tax, delivery_fee, total, status, payment_status)
  values (p->>'reference', p->>'public_token', p->>'idempotency_key', v_customer, p->>'customer_name', p->>'customer_phone',
    nullif(p->>'customer_email',''), p->>'fulfilment', nullif(p->>'address',''), nullif(p->>'landmark',''), nullif(p->>'notes',''),
    nullif(p->>'coupon_code',''), (p->>'subtotal')::int, (p->>'discount')::int, (p->>'tax')::int, (p->>'delivery_fee')::int,
    (p->>'total')::int, coalesce(p->>'status','pending'), coalesce(p->>'payment_status','unpaid'))
  on conflict (idempotency_key) do nothing
  returning id into v_id;

  if v_id is null then  -- lost a race with an identical request
    select id into v_id from orders where idempotency_key = p->>'idempotency_key';
    return v_id;
  end if;

  for item in select * from jsonb_array_elements(p->'items') loop
    insert into order_items (order_id, product_id, name, unit_price, quantity, selections, line_total)
    values (v_id, item->>'product_id', item->>'name', (item->>'unit_price')::int, (item->>'quantity')::int,
      coalesce(item->'selections','[]'::jsonb), (item->>'line_total')::int);
  end loop;
  return v_id;
end $$;

-- Atomic payment capture. Returns true only for the first successful record.
create or replace function public.record_payment(p_order uuid, p_provider text, p_provider_order text, p_payment text,
  p_amount int, p_method text, p_raw jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_total int; v_status text;
begin
  select total, payment_status into v_total, v_status from orders where id = p_order for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_status = 'paid' then return false; end if;
  if p_amount <> v_total then raise exception 'amount_mismatch'; end if;
  insert into payments (order_id, provider, provider_order_id, provider_payment_id, amount, status, method, raw)
  values (p_order, p_provider, p_provider_order, p_payment, p_amount, 'captured', p_method, p_raw)
  on conflict (provider_payment_id) do nothing;
  if not found then return false; end if;
  update orders set payment_status = 'paid', razorpay_payment_id = p_payment where id = p_order;
  return true;
end $$;

-- Capacity-checked reservation insert, serialised per date with an advisory lock.
create or replace function public.create_reservation(p jsonb, p_max_covers int, p_seating int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_existing reservations; v_new reservations; v_booked int; v_start time := (p->>'time')::time; v_date date := (p->>'date')::date;
begin
  perform pg_advisory_xact_lock(hashtext('reservations:' || v_date::text));

  select * into v_existing from reservations
   where phone = p->>'phone' and date = v_date and time = v_start and status in ('requested','confirmed');
  if found then return jsonb_build_object('ok', true, 'existed', true, 'id', v_existing.id); end if;

  if p_max_covers is not null then
    select coalesce(sum(guests),0) into v_booked from reservations
     where date = v_date and status in ('requested','confirmed')
       and time < v_start + make_interval(mins => p_seating)
       and v_start < time + make_interval(mins => p_seating);
    if v_booked + (p->>'guests')::int > p_max_covers then
      return jsonb_build_object('ok', false, 'code', 'full');
    end if;
  end if;

  insert into reservations (reference, public_token, name, phone, email, date, time, guests, occasion, requests, seating_minutes)
  values (p->>'reference', p->>'public_token', p->>'name', p->>'phone', nullif(p->>'email',''), v_date, v_start,
    (p->>'guests')::int, nullif(p->>'occasion',''), nullif(p->>'requests',''), p_seating)
  returning * into v_new;
  return jsonb_build_object('ok', true, 'existed', false, 'id', v_new.id);
end $$;

revoke all on function public.create_order(jsonb) from public, anon, authenticated;
revoke all on function public.record_payment(uuid, text, text, text, int, text, jsonb) from public, anon, authenticated;
revoke all on function public.create_reservation(jsonb, int, int) from public, anon, authenticated;

-- ───────────────────────── Row Level Security ─────────────────────────
-- The public site reads through the anon key only for menu/gallery/public settings.
-- Orders, reservations, customers and payments are never readable by anon: customers
-- reach their own record only through the server, using an unguessable public_token.
alter table public.admin_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_customizations enable row level security;
alter table public.customization_options enable row level security;
alter table public.customers enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.webhook_events enable row level security;
alter table public.reservation_settings enable row level security;
alter table public.cafe_tables enable row level security;
alter table public.reservations enable row level security;
alter table public.gallery_images enable row level security;
alter table public.website_settings enable row level security;
alter table public.notification_logs enable row level security;
alter table public.contact_messages enable row level security;

-- Public read
create policy "public read categories" on public.categories for select using (is_active or public.is_staff());
create policy "public read products" on public.products for select using (true);
create policy "public read product images" on public.product_images for select using (true);
create policy "public read customizations" on public.product_customizations for select using (true);
create policy "public read options" on public.customization_options for select using (true);
create policy "public read gallery" on public.gallery_images for select using (true);
create policy "public read reservation settings" on public.reservation_settings for select using (true);
create policy "public read settings" on public.website_settings for select using (key <> 'notifications' or public.is_manager());

-- Staff
create policy "self read profile" on public.admin_profiles for select using (user_id = auth.uid() or public.is_owner());
create policy "owner manage profiles" on public.admin_profiles for all using (public.is_owner()) with check (public.is_owner());

create policy "managers write categories" on public.categories for all using (public.is_manager()) with check (public.is_manager());
create policy "managers write products" on public.products for all using (public.is_manager()) with check (public.is_manager());
create policy "managers write product images" on public.product_images for all using (public.is_manager()) with check (public.is_manager());
create policy "managers write customizations" on public.product_customizations for all using (public.is_manager()) with check (public.is_manager());
create policy "managers write options" on public.customization_options for all using (public.is_manager()) with check (public.is_manager());
create policy "managers write gallery" on public.gallery_images for all using (public.is_manager()) with check (public.is_manager());
create policy "managers write coupons" on public.coupons for all using (public.is_manager()) with check (public.is_manager());
create policy "staff read coupons" on public.coupons for select using (public.is_staff());
create policy "owner write settings" on public.website_settings for all using (public.is_owner()) with check (public.is_owner());
create policy "managers write reservation settings" on public.reservation_settings for update using (public.is_manager()) with check (public.is_manager());
create policy "managers write tables" on public.cafe_tables for all using (public.is_manager()) with check (public.is_manager());
create policy "staff read tables" on public.cafe_tables for select using (public.is_staff());

create policy "staff read customers" on public.customers for select using (public.is_staff());
create policy "staff read orders" on public.orders for select using (public.is_staff());
create policy "staff update orders" on public.orders for update using (public.is_staff()) with check (public.is_staff());
create policy "staff read order items" on public.order_items for select using (public.is_staff());
create policy "staff read payments" on public.payments for select using (public.is_staff());
create policy "staff read reservations" on public.reservations for select using (public.is_staff());
create policy "staff update reservations" on public.reservations for update using (public.is_staff()) with check (public.is_staff());
create policy "staff read notification logs" on public.notification_logs for select using (public.is_staff());
create policy "staff read contact messages" on public.contact_messages for select using (public.is_staff());
-- No anon/authenticated INSERT policies exist on orders, reservations, payments, customers,
-- contact_messages or webhook_events: all writes go through validated server routes
-- using the service role, or the security-definer functions above.

-- ───────────────────────── storage ─────────────────────────
-- Public bucket for menu + gallery images; only managers may write.
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
create policy "public read media" on storage.objects for select using (bucket_id = 'media');
create policy "managers upload media" on storage.objects for insert with check (bucket_id = 'media' and public.is_manager());
create policy "managers update media" on storage.objects for update using (bucket_id = 'media' and public.is_manager());
create policy "managers delete media" on storage.objects for delete using (bucket_id = 'media' and public.is_manager());
