-- DEMO PROJECT ONLY. Never run this on the real café database.
--
-- Run in the SQL Editor of the separate demo Supabase project, after every file in
-- supabase/migrations (in order) and supabase/seed.sql. It turns on ordering with SAMPLE
-- prices, a SAMPLE 5% tax, SAMPLE hours and capacity so the client can try every journey.
-- None of these numbers come from the café. The deployed demo labels them as samples
-- (DEMO_MODE=true) and wipes customer entries daily.

-- Refuse to run on the production project (its owner account is known).
do $$
begin
  if exists (select 1 from public.admin_profiles where user_id = 'e2b155bd-f5b4-49fd-8f82-eebfcbbee60c') then
    raise exception 'This is the production database. The demo seed was not applied.';
  end if;
end $$;

-- Sample prices in paise (same values the local preview uses, see demoSamplePrices in src/data/seed.ts).
update products set price = 15000 where id = 'prd_lotus-biscoff-coffee';
update products set price = 18700 where id = 'prd_biscoff-cappuccino';
update products set price = 22400 where id = 'prd_cappuccino';
update products set price = 26100 where id = 'prd_cold-coffee';
update products set price = 29800 where id = 'prd_cafe-frappe';
update products set price = 33500 where id = 'prd_dark-chocolate-frappe';
update products set price = 17200 where id = 'prd_tiramisu-frappe';
update products set price = 20900 where id = 'prd_kit-kat-shake';
update products set price = 24600 where id = 'prd_mango-mojito';
update products set price = 28300 where id = 'prd_lemon-mint-ice-tea';
update products set price = 32000 where id = 'prd_pinky-lemonade';
update products set price = 15700 where id = 'prd_potato-cheese-shots';
update products set price = 19400 where id = 'prd_cheese-fondue';
update products set price = 23100 where id = 'prd_tex-mex-nachos';
update products set price = 26800 where id = 'prd_nachos-fries';
update products set price = 30500 where id = 'prd_masala-pull-apart-garlic-bread';
update products set price = 34200 where id = 'prd_otc-garlic-bread';
update products set price = 17900 where id = 'prd_penne-arrabiata-red';
update products set price = 21600 where id = 'prd_penne-mix-sauce-pasta';
update products set price = 25300 where id = 'prd_cheese-maggi';
update products set price = 29000 where id = 'prd_oreo-brownie-sundae';
update products set price = 32700 where id = 'prd_tiramisu';

update website_settings
   set value = value || '{"ordering_enabled":true,"tax_bps":500,"delivery_enabled":true,"delivery_fee":4000,"free_delivery_above":80000}'::jsonb,
       updated_at = now()
 where key = 'commerce';

update website_settings
   set value = jsonb_set(value, '{hours}', '[{"day":0,"open":"11:00","close":"23:00"},{"day":1,"open":"11:00","close":"23:00"},{"day":2,"open":"11:00","close":"23:00"},{"day":3,"open":"11:00","close":"23:00"},{"day":4,"open":"11:00","close":"23:00"},{"day":5,"open":"11:00","close":"23:00"},{"day":6,"open":"11:00","close":"23:00"}]'::jsonb),
       updated_at = now()
 where key = 'business';

update reservation_settings set max_covers_per_slot = 24, updated_at = now() where id;
