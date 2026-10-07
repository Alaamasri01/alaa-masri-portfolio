-- Minimal emulation of the Supabase platform objects the migrations depend on,
-- so migrations + RLS tests can run against a plain PostgreSQL instance in CI.
-- NEVER run this against a real Supabase project.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant anon, authenticated, service_role to current_user;

create schema auth;
create schema extensions;
grant usage on schema auth, extensions to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

create table auth.users (
  instance_id uuid,
  id uuid primary key,
  aud text, role text, email text unique,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_app_meta_data jsonb, raw_user_meta_data jsonb,
  confirmation_token text, recovery_token text,
  email_change_token_new text, email_change text,
  created_at timestamptz, updated_at timestamptz
);
create table auth.identities (
  id uuid primary key, user_id uuid references auth.users(id),
  provider_id text, identity_data jsonb, provider text,
  last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz
);

create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
$$;
grant execute on function auth.uid() to anon, authenticated, service_role;

create publication supabase_realtime;

-- Supabase grants these by default on new objects in public.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
