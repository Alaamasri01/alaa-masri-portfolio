-- =============================================================================
-- Pickly — pickup workflow: state machine, audit trail, realtime
--
-- The ONLY way to create or change a pickup is through:
--   public.request_pickup(student_id, note)
--   public.transition_pickup(pickup_request_id, to_status, note)
--
-- Both run as SECURITY DEFINER, authorize the caller against the specific
-- request, validate the transition, lock the row, update it and append an
-- immutable pickup_event — all in one transaction.
--
-- Custom SQLSTATEs (mapped to translated messages in the app):
--   PK001  not found / not visible to caller
--   PK002  transition not allowed from the current status
--   PK003  caller's role may not perform this transition
--   PK004  student not eligible for pickup (inactive)
--   PK005  direct write to pickup tables outside the workflow
--   PK006  audit events are immutable
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Write guards
-- -----------------------------------------------------------------------------

-- pickup_requests / pickup_events may only be written while a workflow function
-- has opened the transaction-local gate. This also applies to the service role,
-- so no back-office script can change a pickup without leaving an audit event.
create or replace function private.guard_pickup_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('pickly.workflow', true), '') <> 'on' then
    raise exception 'pickup data can only be changed through the pickup workflow'
      using errcode = 'PK005';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger guard_pickup_requests_write
  before insert or update or delete on public.pickup_requests
  for each row execute function private.guard_pickup_write();

create trigger guard_pickup_events_insert
  before insert on public.pickup_events
  for each row execute function private.guard_pickup_write();

-- Audit events can never be altered or removed — not even by the workflow.
create or replace function private.forbid_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'pickup events are immutable' using errcode = 'PK006';
end;
$$;

create trigger pickup_events_immutable
  before update or delete on public.pickup_events
  for each row execute function private.forbid_event_mutation();

create trigger pickup_events_no_truncate
  before truncate on public.pickup_events
  for each statement execute function private.forbid_event_mutation();

-- -----------------------------------------------------------------------------
-- State machine
-- -----------------------------------------------------------------------------

-- Which actor roles may move a pickup from p_from to p_to. Order matters: the
-- first role the caller holds is recorded on the event, so the "natural" owner
-- of each step is listed first. Empty array = transition does not exist.
create or replace function private.pickup_transition_roles(
  p_from public.pickup_status,
  p_to public.pickup_status
)
returns public.actor_role[]
language sql
immutable
set search_path = ''
as $$
  select case
    when p_from = 'REQUESTED' and p_to = 'ON_THE_WAY'
      then array['parent', 'school_admin']::public.actor_role[]
    when p_from in ('REQUESTED', 'ON_THE_WAY') and p_to = 'PREPARING'
      then array['teacher', 'school_admin']::public.actor_role[]
    when p_from in ('REQUESTED', 'ON_THE_WAY', 'PREPARING') and p_to = 'READY'
      then array['teacher', 'school_admin']::public.actor_role[]
    when p_from = 'READY' and p_to = 'PARENT_ARRIVED'
      then array['gate_staff', 'parent', 'school_admin']::public.actor_role[]
    when p_from = 'PARENT_ARRIVED' and p_to = 'COLLECTED'
      then array['gate_staff', 'school_admin']::public.actor_role[]
    when p_from in ('REQUESTED', 'ON_THE_WAY') and p_to = 'CANCELLED'
      then array['parent', 'school_admin']::public.actor_role[]
    when p_from in ('PREPARING', 'READY', 'PARENT_ARRIVED') and p_to = 'CANCELLED'
      then array['school_admin']::public.actor_role[]
    else array[]::public.actor_role[]
  end;
$$;

-- Roles the current user holds with respect to one pickup request.
create or replace function private.pickup_actor_roles(p_request public.pickup_requests)
returns public.actor_role[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_roles public.actor_role[] := array[]::public.actor_role[];
begin
  if v_uid is null then
    return v_roles;
  end if;

  if private.has_school_role(p_request.school_id, '{school_admin}') then
    v_roles := v_roles || 'school_admin'::public.actor_role;
  end if;

  if private.has_school_role(p_request.school_id, '{gate_staff}') then
    v_roles := v_roles || 'gate_staff'::public.actor_role;
  end if;

  if p_request.class_id is not null
     and p_request.class_id in (select private.my_teacher_class_ids()) then
    v_roles := v_roles || 'teacher'::public.actor_role;
  end if;

  if exists (
    select 1
    from public.parent_students ps
    join public.parents p on p.id = ps.parent_id
    join public.schools s on s.id = p.school_id
    where ps.student_id = p_request.student_id
      and ps.can_request_pickup
      and p.profile_id = v_uid
      and p.is_active
      and s.is_active
  ) then
    v_roles := v_roles || 'parent'::public.actor_role;
  end if;

  return v_roles;
end;
$$;

-- Appends an audit event. Internal; callers must have opened the workflow gate.
create or replace function private.append_pickup_event(
  p_request public.pickup_requests,
  p_from public.pickup_status,
  p_actor_role public.actor_role,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := case when p_actor_role = 'system' then null else auth.uid() end;
begin
  insert into public.pickup_events (
    school_id, pickup_request_id, student_id,
    from_status, to_status,
    actor_profile_id, actor_role, actor_name, note
  ) values (
    p_request.school_id, p_request.id, p_request.student_id,
    p_from, p_request.status,
    v_uid, p_actor_role,
    coalesce((select pr.full_name from public.profiles pr where pr.id = v_uid), ''),
    nullif(btrim(p_note), '')
  );
end;
$$;

-- Today's date in the school's own time zone.
create or replace function private.school_today(p_school_id uuid)
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select (now() at time zone s.timezone)::date
  from public.schools s
  where s.id = p_school_id;
$$;

-- -----------------------------------------------------------------------------
-- public.request_pickup
-- -----------------------------------------------------------------------------
create or replace function public.request_pickup(
  p_student_id uuid,
  p_note text default null
)
returns public.pickup_requests
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_student public.students;
  v_parent_id uuid;
  v_is_admin boolean;
  v_role public.actor_role;
  v_today date;
  v_open public.pickup_requests;
  v_stale_from public.pickup_status;
  v_new public.pickup_requests;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  -- Lock the student row: serializes concurrent requests for the same child.
  select st.* into v_student
  from public.students st
  join public.schools s on s.id = st.school_id and s.is_active
  where st.id = p_student_id
  for update of st;

  if not found then
    raise exception 'student not found' using errcode = 'PK001';
  end if;

  select p.id into v_parent_id
  from public.parent_students ps
  join public.parents p on p.id = ps.parent_id
  where ps.student_id = v_student.id
    and ps.can_request_pickup
    and p.profile_id = v_uid
    and p.is_active
  limit 1;

  v_is_admin := private.has_school_role(v_student.school_id, '{school_admin}');

  if v_parent_id is not null then
    v_role := 'parent';
  elsif v_is_admin then
    v_role := 'school_admin';
  else
    -- Same error as a missing student: do not reveal existence across tenants.
    raise exception 'student not found' using errcode = 'PK001';
  end if;

  if not v_student.is_active then
    raise exception 'student is not active' using errcode = 'PK004';
  end if;

  perform set_config('pickly.workflow', 'on', true);

  v_today := private.school_today(v_student.school_id);

  select * into v_open
  from public.pickup_requests pr
  where pr.student_id = v_student.id
    and pr.status not in ('COLLECTED', 'CANCELLED')
  for update;

  if found then
    if v_open.pickup_date = v_today then
      -- Idempotent: a repeated tap returns the pickup already in progress.
      perform set_config('pickly.workflow', 'off', true);
      return v_open;
    end if;

    -- A pickup left open on a previous day is closed by the system first.
    v_stale_from := v_open.status;
    update public.pickup_requests
       set status = 'CANCELLED',
           status_changed_at = now(),
           status_changed_by = null,
           cancelled_at = now()
     where id = v_open.id
     returning * into v_open;
    perform private.append_pickup_event(v_open, v_stale_from, 'system', 'auto-closed: open from a previous day');
  end if;

  insert into public.pickup_requests (
    school_id, branch_id, student_id, class_id,
    requested_by_parent_id, requested_by_profile_id,
    status, status_changed_at, status_changed_by, pickup_date, note
  ) values (
    v_student.school_id, v_student.branch_id, v_student.id, v_student.class_id,
    v_parent_id, v_uid,
    'REQUESTED', now(), v_uid, v_today, nullif(btrim(p_note), '')
  )
  returning * into v_new;

  perform private.append_pickup_event(v_new, null, v_role, p_note);

  perform set_config('pickly.workflow', 'off', true);
  return v_new;
end;
$$;

-- -----------------------------------------------------------------------------
-- public.transition_pickup
-- -----------------------------------------------------------------------------
create or replace function public.transition_pickup(
  p_request_id uuid,
  p_to_status public.pickup_status,
  p_note text default null
)
returns public.pickup_requests
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_req public.pickup_requests;
  v_from public.pickup_status;
  v_held public.actor_role[];
  v_allowed public.actor_role[];
  v_role public.actor_role;
  v_settings public.school_settings;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select pr.* into v_req
  from public.pickup_requests pr
  join public.schools s on s.id = pr.school_id and s.is_active
  where pr.id = p_request_id
  for update of pr;

  if not found then
    raise exception 'pickup request not found' using errcode = 'PK001';
  end if;

  v_held := private.pickup_actor_roles(v_req);
  if cardinality(v_held) = 0 then
    raise exception 'pickup request not found' using errcode = 'PK001';
  end if;

  -- Idempotent: repeating the current status (double tap, retry) is a no-op.
  if v_req.status = p_to_status then
    return v_req;
  end if;

  v_from := v_req.status;
  v_allowed := private.pickup_transition_roles(v_from, p_to_status);
  if cardinality(v_allowed) = 0 then
    raise exception 'cannot move pickup from % to %', v_from, p_to_status using errcode = 'PK002';
  end if;

  -- School settings can switch off parent self-service steps.
  select * into v_settings from public.school_settings where school_id = v_req.school_id;
  if p_to_status = 'ON_THE_WAY' and not coalesce(v_settings.allow_parent_on_the_way, true) then
    v_allowed := array_remove(v_allowed, 'parent');
  end if;
  if p_to_status = 'PARENT_ARRIVED' and not coalesce(v_settings.allow_parent_arrival, true) then
    v_allowed := array_remove(v_allowed, 'parent');
  end if;

  select r into v_role
  from unnest(v_allowed) with ordinality as a(r, ord)
  where r = any (v_held)
  order by ord
  limit 1;

  if v_role is null then
    raise exception 'not permitted to move pickup to %', p_to_status using errcode = 'PK003';
  end if;

  perform set_config('pickly.workflow', 'on', true);

  update public.pickup_requests
     set status = p_to_status,
         status_changed_at = now(),
         status_changed_by = v_uid,
         collected_at = case when p_to_status = 'COLLECTED' then now() else collected_at end,
         cancelled_at = case when p_to_status = 'CANCELLED' then now() else cancelled_at end
   where id = v_req.id
   returning * into v_req;

  perform private.append_pickup_event(v_req, v_from, v_role, p_note);

  perform set_config('pickly.workflow', 'off', true);
  return v_req;
end;
$$;

revoke all on function public.request_pickup(uuid, text) from public, anon;
revoke all on function public.transition_pickup(uuid, public.pickup_status, text) from public, anon;
grant execute on function public.request_pickup(uuid, text) to authenticated;
grant execute on function public.transition_pickup(uuid, public.pickup_status, text) to authenticated;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- -----------------------------------------------------------------------------
-- Platform owner: aggregate statistics only (no student/parent PII).
-- -----------------------------------------------------------------------------
create or replace function public.platform_school_overview()
returns table (
  school_id uuid,
  slug text,
  name_ar text,
  name_en text,
  city text,
  is_active boolean,
  created_at timestamptz,
  student_count bigint,
  staff_count bigint,
  parent_count bigint,
  pickups_today bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_platform_owner() then
    raise exception 'platform owner only' using errcode = '42501';
  end if;

  return query
  select s.id, s.slug, s.name_ar, s.name_en, s.city, s.is_active, s.created_at,
    (select count(*) from public.students st where st.school_id = s.id and st.is_active),
    (select count(*) from public.school_members m where m.school_id = s.id and m.is_active),
    (select count(*) from public.parents p where p.school_id = s.id and p.is_active),
    (select count(*) from public.pickup_requests pr
      where pr.school_id = s.id and pr.pickup_date = (now() at time zone s.timezone)::date)
  from public.schools s
  order by s.created_at desc;
end;
$$;

revoke all on function public.platform_school_overview() from public, anon;
grant execute on function public.platform_school_overview() to authenticated;

-- -----------------------------------------------------------------------------
-- Realtime: broadcast row changes on pickup tables. Supabase Realtime applies
-- the subscriber's RLS policies before delivering each change.
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.pickup_requests, public.pickup_events;
  end if;
end;
$$;
