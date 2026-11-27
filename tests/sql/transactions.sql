-- Run: scripts/test-sql.sh  (vanilla Postgres + scripts/supabase-stub.sql)
\set ON_ERROR_STOP 1
begin;
insert into categories (id, slug, name) values ('cat_coffee','coffee','Coffee');
insert into products (id, slug, category_id, name, price) values ('prd_x','x','cat_coffee','X', 20000);

-- create_order is idempotent
do $$ declare a uuid; b uuid; p jsonb := '{"idempotency_key":"k1","reference":"LOC-AAAAAA","public_token":"t1","customer_name":"Asha","customer_phone":"+919876543210","fulfilment":"pickup","subtotal":40000,"discount":0,"tax":2000,"delivery_fee":0,"total":42000,"items":[{"product_id":"prd_x","name":"X","unit_price":20000,"quantity":2,"line_total":40000}]}';
begin
  a := create_order(p); b := create_order(p);
  assert a = b, 'idempotency failed';
  assert (select count(*) from orders) = 1, 'duplicate order row';
  assert (select count(*) from order_items) = 1, 'duplicate items';
  -- amount mismatch rejected
  begin perform record_payment(a, 'razorpay', 'order_1', 'pay_1', 100, 'upi', '{}'); assert false, 'mismatch accepted';
  exception when raise_exception then null; end;
  assert record_payment(a, 'razorpay', 'order_1', 'pay_1', 42000, 'upi', '{}') = true, 'first capture';
  assert record_payment(a, 'razorpay', 'order_1', 'pay_1', 42000, 'upi', '{}') = false, 'duplicate callback recorded twice';
  assert (select payment_status from orders where id = a) = 'paid';
  assert (select count(*) from payments) = 1;
end $$;

-- reservation capacity + duplicate guard
do $$ declare r jsonb;
begin
  r := create_reservation('{"reference":"R-1","public_token":"rt1","name":"A","phone":"+919876543210","date":"2030-01-05","time":"19:00","guests":6}', 10, 90);
  assert (r->>'ok')::bool and not (r->>'existed')::bool, 'first booking';
  r := create_reservation('{"reference":"R-2","public_token":"rt2","name":"A","phone":"+919876543210","date":"2030-01-05","time":"19:00","guests":6}', 10, 90);
  assert (r->>'existed')::bool, 'duplicate not detected';
  r := create_reservation('{"reference":"R-3","public_token":"rt3","name":"B","phone":"+919812345678","date":"2030-01-05","time":"19:30","guests":5}', 10, 90);
  assert not (r->>'ok')::bool and r->>'code' = 'full', 'overbooking allowed';
  r := create_reservation('{"reference":"R-4","public_token":"rt4","name":"B","phone":"+919812345678","date":"2030-01-05","time":"20:30","guests":5}', 10, 90);
  assert (r->>'ok')::bool, 'non-overlapping slot rejected';
end $$;

-- table double-booking guard
insert into cafe_tables (id, label, seats) values ('t1','Window',4);
update reservations set table_id = 't1' where reference = 'R-1';
do $$ begin
  update reservations set table_id = 't1' where reference = 'R-4';  -- 20:30 overlaps 19:00+90m? no (ends 20:30) → allowed
  insert into reservations (reference, public_token, name, phone, date, time, guests, table_id)
    values ('R-5','rt5','C','+919811111111','2030-01-05','19:45',2,'t1');
  assert false, 'table double booking allowed';
exception when exclusion_violation then null; end $$;

-- RLS: anon sees menu, never orders/reservations/customers
set local role anon;
do $$ begin
  assert (select count(*) from products) = 1, 'anon cannot read menu';
  assert (select count(*) from orders) = 0, 'anon can read orders!';
  assert (select count(*) from reservations) = 0, 'anon can read reservations!';
  assert (select count(*) from customers) = 0, 'anon can read customers!';
end $$;
do $$ begin
  insert into orders (reference, public_token, idempotency_key, customer_name, customer_phone, fulfilment, subtotal, total) values ('X','X','X','X','+919876543210','pickup',0,0);
  assert false, 'anon inserted an order';
exception when insufficient_privilege then null; end $$;
reset role;
rollback;
\echo SQL_TESTS_PASSED
