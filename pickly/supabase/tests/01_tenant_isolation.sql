-- Tenant isolation: one school can never read or write another school's data.
begin;

-- ---------------------------------------------------------------- fixtures --
-- A second, independent school "B" with its own staff, parent and student.
insert into auth.users (id, email, raw_user_meta_data) values
  ('bbbbbbbb-0000-4000-b000-000000000001', 'admin@school-b.test',   '{"full_name":"Admin B"}'),
  ('bbbbbbbb-0000-4000-b000-000000000002', 'teacher@school-b.test', '{"full_name":"Teacher B"}'),
  ('bbbbbbbb-0000-4000-b000-000000000003', 'parent@school-b.test',  '{"full_name":"Parent B"}');

insert into public.schools (id, slug, name_ar, name_en, city)
values ('bbbbbbbb-0000-4000-a000-000000000001', 'school-b', 'مدرسة ب', 'School B', 'Jeddah');

insert into public.school_members (id, school_id, profile_id, role) values
  ('bbbbbbbb-0000-4000-f000-000000000001', 'bbbbbbbb-0000-4000-a000-000000000001', 'bbbbbbbb-0000-4000-b000-000000000001', 'school_admin'),
  ('bbbbbbbb-0000-4000-f000-000000000002', 'bbbbbbbb-0000-4000-a000-000000000001', 'bbbbbbbb-0000-4000-b000-000000000002', 'teacher');

insert into public.classes (id, school_id, branch_id, name_ar, name_en)
select 'bbbbbbbb-0000-4000-c000-000000000001', school_id, id, 'الصف الأول', 'Grade 1'
from public.school_branches where school_id = 'bbbbbbbb-0000-4000-a000-000000000001';

insert into public.teacher_classes (school_id, member_id, class_id) values
  ('bbbbbbbb-0000-4000-a000-000000000001', 'bbbbbbbb-0000-4000-f000-000000000002', 'bbbbbbbb-0000-4000-c000-000000000001');

insert into public.students (id, school_id, branch_id, class_id, student_number, full_name_ar, full_name_en)
select 'bbbbbbbb-0000-4000-d000-000000000001', school_id, id, 'bbbbbbbb-0000-4000-c000-000000000001', 'B-1', 'طالب ب', 'Student B'
from public.school_branches where school_id = 'bbbbbbbb-0000-4000-a000-000000000001';

insert into public.parents (id, school_id, profile_id, full_name_ar, full_name_en)
values ('bbbbbbbb-0000-4000-e000-000000000001', 'bbbbbbbb-0000-4000-a000-000000000001', 'bbbbbbbb-0000-4000-b000-000000000003', 'ولي أمر ب', 'Parent B');
insert into public.parent_students (school_id, parent_id, student_id)
values ('bbbbbbbb-0000-4000-a000-000000000001', 'bbbbbbbb-0000-4000-e000-000000000001', 'bbbbbbbb-0000-4000-d000-000000000001');

-- An open pickup in school B (created through the workflow as Parent B).
set local role authenticated;
select tests.login('bbbbbbbb-0000-4000-b000-000000000003');
select public.request_pickup('bbbbbbbb-0000-4000-d000-000000000001');
reset role;

-- --------------------------------------------------------------- anonymous --
set local role anon;
select tests.expect_error('select * from public.students', '42501', 'anon cannot read students');
select tests.expect_error('select * from public.pickup_requests', '42501', 'anon cannot read pickups');
select tests.expect_error($$select public.request_pickup('5c400000-0000-4000-d000-000000000001')$$, '42501', 'anon cannot request pickups');
reset role;

-- ------------------------------------------------------------ parent (A) ---
set local role authenticated;
select tests.login('5c400000-0000-4000-b000-000000000011'); -- Ahmed, father of Ali & Layan
select tests.assert((select count(*) from public.students) = 2, 'parent sees exactly their two children');
select tests.assert((select count(*) from public.schools) = 1, 'parent sees only their school');
select tests.assert((select count(*) from public.classes) = 2, 'parent sees the classes of their children');
select tests.assert((select count(*) from public.parents) = 1, 'parent sees only their own parent record');
select tests.assert((select count(*) from public.pickup_requests) = 0, 'parent sees no foreign pickups');
select tests.assert((select count(*) from public.school_members) = 0, 'parent sees no staff memberships');
select tests.expect_error($$select public.request_pickup('bbbbbbbb-0000-4000-d000-000000000001')$$, 'PK001', 'parent cannot request a pickup in another school');
select tests.expect_error($$select public.request_pickup('5c400000-0000-4000-d000-000000000002')$$, 'PK001', 'parent cannot request someone else''s child');
select tests.expect_error($$insert into public.platform_owners values (auth.uid())$$, '42501', 'parent cannot make themself platform owner');
select tests.expect_error($$insert into public.pickup_requests (school_id, branch_id, student_id, pickup_date) select school_id, branch_id, id, current_date from public.students limit 1$$, '42501', 'no direct pickup inserts');
select tests.expect_error($$update public.pickup_requests set status = 'COLLECTED'$$, '42501', 'no direct pickup updates');
-- Profiles: only own row is updatable.
update public.profiles set full_name = 'hacked' where id = '5c400000-0000-4000-b000-000000000002';
reset role;
select tests.assert((select full_name from public.profiles where id = '5c400000-0000-4000-b000-000000000002') = 'Sara Al-Dosari', 'parent cannot edit another profile');

-- --------------------------------------------------------- teacher 1B (A) --
set local role authenticated;
select tests.login('5c400000-0000-4000-b000-000000000003');
select tests.assert((select count(*) from public.students) = 6, 'teacher sees only students of their class');
select tests.assert(not exists (select 1 from public.students where school_id <> '5c400000-0000-4000-a000-000000000001'), 'teacher sees no other school students');
select tests.assert((select count(*) from public.pickup_requests) = 0, 'teacher sees no foreign pickups');
select tests.expect_error($$select public.transition_pickup((select id from public.pickup_requests where student_id = 'bbbbbbbb-0000-4000-d000-000000000001'), 'PREPARING')$$, 'PK001', 'teacher cannot touch another school pickup (null id)');
reset role;
-- Even knowing the exact id of school B's request, teacher A gets "not found".
do $$
declare v_id uuid;
begin
  select id into v_id from public.pickup_requests where student_id = 'bbbbbbbb-0000-4000-d000-000000000001';
  perform set_config('tests.foreign_request', v_id::text, true);
end $$;
set local role authenticated;
select tests.login('5c400000-0000-4000-b000-000000000003');
select tests.expect_error($$select public.transition_pickup(current_setting('tests.foreign_request')::uuid, 'PREPARING')$$, 'PK001', 'teacher cannot transition a foreign pickup by id');
reset role;

-- ---------------------------------------------------------------- gate (A) --
set local role authenticated;
select tests.login('5c400000-0000-4000-b000-000000000005');
select tests.assert((select count(*) from public.students) = 12, 'gate sees all students in own school');
select tests.assert((select count(*) from public.pickup_requests) = 0, 'gate sees no foreign pickups');
select tests.expect_error($$select public.transition_pickup(current_setting('tests.foreign_request')::uuid, 'PARENT_ARRIVED')$$, 'PK001', 'gate cannot transition a foreign pickup');
select tests.expect_error($$insert into public.students (school_id, branch_id, student_number, full_name_ar, full_name_en) select school_id, branch_id, 'X', 'x', 'x' from public.students limit 1$$, '42501', 'gate cannot create students');
reset role;

-- --------------------------------------------------------------- admin (A) --
set local role authenticated;
select tests.login('5c400000-0000-4000-b000-000000000002');
select tests.assert((select count(*) from public.students) = 12, 'admin sees all own students');
select tests.assert((select count(*) from public.schools) = 1, 'admin sees only own school');
select tests.assert((select count(*) from public.parents) = 6, 'admin sees own parents only');
-- Writing into school B is refused by RLS.
select tests.expect_error($$insert into public.classes (school_id, branch_id, name_ar, name_en) values ('bbbbbbbb-0000-4000-a000-000000000001', gen_random_uuid(), 'x', 'x')$$, '42501', 'admin cannot create rows in another school');
-- Cross-tenant linking is refused by composite foreign keys.
select tests.expect_error($$insert into public.parent_students (school_id, parent_id, student_id) values ('5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-e000-000000000001', 'bbbbbbbb-0000-4000-d000-000000000001')$$, '23503', 'cannot link own parent to foreign student');
-- The tenant key is not updatable.
select tests.expect_error($$update public.students set school_id = 'bbbbbbbb-0000-4000-a000-000000000001'$$, '42501', 'school_id is immutable for clients');
-- Updates/deletes against school B silently match nothing.
update public.students set full_name_en = 'hacked' where id = 'bbbbbbbb-0000-4000-d000-000000000001';
delete from public.parent_students where school_id = 'bbbbbbbb-0000-4000-a000-000000000001';
-- Admins cannot (de)activate schools; only the platform owner can.
update public.schools set is_active = false;
select tests.expect_error($$select * from public.platform_school_overview()$$, '42501', 'admin cannot read platform overview');
reset role;
select tests.assert((select full_name_en from public.students where id = 'bbbbbbbb-0000-4000-d000-000000000001') = 'Student B', 'admin A could not modify school B student');
select tests.assert((select count(*) from public.parent_students where school_id = 'bbbbbbbb-0000-4000-a000-000000000001') = 1, 'admin A could not delete school B links');
select tests.assert((select bool_and(is_active) from public.schools), 'admin could not deactivate a school');

-- --------------------------------------------------------------- admin (B) --
set local role authenticated;
select tests.login('bbbbbbbb-0000-4000-b000-000000000001');
select tests.assert((select count(*) from public.students) = 1, 'admin B sees only school B student');
select tests.assert((select count(*) from public.pickup_requests) = 1, 'admin B sees school B pickup');
reset role;

-- ------------------------------------------------------------ platform owner --
set local role authenticated;
select tests.login('5c400000-0000-4000-b000-000000000001');
select tests.assert((select count(*) from public.schools) = 2, 'platform owner sees all schools');
select tests.assert((select count(*) from public.students) = 0, 'platform owner does not see student PII');
select tests.assert((select count(*) from public.platform_school_overview()) = 2, 'platform overview lists schools');
select tests.assert((select student_count from public.platform_school_overview() where slug = 'al-waha-demo') = 12, 'overview counts students');
update public.schools set is_active = false where id = 'bbbbbbbb-0000-4000-a000-000000000001';
reset role;
select tests.assert((select deactivated_at is not null from public.schools where id = 'bbbbbbbb-0000-4000-a000-000000000001'), 'deactivation timestamp recorded');

-- Members of a deactivated school lose access.
set local role authenticated;
select tests.login('bbbbbbbb-0000-4000-b000-000000000001');
select tests.assert((select count(*) from public.students) = 0, 'deactivated school: admin sees nothing');
select tests.login('bbbbbbbb-0000-4000-b000-000000000003');
select tests.assert((select count(*) from public.pickup_requests) = 0, 'deactivated school: parent sees nothing');
select tests.expect_error($$select public.request_pickup('bbbbbbbb-0000-4000-d000-000000000001')$$, 'PK001', 'deactivated school: no new pickups');
reset role;

-- ------------------------------------------------- even the superuser/service --
select tests.expect_error($$update public.pickup_requests set status = 'COLLECTED'$$, 'PK005', 'pickups cannot change outside the workflow, even for service role');

rollback;
