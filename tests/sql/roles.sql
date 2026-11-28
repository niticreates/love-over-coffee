-- Role limits enforced by the database itself (a staff login used directly against the REST API):
-- only the owner manages staff profiles and website settings; managers and staff cannot
-- promote themselves, add staff, or change business, payment or notification settings.
\set ON_ERROR_STOP 1
begin;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@example.com'),
  ('00000000-0000-0000-0000-0000000000b1', 'manager@example.com'),
  ('00000000-0000-0000-0000-0000000000c1', 'staff@example.com'),
  ('00000000-0000-0000-0000-0000000000d1', 'newcomer@example.com');
insert into admin_profiles (user_id, display_name, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'Owner', 'owner'),
  ('00000000-0000-0000-0000-0000000000b1', 'Manager', 'manager'),
  ('00000000-0000-0000-0000-0000000000c1', 'Staff', 'staff');
insert into website_settings (key, value) values
  ('business', '{"phone_e164":"+910000000000","whatsapp_e164":"+910000000000"}'),
  ('commerce', '{"ordering_enabled":false,"tax_bps":null}'),
  ('notifications', '{"admin_emails":["owner@example.com"]}')
on conflict (key) do update set value = excluded.value;

set local role authenticated;

-- Manager and staff: cannot promote themselves, add staff, or touch website settings.
do $$
declare who uuid;
begin
  foreach who in array array['00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c1']::uuid[] loop
    perform set_config('request.jwt.claim.sub', who::text, true);
    update admin_profiles set role = 'owner' where user_id = who;
    update admin_profiles set is_active = false where user_id = '00000000-0000-0000-0000-0000000000a1';
    begin
      insert into admin_profiles (user_id, display_name, role) values ('00000000-0000-0000-0000-0000000000d1', 'Sneaky', 'owner');
      assert false, 'non-owner created a staff profile';
    exception when insufficient_privilege then null; end;
    delete from admin_profiles where user_id = '00000000-0000-0000-0000-0000000000a1';
    update website_settings set value = value || '{"whatsapp_e164":"+911111111111"}' where key = 'business';
    update website_settings set value = value || '{"tax_bps":1}' where key = 'commerce';
    update website_settings set value = '{"admin_emails":["x@example.com"]}' where key = 'notifications';
    begin
      insert into website_settings (key, value) values ('content', '{}');
      assert false, 'non-owner inserted website settings';
    exception when insufficient_privilege or unique_violation then null; end;
    delete from website_settings where key = 'business';
  end loop;
end $$;

-- Staff can't read notification settings (recipient emails); managers can.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);
do $$ begin assert (select count(*) from website_settings where key = 'notifications') = 0, 'staff read notification settings'; end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
do $$ begin assert (select count(*) from website_settings where key = 'notifications') = 1, 'manager cannot read notification settings'; end $$;

-- A signed-in user with no staff profile sees only their own (missing) profile.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d1', true);
do $$ begin assert (select count(*) from admin_profiles) = 0, 'non-staff read staff profiles'; end $$;

-- Owner: may change roles and settings (proves the checks above aren't vacuous).
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
update admin_profiles set role = 'staff' where user_id = '00000000-0000-0000-0000-0000000000b1';
update website_settings set value = value || '{"tax_bps":500}' where key = 'commerce';

reset role;
do $$ begin
  assert (select role from admin_profiles where user_id = '00000000-0000-0000-0000-0000000000c1') = 'staff', 'staff promoted';
  assert (select is_active from admin_profiles where user_id = '00000000-0000-0000-0000-0000000000a1'), 'owner deactivated by non-owner';
  assert (select count(*) from admin_profiles) = 3, 'staff profile added or removed by non-owner';
  assert (select value->>'whatsapp_e164' from website_settings where key = 'business') = '+910000000000', 'WhatsApp number changed by non-owner';
  assert (select value->>'admin_emails' from website_settings where key = 'notifications') = '["owner@example.com"]', 'notification recipients changed by non-owner';
  -- owner's own changes did apply
  assert (select role from admin_profiles where user_id = '00000000-0000-0000-0000-0000000000b1') = 'staff', 'owner could not change a role';
  assert (select value->>'tax_bps' from website_settings where key = 'commerce') = '500', 'owner could not change settings';
end $$;
rollback;
\echo ROLE_SQL_TESTS_PASSED
