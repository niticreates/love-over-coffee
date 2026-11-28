#!/usr/bin/env bash
# Applies migrations to a throwaway database and runs tests/sql/*.sql. Needs a local Postgres.
set -euo pipefail
PSQL="psql -h ${PGHOST:-/tmp} -p ${PGPORT:-5433} -U ${PGUSER:-postgres} -v ON_ERROR_STOP=1 -q"
$PSQL -c "drop database if exists loc_test" -c "create database loc_test"
$PSQL -d loc_test -f scripts/supabase-stub.sql
$PSQL -d loc_test -c "grant usage on schema public to anon, authenticated; alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;"
for f in supabase/migrations/*.sql; do $PSQL -d loc_test -f "$f"; done
for f in tests/sql/*.sql; do $PSQL -d loc_test -f "$f"; done
# The seed must load cleanly against the real schema (fresh DB so tests above stay isolated).
$PSQL -c "drop database if exists loc_seed" -c "create database loc_seed"
$PSQL -d loc_seed -f scripts/supabase-stub.sql
for f in supabase/migrations/*.sql; do $PSQL -d loc_seed -f "$f"; done
$PSQL -d loc_seed -f supabase/seed.sql
echo SEED_LOADS
# Demo seed (demo project only): loads on top of the seed, prices every product, and refuses any database that already has staff accounts.
$PSQL -d loc_seed -f supabase/demo/demo-seed.sql
test "$($PSQL -d loc_seed -tAc "select count(*) from products where price is null")" = "0"
test "$($PSQL -d loc_seed -tAc "select value->>'ordering_enabled' from website_settings where key='commerce'")" = "true"
$PSQL -d loc_seed -c "with u as (insert into auth.users (id) values (gen_random_uuid()) returning id) insert into admin_profiles (user_id, display_name, role) select id, 'Existing owner', 'owner' from u;"
if $PSQL -d loc_seed -f supabase/demo/demo-seed.sql 2>/dev/null; then echo "demo seed ran on a database that already has staff accounts"; exit 1; fi
echo DEMO_SEED_LOADS
