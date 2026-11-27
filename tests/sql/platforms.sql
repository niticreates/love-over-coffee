\set ON_ERROR_STOP 1
begin;
insert into external_platforms (id, platform_name, platform_type, platform_url, is_active, is_verified) values
  ('a','Live','ordering','https://www.zomato.com/x', true, true),
  ('b','Unverified','ordering','https://www.swiggy.com/y', true, false),
  ('c','Disabled','reservation','https://www.district.in/z', false, true),
  ('d','No URL','reservation', null, true, true);
do $$ begin
  insert into external_platforms (id, platform_name, platform_type, platform_url) values ('e','Bad','ordering','javascript:alert(1)');
  assert false, 'unsafe url accepted';
exception when check_violation then null; end $$;
do $$ begin
  insert into external_platforms (id, platform_name, platform_type, platform_url) values ('f','Http','ordering','http://example.com');
  assert false, 'http url accepted';
exception when check_violation then null; end $$;
set local role anon;
do $$ begin
  assert (select count(*) from external_platforms) = 1, 'anon sees hidden platforms';
  assert (select id from external_platforms) = 'a';
end $$;
reset role;
rollback;
\echo PLATFORM_SQL_TESTS_PASSED
