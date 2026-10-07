-- =============================================================================
-- Pickly — demonstration seed (LOCAL / DEMO ENVIRONMENTS ONLY)
--
-- Fictional school in Riyadh. All people, names, e-mails and phone numbers are
-- invented. Demo accounts share one password: PicklyDemo2026!
--
--   owner@pickly.test        Platform owner
--   admin@pickly.test        School administrator
--   teacher.1b@pickly.test   Teacher, Grade 1B   (Ali's class)
--   teacher.2a@pickly.test   Teacher, Grade 2A
--   gate@pickly.test         Gate staff
--   parent@pickly.test       Parent of Ali (1B) and Layan (2A)
--   parent2..5@pickly.test   Other parents
-- =============================================================================

-- Fixed identifiers keep demo links and tests stable.
-- School ............ 5c400000-0000-4000-a000-000000000001
-- Users ............. 5c400000-0000-4000-b000-0000000000NN
-- Classes ........... 5c400000-0000-4000-c000-0000000000NN
-- Students .......... 5c400000-0000-4000-d000-0000000000NN
-- Parents ........... 5c400000-0000-4000-e000-0000000000NN

-- -----------------------------------------------------------------------------
-- Auth users (a profile is created automatically by trigger)
-- -----------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('PicklyDemo2026!', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', u.full_name, 'locale', u.locale),
  '', '', '', '',
  now(), now()
from (values
  ('5c400000-0000-4000-b000-000000000001'::uuid, 'owner@pickly.test',      'Pickly Operations', 'en'),
  ('5c400000-0000-4000-b000-000000000002'::uuid, 'admin@pickly.test',      'Sara Al-Dosari',    'ar'),
  ('5c400000-0000-4000-b000-000000000003'::uuid, 'teacher.1b@pickly.test', 'Noura Al-Harbi',    'ar'),
  ('5c400000-0000-4000-b000-000000000004'::uuid, 'teacher.2a@pickly.test', 'Khalid Al-Otaibi',  'ar'),
  ('5c400000-0000-4000-b000-000000000005'::uuid, 'gate@pickly.test',       'Faisal Al-Qahtani', 'ar'),
  ('5c400000-0000-4000-b000-000000000011'::uuid, 'parent@pickly.test',     'Ahmed Al-Salem',    'ar'),
  ('5c400000-0000-4000-b000-000000000012'::uuid, 'parent2@pickly.test',    'Mona Al-Ghamdi',    'ar'),
  ('5c400000-0000-4000-b000-000000000013'::uuid, 'parent3@pickly.test',    'Abdullah Al-Shehri','en'),
  ('5c400000-0000-4000-b000-000000000014'::uuid, 'parent4@pickly.test',    'Reem Al-Mutairi',   'ar'),
  ('5c400000-0000-4000-b000-000000000015'::uuid, 'parent5@pickly.test',    'Majed Al-Zahrani',  'ar')
) as u(id, email, full_name, locale);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users u
where u.email like '%@pickly.test';

insert into public.platform_owners (profile_id)
values ('5c400000-0000-4000-b000-000000000001');

-- -----------------------------------------------------------------------------
-- School (settings row and main branch are created by trigger)
-- -----------------------------------------------------------------------------
insert into public.schools (id, slug, name_ar, name_en, city, country_code, timezone, default_locale)
values (
  '5c400000-0000-4000-a000-000000000001', 'al-waha-demo',
  'مدرسة الواحة التجريبية', 'Al Waha Demo School',
  'Riyadh', 'SA', 'Asia/Riyadh', 'ar'
);

update public.school_branches
   set name_ar = 'فرع حي الياسمين', name_en = 'Al Yasmin Campus', address = 'Al Yasmin, Riyadh (fictional)'
 where school_id = '5c400000-0000-4000-a000-000000000001' and is_main;

-- -----------------------------------------------------------------------------
-- Staff
-- -----------------------------------------------------------------------------
insert into public.school_members (id, school_id, profile_id, role)
values
  ('5c400000-0000-4000-f000-000000000002', '5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-b000-000000000002', 'school_admin'),
  ('5c400000-0000-4000-f000-000000000003', '5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-b000-000000000003', 'teacher'),
  ('5c400000-0000-4000-f000-000000000004', '5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-b000-000000000004', 'teacher'),
  ('5c400000-0000-4000-f000-000000000005', '5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-b000-000000000005', 'gate_staff');

-- -----------------------------------------------------------------------------
-- Classes
-- -----------------------------------------------------------------------------
insert into public.classes (id, school_id, branch_id, name_ar, name_en, grade_level)
select c.id, s.school_id, b.id, c.name_ar, c.name_en, c.grade
from (values
  ('5c400000-0000-4000-c000-000000000001'::uuid, 'الصف الأول ب',  'Grade 1B', 1),
  ('5c400000-0000-4000-c000-000000000002'::uuid, 'الصف الثاني أ', 'Grade 2A', 2)
) as c(id, name_ar, name_en, grade)
cross join (select '5c400000-0000-4000-a000-000000000001'::uuid as school_id) s
join public.school_branches b on b.school_id = s.school_id and b.is_main;

insert into public.teacher_classes (school_id, member_id, class_id)
values
  ('5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-f000-000000000003', '5c400000-0000-4000-c000-000000000001'),
  ('5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-f000-000000000004', '5c400000-0000-4000-c000-000000000002');

-- -----------------------------------------------------------------------------
-- Students (12)
-- -----------------------------------------------------------------------------
insert into public.students (id, school_id, branch_id, class_id, student_number, full_name_ar, full_name_en)
select st.id, b.school_id, b.id, st.class_id, st.num, st.name_ar, st.name_en
from (values
  ('5c400000-0000-4000-d000-000000000001'::uuid, '5c400000-0000-4000-c000-000000000001'::uuid, 'WD-1001', 'علي أحمد السالم',     'Ali Ahmed Al-Salem'),
  ('5c400000-0000-4000-d000-000000000002'::uuid, '5c400000-0000-4000-c000-000000000001'::uuid, 'WD-1002', 'عمر الغامدي',          'Omar Al-Ghamdi'),
  ('5c400000-0000-4000-d000-000000000003'::uuid, '5c400000-0000-4000-c000-000000000001'::uuid, 'WD-1003', 'سارة الشهري',          'Sarah Al-Shehri'),
  ('5c400000-0000-4000-d000-000000000004'::uuid, '5c400000-0000-4000-c000-000000000001'::uuid, 'WD-1004', 'فهد المطيري',          'Fahad Al-Mutairi'),
  ('5c400000-0000-4000-d000-000000000005'::uuid, '5c400000-0000-4000-c000-000000000001'::uuid, 'WD-1005', 'جود المطيري',          'Joud Al-Mutairi'),
  ('5c400000-0000-4000-d000-000000000006'::uuid, '5c400000-0000-4000-c000-000000000001'::uuid, 'WD-1006', 'حمد الزهراني',         'Hamad Al-Zahrani'),
  ('5c400000-0000-4000-d000-000000000007'::uuid, '5c400000-0000-4000-c000-000000000002'::uuid, 'WD-2001', 'ليان أحمد السالم',     'Layan Ahmed Al-Salem'),
  ('5c400000-0000-4000-d000-000000000008'::uuid, '5c400000-0000-4000-c000-000000000002'::uuid, 'WD-2002', 'لمى الغامدي',          'Lama Al-Ghamdi'),
  ('5c400000-0000-4000-d000-000000000009'::uuid, '5c400000-0000-4000-c000-000000000002'::uuid, 'WD-2003', 'يوسف الشهري',          'Yousef Al-Shehri'),
  ('5c400000-0000-4000-d000-000000000010'::uuid, '5c400000-0000-4000-c000-000000000002'::uuid, 'WD-2004', 'ربى الزهراني',         'Ruba Al-Zahrani'),
  ('5c400000-0000-4000-d000-000000000011'::uuid, '5c400000-0000-4000-c000-000000000002'::uuid, 'WD-2005', 'سعود الزهراني',        'Saud Al-Zahrani'),
  ('5c400000-0000-4000-d000-000000000012'::uuid, '5c400000-0000-4000-c000-000000000002'::uuid, 'WD-2006', 'دانة الزهراني',        'Dana Al-Zahrani')
) as st(id, class_id, num, name_ar, name_en)
join public.school_branches b on b.school_id = '5c400000-0000-4000-a000-000000000001' and b.is_main;

-- -----------------------------------------------------------------------------
-- Parents and guardianship
-- -----------------------------------------------------------------------------
insert into public.parents (id, school_id, profile_id, full_name_ar, full_name_en, phone, email)
values
  ('5c400000-0000-4000-e000-000000000001', '5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-b000-000000000011', 'أحمد السالم',      'Ahmed Al-Salem',     '+966500000001', 'parent@pickly.test'),
  ('5c400000-0000-4000-e000-000000000002', '5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-b000-000000000012', 'منى الغامدي',      'Mona Al-Ghamdi',     '+966500000002', 'parent2@pickly.test'),
  ('5c400000-0000-4000-e000-000000000003', '5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-b000-000000000013', 'عبدالله الشهري',   'Abdullah Al-Shehri', '+966500000003', 'parent3@pickly.test'),
  ('5c400000-0000-4000-e000-000000000004', '5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-b000-000000000014', 'ريم المطيري',      'Reem Al-Mutairi',    '+966500000004', 'parent4@pickly.test'),
  ('5c400000-0000-4000-e000-000000000005', '5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-b000-000000000015', 'ماجد الزهراني',    'Majed Al-Zahrani',   '+966500000005', 'parent5@pickly.test'),
  -- Registered guardian without an app account yet (shows the invite-later flow).
  ('5c400000-0000-4000-e000-000000000006', '5c400000-0000-4000-a000-000000000001', null,                                   'حصة السالم',       'Hessa Al-Salem',     '+966500000006', null);

insert into public.parent_students (school_id, parent_id, student_id, relationship, is_primary)
values
  ('5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-e000-000000000001', '5c400000-0000-4000-d000-000000000001', 'father', true),
  ('5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-e000-000000000001', '5c400000-0000-4000-d000-000000000007', 'father', true),
  ('5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-e000-000000000006', '5c400000-0000-4000-d000-000000000001', 'mother', false),
  ('5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-e000-000000000006', '5c400000-0000-4000-d000-000000000007', 'mother', false),
  ('5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-e000-000000000002', '5c400000-0000-4000-d000-000000000002', 'mother', true),
  ('5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-e000-000000000002', '5c400000-0000-4000-d000-000000000008', 'mother', true),
  ('5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-e000-000000000003', '5c400000-0000-4000-d000-000000000003', 'father', true),
  ('5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-e000-000000000003', '5c400000-0000-4000-d000-000000000009', 'father', true),
  ('5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-e000-000000000004', '5c400000-0000-4000-d000-000000000004', 'mother', true),
  ('5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-e000-000000000004', '5c400000-0000-4000-d000-000000000005', 'mother', true),
  ('5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-e000-000000000005', '5c400000-0000-4000-d000-000000000006', 'father', true),
  ('5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-e000-000000000005', '5c400000-0000-4000-d000-000000000010', 'father', true),
  ('5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-e000-000000000005', '5c400000-0000-4000-d000-000000000011', 'father', true),
  ('5c400000-0000-4000-a000-000000000001', '5c400000-0000-4000-e000-000000000005', '5c400000-0000-4000-d000-000000000012', 'father', true);
