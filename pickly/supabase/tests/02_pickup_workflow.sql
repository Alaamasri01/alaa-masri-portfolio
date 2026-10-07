-- The full demo journey for Ali, plus guard rails around every transition.
begin;

-- Parent (Ahmed) requests Ali.
set local role authenticated;
select tests.login('5c400000-0000-4000-b000-000000000011');
select set_config('tests.req', (public.request_pickup('5c400000-0000-4000-d000-000000000001')).id::text, true);
select tests.assert((select status from public.pickup_requests where id = current_setting('tests.req')::uuid) = 'REQUESTED', 'request starts REQUESTED');
select tests.assert((public.request_pickup('5c400000-0000-4000-d000-000000000001')).id = current_setting('tests.req')::uuid, 'repeated request is idempotent');
select tests.assert((select count(*) from public.pickup_events) = 1, 'creation produced exactly one event');
select tests.assert(
  (select from_status is null and to_status = 'REQUESTED' and actor_role = 'parent' and actor_name = 'Ahmed Al-Salem'
          and actor_profile_id = auth.uid() and student_id = '5c400000-0000-4000-d000-000000000001'
          and school_id = '5c400000-0000-4000-a000-000000000001'
     from public.pickup_events),
  'creation event records who, what, which student, which school');
select tests.expect_error($$select public.transition_pickup(current_setting('tests.req')::uuid, 'READY')$$, 'PK003', 'parent cannot mark READY');
select tests.expect_error($$select public.transition_pickup(current_setting('tests.req')::uuid, 'COLLECTED')$$, 'PK002', 'cannot jump to COLLECTED');

-- Another parent cannot see or move Ali's pickup.
select tests.login('5c400000-0000-4000-b000-000000000012');
select tests.assert((select count(*) from public.pickup_requests) = 0, 'other parent cannot see Ali''s pickup');
select tests.expect_error($$select public.transition_pickup(current_setting('tests.req')::uuid, 'CANCELLED')$$, 'PK001', 'other parent cannot cancel');

-- The Grade 2A teacher does not see Grade 1B requests.
select tests.login('5c400000-0000-4000-b000-000000000004');
select tests.assert((select count(*) from public.pickup_requests) = 0, '2A teacher does not see 1B pickups');
select tests.expect_error($$select public.transition_pickup(current_setting('tests.req')::uuid, 'PREPARING')$$, 'PK001', '2A teacher cannot prepare Ali');

-- Gate cannot do the teacher's step.
select tests.login('5c400000-0000-4000-b000-000000000005');
select tests.assert((select count(*) from public.pickup_requests) = 1, 'gate sees the open pickup');
select tests.expect_error($$select public.transition_pickup(current_setting('tests.req')::uuid, 'PREPARING')$$, 'PK003', 'gate cannot start preparing');

-- Grade 1B teacher: Start Preparing → Mark Ready.
select tests.login('5c400000-0000-4000-b000-000000000003');
select tests.assert((select count(*) from public.pickup_requests) = 1, '1B teacher sees Ali''s pickup');
select tests.assert((public.transition_pickup(current_setting('tests.req')::uuid, 'PREPARING')).status = 'PREPARING', 'teacher starts preparing');
select tests.assert((public.transition_pickup(current_setting('tests.req')::uuid, 'PREPARING')).status = 'PREPARING', 'repeat tap is a no-op');
select tests.assert((public.transition_pickup(current_setting('tests.req')::uuid, 'READY')).status = 'READY', 'teacher marks ready');
select tests.expect_error($$select public.transition_pickup(current_setting('tests.req')::uuid, 'COLLECTED')$$, 'PK002', 'teacher cannot skip to collected');
select tests.expect_error($$select public.transition_pickup(current_setting('tests.req')::uuid, 'CANCELLED')$$, 'PK003', 'teacher cannot cancel once ready');

-- Gate: Parent Arrived → Confirm Handover.
select tests.login('5c400000-0000-4000-b000-000000000005');
select tests.assert((public.transition_pickup(current_setting('tests.req')::uuid, 'PARENT_ARRIVED')).status = 'PARENT_ARRIVED', 'gate marks parent arrived');
select tests.assert((public.transition_pickup(current_setting('tests.req')::uuid, 'COLLECTED', 'Handed to father')).status = 'COLLECTED', 'gate confirms handover');
select tests.expect_error($$select public.transition_pickup(current_setting('tests.req')::uuid, 'READY')$$, 'PK002', 'COLLECTED is final');

-- Parent sees the whole, ordered audit trail.
select tests.login('5c400000-0000-4000-b000-000000000011');
select tests.assert((select collected_at is not null from public.pickup_requests where id = current_setting('tests.req')::uuid), 'collected_at set');
select tests.assert(
  (select string_agg(coalesce(from_status::text, '∅') || '>' || to_status || ':' || actor_role, ' ' order by seq)
     from public.pickup_events where pickup_request_id = current_setting('tests.req')::uuid)
  in ('∅>REQUESTED:parent REQUESTED>PREPARING:teacher PREPARING>READY:teacher READY>PARENT_ARRIVED:gate_staff PARENT_ARRIVED>COLLECTED:gate_staff'),
  'audit trail is complete and attributed');
select tests.assert((select count(*) from public.pickup_events) = 5, 'one event per change, none for no-ops');
select tests.expect_error($$update public.pickup_events set note = 'x'$$, '42501', 'clients cannot edit events');

-- A new pickup can be requested after collection; parent can cancel before preparation.
select set_config('tests.req2', (public.request_pickup('5c400000-0000-4000-d000-000000000001')).id::text, true);
select tests.assert(current_setting('tests.req2') <> current_setting('tests.req'), 'new pickup after collection');
select tests.assert((public.transition_pickup(current_setting('tests.req2')::uuid, 'ON_THE_WAY')).status = 'ON_THE_WAY', 'parent on the way');
select tests.assert((public.transition_pickup(current_setting('tests.req2')::uuid, 'CANCELLED')).status = 'CANCELLED', 'parent cancels');
reset role;

-- Events are immutable even for privileged roles.
select tests.expect_error($$update public.pickup_events set note = 'tamper'$$, 'PK006', 'events cannot be updated');
select tests.expect_error($$delete from public.pickup_events$$, 'PK006', 'events cannot be deleted');
select tests.expect_error($$insert into public.pickup_events (school_id, pickup_request_id, student_id, to_status, actor_role) select school_id, id, student_id, 'COLLECTED', 'system' from public.pickup_requests limit 1$$, 'PK005', 'events cannot be forged');

-- A pickup left open yesterday is closed by the system on the next request.
set local role authenticated;
select tests.login('5c400000-0000-4000-b000-000000000011');
select set_config('tests.req3', (public.request_pickup('5c400000-0000-4000-d000-000000000007')).id::text, true);
reset role;
select set_config('pickly.workflow', 'on', true);
update public.pickup_requests set pickup_date = pickup_date - 1 where id = current_setting('tests.req3')::uuid;
select set_config('pickly.workflow', 'off', true);
set local role authenticated;
select tests.login('5c400000-0000-4000-b000-000000000011');
select tests.assert((public.request_pickup('5c400000-0000-4000-d000-000000000007')).id <> current_setting('tests.req3')::uuid, 'stale pickup replaced');
select tests.assert((select status from public.pickup_requests where id = current_setting('tests.req3')::uuid) = 'CANCELLED', 'stale pickup auto-cancelled');
select tests.assert(exists (select 1 from public.pickup_events where pickup_request_id = current_setting('tests.req3')::uuid and actor_role = 'system' and actor_profile_id is null), 'system closure is audited');
reset role;

-- School settings can disable parent self check-in at the gate.
update public.school_settings set allow_parent_arrival = false;
set local role authenticated;
select tests.login('5c400000-0000-4000-b000-000000000011');
select set_config('tests.req4', (public.request_pickup('5c400000-0000-4000-d000-000000000001')).id::text, true);
select tests.login('5c400000-0000-4000-b000-000000000003');
select public.transition_pickup(current_setting('tests.req4')::uuid, 'READY');
select tests.login('5c400000-0000-4000-b000-000000000011');
select tests.expect_error($$select public.transition_pickup(current_setting('tests.req4')::uuid, 'PARENT_ARRIVED')$$, 'PK003', 'setting disables parent self check-in');
reset role;

rollback;
