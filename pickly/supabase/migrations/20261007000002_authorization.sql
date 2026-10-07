-- =============================================================================
-- Pickly — authorization: helper functions, privileges and Row Level Security
--
-- Model (see docs/ARCHITECTURE.md §3):
--   * Platform owner  → platform_owners table. Manages schools; does NOT get
--                        blanket access to student/parent data.
--   * Staff           → school_members (school_admin | teacher | gate_staff),
--                        scoped to one school per row.
--   * Parent          → parents row (per school) linked to a profile, and
--                        parent_students links to specific students.
--   * A deactivated school is invisible to its members: every helper below
--     filters on schools.is_active.
--
-- Helpers are SECURITY DEFINER so policies can consult membership tables
-- without recursive RLS evaluation. They live in the `private` schema, which
-- is not exposed through the Data API.
-- =============================================================================

grant usage on schema private to authenticated;

-- -----------------------------------------------------------------------------
-- Helper functions
-- -----------------------------------------------------------------------------
create or replace function private.is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_owners po
    where po.profile_id = (select auth.uid())
  );
$$;

-- Schools where the current user is active staff (optionally limited to roles).
create or replace function private.staff_school_ids(p_roles public.member_role[] default null)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.school_id
  from public.school_members m
  join public.schools s on s.id = m.school_id
  where m.profile_id = (select auth.uid())
    and m.is_active
    and s.is_active
    and (p_roles is null or m.role = any (p_roles));
$$;

create or replace function private.has_school_role(p_school_id uuid, p_roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.school_members m
    join public.schools s on s.id = m.school_id
    where m.profile_id = (select auth.uid())
      and m.school_id = p_school_id
      and m.is_active
      and s.is_active
      and m.role = any (p_roles)
  );
$$;

-- Parent records (one per school) belonging to the current user.
create or replace function private.my_parent_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.parents p
  join public.schools s on s.id = p.school_id
  where p.profile_id = (select auth.uid())
    and p.is_active
    and s.is_active;
$$;

create or replace function private.parent_school_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.school_id
  from public.parents p
  join public.schools s on s.id = p.school_id
  where p.profile_id = (select auth.uid())
    and p.is_active
    and s.is_active;
$$;

-- Students the current user is a guardian of.
create or replace function private.my_student_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select ps.student_id
  from public.parent_students ps
  join public.parents p on p.id = ps.parent_id
  join public.schools s on s.id = p.school_id
  where p.profile_id = (select auth.uid())
    and p.is_active
    and s.is_active;
$$;

-- Classes of the current user's children (so parents can see class names).
create or replace function private.my_student_class_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select st.class_id
  from public.students st
  where st.id in (select private.my_student_ids())
    and st.class_id is not null;
$$;

-- Classes the current user teaches.
create or replace function private.my_teacher_class_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select tc.class_id
  from public.teacher_classes tc
  join public.school_members m on m.id = tc.member_id
  join public.schools s on s.id = m.school_id
  where m.profile_id = (select auth.uid())
    and m.role = 'teacher'
    and m.is_active
    and s.is_active;
$$;

-- Staff may see the profiles of people connected to their school.
create or replace function private.can_view_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.school_members m
    where m.profile_id = p_profile_id
      and m.school_id in (select private.staff_school_ids())
  ) or exists (
    select 1 from public.parents p
    where p.profile_id = p_profile_id
      and p.school_id in (select private.staff_school_ids())
  );
$$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- -----------------------------------------------------------------------------
-- Table privileges. Nothing is available anonymously. RLS further restricts
-- what authenticated users see and change.
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, phone, preferred_locale) on public.profiles to authenticated;

grant select on public.platform_owners to authenticated;

grant select, insert on public.schools to authenticated;
grant update (slug, name_ar, name_en, city, country_code, timezone, default_locale, is_active)
  on public.schools to authenticated;

grant select on public.school_settings to authenticated;
grant update (dismissal_start, dismissal_end, allow_parent_on_the_way, allow_parent_arrival)
  on public.school_settings to authenticated;

grant select, insert, delete on
  public.school_branches,
  public.school_members,
  public.classes,
  public.teacher_classes,
  public.students,
  public.parents,
  public.parent_students
to authenticated;

-- Column-level UPDATE grants: school_id (the tenant key) and ids are never updatable.
grant update (name_ar, name_en, address, is_main, is_active) on public.school_branches to authenticated;
grant update (role, branch_id, is_active) on public.school_members to authenticated;
grant update (branch_id, name_ar, name_en, grade_level, is_active) on public.classes to authenticated;
grant update (member_id, class_id) on public.teacher_classes to authenticated;
grant update (branch_id, class_id, student_number, full_name_ar, full_name_en, is_active)
  on public.students to authenticated;
grant update (profile_id, full_name_ar, full_name_en, phone, email, is_active)
  on public.parents to authenticated;
grant update (relationship, can_request_pickup, is_primary) on public.parent_students to authenticated;

-- Pickup tables are read-only for clients; writes go through workflow functions.
grant select on public.pickup_requests, public.pickup_events to authenticated;

-- -----------------------------------------------------------------------------
-- Enable RLS on every table
-- -----------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.platform_owners  enable row level security;
alter table public.schools          enable row level security;
alter table public.school_settings  enable row level security;
alter table public.school_branches  enable row level security;
alter table public.school_members   enable row level security;
alter table public.classes          enable row level security;
alter table public.teacher_classes  enable row level security;
alter table public.students         enable row level security;
alter table public.parents          enable row level security;
alter table public.parent_students  enable row level security;
alter table public.pickup_requests  enable row level security;
alter table public.pickup_events    enable row level security;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or private.can_view_profile(id)
  );

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- platform_owners: a user can only learn whether they themselves are one.
-- -----------------------------------------------------------------------------
create policy platform_owners_select_self on public.platform_owners
  for select to authenticated
  using (profile_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- schools
-- -----------------------------------------------------------------------------
create policy schools_select on public.schools
  for select to authenticated
  using (
    (select private.is_platform_owner())
    or id in (select private.staff_school_ids())
    or id in (select private.parent_school_ids())
  );

create policy schools_insert_platform on public.schools
  for insert to authenticated
  with check ((select private.is_platform_owner()));

create policy schools_update_platform on public.schools
  for update to authenticated
  using ((select private.is_platform_owner()))
  with check ((select private.is_platform_owner()));

-- -----------------------------------------------------------------------------
-- school_settings
-- -----------------------------------------------------------------------------
create policy school_settings_select on public.school_settings
  for select to authenticated
  using (
    school_id in (select private.staff_school_ids())
    or school_id in (select private.parent_school_ids())
    or (select private.is_platform_owner())
  );

create policy school_settings_update_admin on public.school_settings
  for update to authenticated
  using (school_id in (select private.staff_school_ids('{school_admin}')))
  with check (school_id in (select private.staff_school_ids('{school_admin}')));

-- -----------------------------------------------------------------------------
-- Tenant tables managed by school administrators.
-- Pattern: staff (or the related parent) may read; only admins may write,
-- and WITH CHECK pins the written row to the admin's own school.
-- -----------------------------------------------------------------------------

-- school_branches
create policy school_branches_select on public.school_branches
  for select to authenticated
  using (
    school_id in (select private.staff_school_ids())
    or school_id in (select private.parent_school_ids())
  );
create policy school_branches_admin_insert on public.school_branches
  for insert to authenticated
  with check (school_id in (select private.staff_school_ids('{school_admin}')));
create policy school_branches_admin_update on public.school_branches
  for update to authenticated
  using (school_id in (select private.staff_school_ids('{school_admin}')))
  with check (school_id in (select private.staff_school_ids('{school_admin}')));
create policy school_branches_admin_delete on public.school_branches
  for delete to authenticated
  using (school_id in (select private.staff_school_ids('{school_admin}')));

-- school_members
create policy school_members_select on public.school_members
  for select to authenticated
  using (
    profile_id = (select auth.uid())
    or school_id in (select private.staff_school_ids())
  );
create policy school_members_admin_insert on public.school_members
  for insert to authenticated
  with check (school_id in (select private.staff_school_ids('{school_admin}')));
create policy school_members_admin_update on public.school_members
  for update to authenticated
  using (school_id in (select private.staff_school_ids('{school_admin}')))
  with check (school_id in (select private.staff_school_ids('{school_admin}')));
create policy school_members_admin_delete on public.school_members
  for delete to authenticated
  using (school_id in (select private.staff_school_ids('{school_admin}')));

-- classes
create policy classes_select on public.classes
  for select to authenticated
  using (
    school_id in (select private.staff_school_ids())
    or id in (select private.my_student_class_ids())
  );
create policy classes_admin_insert on public.classes
  for insert to authenticated
  with check (school_id in (select private.staff_school_ids('{school_admin}')));
create policy classes_admin_update on public.classes
  for update to authenticated
  using (school_id in (select private.staff_school_ids('{school_admin}')))
  with check (school_id in (select private.staff_school_ids('{school_admin}')));
create policy classes_admin_delete on public.classes
  for delete to authenticated
  using (school_id in (select private.staff_school_ids('{school_admin}')));

-- teacher_classes
create policy teacher_classes_select on public.teacher_classes
  for select to authenticated
  using (school_id in (select private.staff_school_ids()));
create policy teacher_classes_admin_insert on public.teacher_classes
  for insert to authenticated
  with check (school_id in (select private.staff_school_ids('{school_admin}')));
create policy teacher_classes_admin_update on public.teacher_classes
  for update to authenticated
  using (school_id in (select private.staff_school_ids('{school_admin}')))
  with check (school_id in (select private.staff_school_ids('{school_admin}')));
create policy teacher_classes_admin_delete on public.teacher_classes
  for delete to authenticated
  using (school_id in (select private.staff_school_ids('{school_admin}')));

-- students: admins & gate see the whole school, teachers see their classes,
-- parents see their own children.
create policy students_select on public.students
  for select to authenticated
  using (
    school_id in (select private.staff_school_ids('{school_admin,gate_staff}'))
    or class_id in (select private.my_teacher_class_ids())
    or id in (select private.my_student_ids())
  );
create policy students_admin_insert on public.students
  for insert to authenticated
  with check (school_id in (select private.staff_school_ids('{school_admin}')));
create policy students_admin_update on public.students
  for update to authenticated
  using (school_id in (select private.staff_school_ids('{school_admin}')))
  with check (school_id in (select private.staff_school_ids('{school_admin}')));
create policy students_admin_delete on public.students
  for delete to authenticated
  using (school_id in (select private.staff_school_ids('{school_admin}')));

-- parents: staff of the school (to verify who is collecting), and the parent themself.
create policy parents_select on public.parents
  for select to authenticated
  using (
    school_id in (select private.staff_school_ids())
    or profile_id = (select auth.uid())
  );
create policy parents_admin_insert on public.parents
  for insert to authenticated
  with check (school_id in (select private.staff_school_ids('{school_admin}')));
create policy parents_admin_update on public.parents
  for update to authenticated
  using (school_id in (select private.staff_school_ids('{school_admin}')))
  with check (school_id in (select private.staff_school_ids('{school_admin}')));
create policy parents_admin_delete on public.parents
  for delete to authenticated
  using (school_id in (select private.staff_school_ids('{school_admin}')));

-- parent_students
create policy parent_students_select on public.parent_students
  for select to authenticated
  using (
    school_id in (select private.staff_school_ids())
    or parent_id in (select private.my_parent_ids())
  );
create policy parent_students_admin_insert on public.parent_students
  for insert to authenticated
  with check (school_id in (select private.staff_school_ids('{school_admin}')));
create policy parent_students_admin_update on public.parent_students
  for update to authenticated
  using (school_id in (select private.staff_school_ids('{school_admin}')))
  with check (school_id in (select private.staff_school_ids('{school_admin}')));
create policy parent_students_admin_delete on public.parent_students
  for delete to authenticated
  using (school_id in (select private.staff_school_ids('{school_admin}')));

-- -----------------------------------------------------------------------------
-- Pickup tables: SELECT only. (No insert/update/delete policies exist, and the
-- privileges are not granted, so direct writes are impossible for clients.)
-- -----------------------------------------------------------------------------
create policy pickup_requests_select on public.pickup_requests
  for select to authenticated
  using (
    school_id in (select private.staff_school_ids('{school_admin,gate_staff}'))
    or class_id in (select private.my_teacher_class_ids())
    or student_id in (select private.my_student_ids())
  );

-- Events are visible exactly when their pickup request is visible.
create policy pickup_events_select on public.pickup_events
  for select to authenticated
  using (
    pickup_request_id in (select pr.id from public.pickup_requests pr)
  );
