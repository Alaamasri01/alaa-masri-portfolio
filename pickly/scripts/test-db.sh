#!/usr/bin/env bash
# Applies the shim, all migrations, the seed and the SQL test-suite to a
# throwaway database. Usage: PGHOST=... PGPORT=... PGUSER=... scripts/test-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB="${PICKLY_TEST_DB:-pickly_test}"
psql -v ON_ERROR_STOP=1 -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
run() { psql -v ON_ERROR_STOP=1 -q -o /dev/null -d "$DB" -f "$1"; }
# Cluster-level roles may already exist from a previous run.
psql -q -d postgres -tc "select 1 from pg_roles where rolname='authenticated'" | grep -q 1 \
  && sed -e '/^create role/d' -e '/^grant anon, authenticated/d' supabase/tests/supabase_shim.sql > /tmp/pickly_shim.sql \
  || cp supabase/tests/supabase_shim.sql /tmp/pickly_shim.sql
run /tmp/pickly_shim.sql
for f in supabase/migrations/*.sql; do run "$f"; done
run supabase/seed.sql
for f in supabase/tests/[0-9]*.sql; do echo "▶ $f"; run "$f"; done
echo "✔ database tests passed"
