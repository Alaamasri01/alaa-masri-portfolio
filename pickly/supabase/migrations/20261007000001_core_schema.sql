-- =============================================================================
-- Pickly — core multi-tenant schema
--
-- Tenancy rule: every tenant-owned row carries school_id. Relationships between
-- tenant rows use COMPOSITE foreign keys (school_id, id) so the database itself
-- refuses to link, e.g., a student of school A to a class of school B.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- Private schema for authorization helpers. It is NOT exposed through the
-- Supabase Data API, so its functions cannot be called directly by clients.
create schema if not exists private;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.app_locale as enum ('ar', 'en');

create type public.member_role as enum ('school_admin', 'teacher', 'gate_staff');

create type public.pickup_status as enum (
  'REQUESTED',
  'ON_THE_WAY',
  'PREPARING',
  'READY',
  'PARENT_ARRIVED',
  'COLLECTED',
  'CANCELLED'
);

-- Role in which an actor performed a pickup transition (snapshotted on events).
create type public.actor_role as enum (
  'parent',
  'teacher',
  'gate_staff',
  'school_admin',
  'system'
);

create type public.guardian_relationship as enum (
  'father',
  'mother',
  'guardian',
  'driver',
  'relative',
  'other'
);

-- -----------------------------------------------------------------------------
-- Shared trigger: maintain updated_at
-- -----------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Identity (global, not tenant-owned)
-- -----------------------------------------------------------------------------

-- One profile per auth user. A person may belong to several schools
-- (e.g. a parent with children in two schools, or a teacher who is also a parent).
create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  full_name        text not null default '' check (char_length(full_name) <= 200),
  phone            text check (phone is null or phone ~ '^\+?[0-9]{6,20}$'),
  preferred_locale public.app_locale not null default 'ar',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Platform owners (Pickly staff). Deliberately a separate table, never a column
-- on profiles, so no profile update can ever escalate privileges.
create table public.platform_owners (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Tenants
-- -----------------------------------------------------------------------------
create table public.schools (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  name_ar         text not null check (char_length(name_ar) between 1 and 200),
  name_en         text not null check (char_length(name_en) between 1 and 200),
  city            text,
  country_code    char(2) not null default 'SA' check (country_code ~ '^[A-Z]{2}$'),
  timezone        text not null default 'Asia/Riyadh',
  default_locale  public.app_locale not null default 'ar',
  is_active       boolean not null default true,
  deactivated_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Per-school operational settings, editable by the school's administrators.
create table public.school_settings (
  school_id                 uuid primary key references public.schools (id) on delete cascade,
  dismissal_start           time not null default '12:30',
  dismissal_end             time not null default '14:30',
  allow_parent_on_the_way   boolean not null default true,
  allow_parent_arrival      boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create table public.school_branches (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools (id) on delete restrict,
  name_ar     text not null check (char_length(name_ar) between 1 and 200),
  name_en     text not null check (char_length(name_en) between 1 and 200),
  address     text,
  is_main     boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (school_id, id)
);
create unique index school_branches_one_main_idx on public.school_branches (school_id) where is_main;

-- Staff membership. One row per (school, person, role); a person can hold
-- several roles in the same school (e.g. admin + teacher).
create table public.school_members (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools (id) on delete restrict,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  role        public.member_role not null,
  branch_id   uuid,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (school_id, profile_id, role),
  unique (school_id, id),
  foreign key (school_id, branch_id) references public.school_branches (school_id, id) on delete restrict
);
create index school_members_profile_idx on public.school_members (profile_id) where is_active;

create table public.classes (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references public.schools (id) on delete restrict,
  branch_id    uuid not null,
  name_ar      text not null check (char_length(name_ar) between 1 and 100),
  name_en      text not null check (char_length(name_en) between 1 and 100),
  grade_level  smallint check (grade_level between 0 and 12),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (school_id, id),
  foreign key (school_id, branch_id) references public.school_branches (school_id, id) on delete restrict
);
create index classes_school_idx on public.classes (school_id);

create table public.teacher_classes (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools (id) on delete restrict,
  member_id   uuid not null,
  class_id    uuid not null,
  created_at  timestamptz not null default now(),
  unique (member_id, class_id),
  foreign key (school_id, member_id) references public.school_members (school_id, id) on delete cascade,
  foreign key (school_id, class_id) references public.classes (school_id, id) on delete cascade
);
create index teacher_classes_class_idx on public.teacher_classes (class_id);

create table public.students (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references public.schools (id) on delete restrict,
  branch_id       uuid not null,
  class_id        uuid,
  student_number  text not null check (char_length(student_number) between 1 and 50),
  full_name_ar    text not null check (char_length(full_name_ar) between 1 and 200),
  full_name_en    text not null check (char_length(full_name_en) between 1 and 200),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (school_id, id),
  unique (school_id, student_number),
  foreign key (school_id, branch_id) references public.school_branches (school_id, id) on delete restrict,
  foreign key (school_id, class_id) references public.classes (school_id, id) on delete restrict
);
create index students_class_idx on public.students (class_id);

-- A parent/guardian record inside one school. profile_id links it to a login;
-- it may be null while the school has registered the guardian but not yet
-- invited them.
create table public.parents (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references public.schools (id) on delete restrict,
  profile_id    uuid references public.profiles (id) on delete set null,
  full_name_ar  text not null check (char_length(full_name_ar) between 1 and 200),
  full_name_en  text not null check (char_length(full_name_en) between 1 and 200),
  phone         text check (phone is null or phone ~ '^\+?[0-9]{6,20}$'),
  email         text check (email is null or position('@' in email) > 1),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (school_id, id),
  unique (school_id, profile_id)
);
create index parents_profile_idx on public.parents (profile_id) where is_active;

create table public.parent_students (
  id                  uuid primary key default gen_random_uuid(),
  school_id           uuid not null references public.schools (id) on delete restrict,
  parent_id           uuid not null,
  student_id          uuid not null,
  relationship        public.guardian_relationship not null default 'guardian',
  can_request_pickup  boolean not null default true,
  is_primary          boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (parent_id, student_id),
  foreign key (school_id, parent_id) references public.parents (school_id, id) on delete cascade,
  foreign key (school_id, student_id) references public.students (school_id, id) on delete cascade
);
create index parent_students_student_idx on public.parent_students (student_id);

-- -----------------------------------------------------------------------------
-- Pickup workflow
-- -----------------------------------------------------------------------------

-- Current state of one pickup. Clients can only READ this table; every write
-- goes through the request_pickup / transition_pickup functions so that each
-- change produces an immutable pickup_event.
create table public.pickup_requests (
  id                       uuid primary key default gen_random_uuid(),
  school_id                uuid not null references public.schools (id) on delete restrict,
  branch_id                uuid not null,
  student_id               uuid not null,
  -- Snapshot of the student's class when requested; drives teacher queues
  -- and realtime filters without a join.
  class_id                 uuid,
  requested_by_parent_id   uuid,
  requested_by_profile_id  uuid references public.profiles (id) on delete set null,
  status                   public.pickup_status not null default 'REQUESTED',
  status_changed_at        timestamptz not null default now(),
  status_changed_by        uuid references public.profiles (id) on delete set null,
  -- School-local calendar day of the pickup (for daily queues and history).
  pickup_date              date not null,
  note                     text check (char_length(note) <= 500),
  collected_at             timestamptz,
  cancelled_at             timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (school_id, id),
  foreign key (school_id, branch_id) references public.school_branches (school_id, id) on delete restrict,
  foreign key (school_id, student_id) references public.students (school_id, id) on delete restrict,
  foreign key (school_id, class_id) references public.classes (school_id, id) on delete restrict,
  foreign key (school_id, requested_by_parent_id) references public.parents (school_id, id) on delete restrict
);

-- At most one open pickup per student.
create unique index pickup_requests_one_open_per_student_idx
  on public.pickup_requests (student_id)
  where status not in ('COLLECTED', 'CANCELLED');
create index pickup_requests_school_open_idx
  on public.pickup_requests (school_id, status)
  where status not in ('COLLECTED', 'CANCELLED');
create index pickup_requests_class_open_idx
  on public.pickup_requests (class_id, status)
  where status not in ('COLLECTED', 'CANCELLED');
create index pickup_requests_school_date_idx on public.pickup_requests (school_id, pickup_date desc);
create index pickup_requests_student_idx on public.pickup_requests (student_id, created_at desc);

-- Append-only audit trail: who did what, to which student, when.
create table public.pickup_events (
  id                 uuid primary key default gen_random_uuid(),
  -- Strict global ordering (timestamps can tie inside one transaction).
  seq                bigint generated always as identity unique,
  school_id          uuid not null references public.schools (id) on delete restrict,
  pickup_request_id  uuid not null,
  student_id         uuid not null,
  from_status        public.pickup_status,          -- null for the creating event
  to_status          public.pickup_status not null,
  actor_profile_id   uuid references public.profiles (id) on delete set null,
  actor_role         public.actor_role not null,
  actor_name         text not null default '',       -- snapshot; survives profile edits
  note               text check (char_length(note) <= 500),
  created_at         timestamptz not null default clock_timestamp(),
  foreign key (school_id, pickup_request_id) references public.pickup_requests (school_id, id) on delete restrict,
  foreign key (school_id, student_id) references public.students (school_id, id) on delete restrict
);
create index pickup_events_request_idx on public.pickup_events (pickup_request_id, seq);
create index pickup_events_school_time_idx on public.pickup_events (school_id, created_at desc);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'schools', 'school_settings', 'school_branches', 'school_members',
    'classes', 'students', 'parents', 'parent_students', 'pickup_requests'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function private.set_updated_at()', t);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Integrity triggers
-- -----------------------------------------------------------------------------

-- teacher_classes may only reference members holding the teacher role.
create or replace function private.ensure_teacher_member()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.school_members m
    where m.id = new.member_id and m.role = 'teacher'
  ) then
    raise exception 'member % is not a teacher', new.member_id using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger ensure_teacher_member
  before insert or update on public.teacher_classes
  for each row execute function private.ensure_teacher_member();

-- Every school gets a settings row and a main branch automatically.
create or replace function private.bootstrap_school()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.school_settings (school_id) values (new.id);
  insert into public.school_branches (school_id, name_ar, name_en, is_main)
    values (new.id, 'الفرع الرئيسي', 'Main campus', true);
  return new;
end;
$$;

create trigger bootstrap_school
  after insert on public.schools
  for each row execute function private.bootstrap_school();

create or replace function private.track_school_deactivation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_active is distinct from old.is_active then
    new.deactivated_at := case when new.is_active then null else now() end;
  end if;
  return new;
end;
$$;

create trigger track_school_deactivation
  before update on public.schools
  for each row execute function private.track_school_deactivation();

-- Create a profile whenever a Supabase Auth user is created.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, preferred_locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en'::public.app_locale
         else 'ar'::public.app_locale end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
