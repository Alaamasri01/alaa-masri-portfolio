-- Test helpers (created once per test database; never part of migrations).
create schema if not exists tests;
grant usage on schema tests to authenticated, anon;

create or replace function tests.assert(p_condition boolean, p_message text)
returns void language plpgsql as $$
begin
  if p_condition is not true then
    raise exception 'ASSERTION FAILED: %', p_message;
  end if;
end;
$$;

-- Runs p_sql as the current role and asserts it fails with p_sqlstate.
create or replace function tests.expect_error(p_sql text, p_sqlstate text, p_message text)
returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if sqlstate <> p_sqlstate then
      raise exception 'ASSERTION FAILED: % (expected SQLSTATE %, got % — %)', p_message, p_sqlstate, sqlstate, sqlerrm;
    end if;
    return;
  end;
  raise exception 'ASSERTION FAILED: % (expected SQLSTATE %, but no error)', p_message, p_sqlstate;
end;
$$;

-- Impersonate a user the way PostgREST does (role is switched separately with SET LOCAL ROLE).
create or replace function tests.login(p_user uuid)
returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

grant execute on all functions in schema tests to authenticated, anon;
