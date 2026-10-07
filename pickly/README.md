# Pickly — Smart Student Pickup

Pickly is a multi-tenant SaaS for school dismissal, built first for Saudi Arabia and later the GCC. Parents request pickup, teachers prepare students, and gate staff hand them over, with one live status shared by everyone. The interface is available in Arabic (RTL) and English (LTR).

- **Stack:** Next.js 16 (App Router) · TypeScript · Supabase (Postgres, Auth, Realtime) · Tailwind CSS v4.
- **Architecture, schema, RLS model, routes, components and security:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- **Milestone plan:** [docs/MILESTONES.md](docs/MILESTONES.md). Milestone 1, the foundation, is complete.

## Run locally

You need Node 20.9 or later and Docker, for the Supabase CLI.

```bash
cd pickly
npm install
npx supabase start          # starts Postgres/Auth/Realtime, applies migrations and seed.sql
cp .env.example .env.local  # paste the API URL and the publishable (anon) key printed above
npm run dev                 # http://localhost:3000
```

To re-apply migrations and the seed at any time, run `npx supabase db reset`.

### Demo accounts

All demo accounts use the password `PicklyDemo2026!`. They are fictional and local only.

| Email | Role |
|---|---|
| `parent@pickly.test` | Parent of **Ali** (Grade 1B) and Layan (Grade 2A) |
| `teacher.1b@pickly.test` | Teacher, Grade 1B |
| `teacher.2a@pickly.test` | Teacher, Grade 2A |
| `gate@pickly.test` | Gate staff |
| `admin@pickly.test` | School administrator |
| `owner@pickly.test` | Platform owner |
| `parent2@` … `parent5@pickly.test` | Other parents |

## Checks

```bash
npm run lint
npm run typecheck
npm run build
# Database: migrations + seed + RLS/workflow test-suite on any plain Postgres 15+
PGHOST=localhost PGUSER=postgres npm run db:test
```

CI runs all of these through `.github/workflows/pickly.yml` at the repository root.
