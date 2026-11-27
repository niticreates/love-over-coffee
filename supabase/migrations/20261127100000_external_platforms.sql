-- Third-party booking / ordering / location links, managed from Admin → Integrations.
create table public.external_platforms (
  id text primary key,
  platform_name text not null check (length(platform_name) between 1 and 60),
  platform_type text not null check (platform_type in ('reservation','ordering','location')),
  platform_url text check (platform_url is null or (platform_url ~ '^https://[^\s/@]+\.[^\s@]+$' and length(platform_url) <= 500)),
  platform_logo text,
  brand text not null default 'other' check (brand in ('district','zomato','swiggy','google_maps','other')),
  description text check (length(description) <= 200),
  is_active boolean not null default true,
  is_verified boolean not null default false,   -- confirmed to point at THIS outlet
  verification_note text,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index external_platforms_order_idx on public.external_platforms (platform_type, display_order);
create trigger external_platforms_updated before update on public.external_platforms for each row execute function set_updated_at();

alter table public.external_platforms enable row level security;
-- Public sees only links that are switched on, verified and have a URL.
create policy "public read live platforms" on public.external_platforms for select
  using ((is_active and is_verified and platform_url is not null) or public.is_staff());
create policy "managers write platforms" on public.external_platforms for all
  using (public.is_manager()) with check (public.is_manager());
