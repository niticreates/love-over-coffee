-- Tests for 20261128000000_production_hardening.sql: column limits for staff, status history,
-- atomic product save, menu visibility and media storage rules.
\set ON_ERROR_STOP 1
begin;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'staff@example.com'),
  ('00000000-0000-0000-0000-00000000000c', 'manager@example.com'),
  ('00000000-0000-0000-0000-00000000000d', 'stranger@example.com');
insert into admin_profiles (user_id, display_name, role) values
  ('00000000-0000-0000-0000-00000000000a', 'Owner', 'owner'),
  ('00000000-0000-0000-0000-00000000000b', 'Staff', 'staff'),
  ('00000000-0000-0000-0000-00000000000c', 'Manager', 'manager');
insert into categories (id, slug, name) values ('cat_live','live','Live'), ('cat_hidden','hidden','Hidden');
update categories set is_active = false where id = 'cat_hidden';
insert into products (id, slug, category_id, name, price) values ('prd_a','a','cat_live','A', 20000), ('prd_h','h','cat_hidden','H', 10000);
select create_order('{"idempotency_key":"h1","reference":"LOC-H1","public_token":"th1","customer_name":"Asha","customer_phone":"+919876543210","fulfilment":"pickup","subtotal":20000,"discount":0,"tax":0,"delivery_fee":0,"total":20000,"items":[{"product_id":"prd_a","name":"A","unit_price":20000,"quantity":1,"line_total":20000}]}');
select create_reservation('{"reference":"R-H1","public_token":"rh1","name":"A","phone":"+919876543210","date":"2030-02-01","time":"19:00","guests":2}', null, 90);

-- History rows on creation (written by triggers, no actor yet).
do $$ begin
  assert (select count(*) from order_status_history) = 1, 'order creation not logged';
  assert (select count(*) from reservation_status_history) = 1, 'reservation creation not logged';
end $$;

-- Server-side change with updated_by (the app's service-role path) records the actor.
update orders set status = 'confirmed', updated_by = '00000000-0000-0000-0000-00000000000a' where reference = 'LOC-H1';
do $$ begin
  assert (select changed_by from order_status_history where to_status = 'confirmed') = '00000000-0000-0000-0000-00000000000a', 'actor not recorded';
end $$;

-- Staff session used directly against the database: may move status, may not touch money or payment.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);
update orders set status = 'preparing' where reference = 'LOC-H1';
do $$ begin
  assert (select changed_by from order_status_history where to_status = 'preparing') = '00000000-0000-0000-0000-00000000000b', 'staff change not attributed';
end $$;
do $$ begin
  update orders set total = 1 where reference = 'LOC-H1';
  assert false, 'staff changed an order total';
exception when insufficient_privilege then null; end $$;
do $$ begin
  update orders set payment_status = 'paid' where reference = 'LOC-H1';
  assert false, 'staff marked an order paid';
exception when insufficient_privilege then null; end $$;
do $$ begin
  update reservations set phone = '+919811111111' where reference = 'R-H1';
  assert false, 'staff changed a guest phone number';
exception when insufficient_privilege then null; end $$;
update reservations set status = 'confirmed', staff_note = 'Window seat' where reference = 'R-H1';
do $$ begin
  insert into products (id, slug, category_id, name) values ('prd_s','s','cat_live','S');
  assert false, 'staff created a menu item';
exception when insufficient_privilege then null; end $$;
do $$ begin
  insert into storage.objects (bucket_id, name) values ('media', 'menu/x.webp');
  assert false, 'staff uploaded media';
exception when insufficient_privilege then null; end $$;
do $$ begin
  assert (select count(*) from order_status_history) = 3, 'staff cannot read history';
end $$;

-- Manager: may edit the menu and upload into known folders only.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', true);
insert into products (id, slug, category_id, name) values ('prd_m','m','cat_live','M');
insert into storage.objects (bucket_id, name) values ('media', 'menu/dish.webp');
do $$ begin
  insert into storage.objects (bucket_id, name) values ('media', 'private/doc.webp');
  assert false, 'upload outside the allowed folders';
exception when insufficient_privilege then null; end $$;

-- Signed in, but not staff: sees no orders, reservations, customers or history.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', true);
do $$ begin
  assert (select count(*) from orders) = 0, 'outsider read orders';
  assert (select count(*) from reservations) = 0, 'outsider read reservations';
  assert (select count(*) from customers) = 0, 'outsider read customers';
  assert (select count(*) from order_status_history) = 0, 'outsider read history';
  assert (select count(*) from admin_profiles) = 0, 'outsider read staff profiles';
end $$;
do $$ begin
  update orders set status = 'cancelled';
  assert (select count(*) from orders) = 0;
end $$;
reset role;
do $$ begin assert (select status from orders where reference = 'LOC-H1') = 'preparing', 'outsider changed an order'; end $$;

-- Anonymous visitors: products in hidden categories are not readable; no media listing.
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  assert (select count(*) from products where id = 'prd_h') = 0, 'hidden category product visible';
  assert (select count(*) from products where id = 'prd_a') = 1, 'live product hidden';
  assert (select count(*) from storage.objects) = 0, 'anon can list media';
end $$;
reset role;

-- save_product is all-or-nothing: a bad option rolls back the whole save.
select save_product('{"id":"prd_a","slug":"a","category_id":"cat_live","name":"A2","price":25000,"customizations":[{"id":"cz1","name":"Milk","options":[{"id":"o1","label":"Oat","price_delta":3000}]}],"image_url":"/images/a.webp"}');
do $$ begin
  assert (select name from products where id = 'prd_a') = 'A2';
  assert (select count(*) from customization_options where customization_id = 'cz1') = 1;
  assert (select count(*) from product_images where product_id = 'prd_a' and is_primary) = 1;
end $$;
do $$ begin
  perform save_product('{"id":"prd_a","slug":"a","category_id":"cat_live","name":"A3","customizations":[{"id":"cz2","name":"Bad","options":[{"id":"o2","label":null}]}]}');
  assert false, 'invalid option accepted';
exception when not_null_violation then null; end $$;
do $$ begin
  assert (select name from products where id = 'prd_a') = 'A2', 'partial save left behind';
  assert (select count(*) from product_customizations where product_id = 'prd_a') = 1, 'customisations lost on failed save';
end $$;
do $$ begin
  assert (select file_size_limit from storage.buckets where id = 'media') = 8000000, 'bucket size limit missing';
end $$;
rollback;
\echo HARDENING_TESTS_PASSED
