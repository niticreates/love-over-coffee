#!/usr/bin/env bash
# Applies migrations to a throwaway database and runs tests/sql/*.sql. Needs a local Postgres.
set -euo pipefail
PSQL="psql -h ${PGHOST:-/tmp} -p ${PGPORT:-5433} -U ${PGUSER:-postgres} -v ON_ERROR_STOP=1 -q"
$PSQL -c "drop database if exists loc_test" -c "create database loc_test"
$PSQL -d loc_test -f scripts/supabase-stub.sql
$PSQL -d loc_test -c "grant usage on schema public to anon, authenticated; alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;"
for f in supabase/migrations/*.sql; do $PSQL -d loc_test -f "$f"; done
for f in tests/sql/*.sql; do $PSQL -d loc_test -f "$f"; done
