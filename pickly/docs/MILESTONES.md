# Pickly — Implementation plan

Each milestone ends in a deployable, tested state.

## Milestone 1 — Foundation ✅ (this change)

**Goal:** a secure multi-tenant base that every later screen builds on.

**Database**
- Core schema: 13 tables, enums, composite tenant foreign keys and indexes.
- Authorization helpers in the `private` schema.
- Table and column privileges.
- RLS on every table.
- Pickup state machine: `request_pickup` and `transition_pickup`, which are idempotent, use row locks and close stale pickups automatically.
- Immutable audit events with a write gate that also applies to the service role.
- Realtime publication for `pickup_requests` and `pickup_events`.
- Platform overview RPC that returns aggregates only.

**Seed**
- Fictional Al Waha Demo School in Riyadh, with 2 classes (Grade 1B, Grade 2A).
- 2 teachers, 1 gate employee, 1 admin and a platform owner.
- 5 parent accounts plus 1 guardian without a login.
- 12 students, including **Ali**, Grade 1B.

**Tests**
- `scripts/test-db.sh` runs 80 assertions covering tenant isolation, role visibility and the full workflow.
- A CI workflow runs the database tests and the app's lint, typecheck and build.

**App**
- Next.js 16 with TypeScript and Tailwind v4.
- Design tokens and the UI primitives listed in [ARCHITECTURE.md §5](./ARCHITECTURE.md#5-components-and-the-design-system).
- Arabic (RTL, default) and English (LTR) routing with typed dictionaries.
- Supabase SSR clients and `proxy.ts` session refresh.
- Sign-in and sign-out with demo-account shortcuts, shown only when the demo flag is on.
- A session DAL that resolves roles, schools and workspaces.
- Role-based redirects and server guards per workspace.
- App shell with locale switcher and workspace switcher.
- Placeholder workspace pages.
- `/styleguide`.

**Docs:** architecture, schema, RLS model, routes, components, risks and this plan.

## Milestone 2 — The live pickup loop (the demo)

**Goal:** the complete Ali journey, running live in real time across devices.

**Shared**
- `usePickupRealtime(filter)` hook that subscribes, re-fetches the affected row through RLS, and reconnects or catches up on visibility change.
- Server actions `requestPickup` and `transitionPickup` that call the RPCs and map `PK00x` codes to translated toasts.
- Optimistic UI with rollback.

**Parent** (mobile)
- Child cards showing name, school, class and live status, with a Request Pickup button.
- A full-screen live status screen: a large status hero, a timeline of who did what and when, the "I'm on my way" and "I've arrived" actions, and cancel.
- A "Collected" confirmation.

**Teacher** (tablet)
- A queue for the teacher's classes in three columns or segments: New, Preparing, Ready.
- Large Start Preparing and Mark Ready buttons.
- A new-request chime and highlight.
- Elapsed-time badges.

**Gate** (tablet)
- Ready and Parent Arrived lists, with arrived students pinned to the top.
- Parent Arrived and Confirm Handover, with the guardian's name shown.
- Search by student name or number.

**Tests**
- Playwright end-to-end tests of the three-browser demo flow against a local Supabase instance.

## Milestone 3 — School administration

- Today dashboard with counts per status and open pickups, and an admin cancel or override with a reason.
- CRUD for students, classes and branches, with bilingual names, validation and soft deactivation.
- Parents and guardianship links (relationship, can-request).
- Staff management and invitations, using a server-only service-role module: invite by email or phone, assign roles, and assign teachers to classes.
- Pickup history by day, class and student, with the event audit trail and CSV export.
- School settings: dismissal window and parent self-service switches.
- Admin RLS tests for every write path.

## Milestone 4 — Platform owner

- School list with aggregates (already backed by `platform_school_overview`).
- Create a school and invite its first admin.
- Activate and deactivate a school, with confirmation.
- Basic system statistics: schools, students, pickups today and over 7 days.

## Milestone 5 — Reliability and operations

- Scheduled job, using `pg_cron`, that closes stale pickups at the end of each school day.
- Rate limits on pickup RPCs per user.
- Error monitoring and structured logs.
- Realtime fallback polling and an offline banner.
- Load test of a dismissal peak (about 500 pickups in 20 minutes per school).
- Optionally, a move to Broadcast-from-database channels.

## Milestone 6 — Production hardening and launch

- Phone OTP sign-in for parents (a Saudi SMS provider).
- CAPTCHA and CSP headers.
- PWA install with web push notifications for status changes.
- Accessibility audit (WCAG 2.2 AA) in both languages.
- PDPL review: data residency, a retention policy and data export or deletion per school.
- Backups and restore drill.
- Staging and production projects with migrations deployed through CI.

## Later (not in the MVP, but the architecture leaves room)

| Feature | How it fits |
|---|---|
| GPS and geofencing | A `pickup_signals` table and a new `system`/`geofence` actor drive `ON_THE_WAY` and `PARENT_ARRIVED` through `transition_pickup`. |
| Maps | Read-only views of those signals. |
| Native iOS and Android | Same Supabase API, RLS and RPCs. |
| AI assistant and analytics | Read from `pickup_events`. |
| Payments and billing | Per-school subscription tables owned by the platform owner. |
