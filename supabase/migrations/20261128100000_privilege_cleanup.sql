-- Follow-up from the Supabase security advisor on the hosted project (28 Nov 2026).
-- Removes privileges nothing in the app uses. No data, table or policy changes.
--
-- 1. Trigger functions are not meant to be called through /rest/v1/rpc.
revoke execute on function public.log_order_status() from public, anon, authenticated;
revoke execute on function public.log_reservation_status() from public, anon, authenticated;
-- 2. TRUNCATE ignores RLS. Supabase's default grants give it to anon/authenticated; the API
--    can't issue it today, but nobody except the service role should ever hold it.
revoke truncate on all tables in schema public from anon, authenticated;
-- Note: public.admin_role() stays executable on purpose. RLS policies call it as the
-- signed-in user, and it only ever returns that user's own role (or null).
