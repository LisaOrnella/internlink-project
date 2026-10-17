# InternLink — Your Future Starts With an Internship

A full-stack internship platform connecting university students with companies.
**Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Supabase (PostgreSQL + Auth + Storage) · Zod · React Hook Form · Recharts**

Roles: **Student**, **Company**, **Administrator** — each with its own dashboard, enforced on the server *and* in the database (Row Level Security).

---

## ⚠️ Honest status (read this first)

This project was written in an environment that **could not install npm packages**, so the app was **never compiled or run end to end**. What *was* actually run and verified:

| Check | Result |
|---|---|
| SQL migrations apply cleanly on PostgreSQL 16 (with a stand-in for Supabase's `auth`/`storage`) | ✅ ran |
| 57 database security checks (`tests/sql/01_rls_workflow.sql`): role escalation blocked, students can't see each other's applications, company-only notes, resume privacy, duplicate-apply blocked, suspension, moderation… | ✅ all passed |
| Unit tests for matching + formatting (`tests/matching.test.ts`, `tests/format.test.ts`) — 11 tests | ✅ passed (this found and fixed a deadline bug) |
| Syntax check of all 94 TypeScript files; every internal `@/…` import resolves to a real export | ✅ ran, 0 problems |
| `npm install`, `npm run lint`, `npm run typecheck`, `npm run build`, Playwright e2e, `tests/validators.test.ts` | ❌ **not run** — expect to fix a few small type/lint errors on first run |

Not built: student–company **messaging**, **dark mode**, **email delivery** (in-app notifications work; email needs an external service you configure), calendar/interview scheduling and the other "optional future" items.

Everything marked "sample" in the UI comes from `supabase/seed.sql` and is flagged `is_sample = true`.

---

## What you need

| Tool | Needed? | Why |
|---|---|---|
| **Node.js 20 or newer** (includes npm) | ✅ **Yes — install it** | runs the Next.js app. Get it from nodejs.org (LTS). Check with `node -v`. |
| **A free Supabase account** (supabase.com) | ✅ **Yes** | provides login (Auth), the database and file storage in the cloud |
| **VS Code** | ✅ recommended editor | open the project folder |
| IntelliJ IDEA | optional | works too (Ultimate has JS/TS support; Community does not) |
| **PostgreSQL** (you have it) | optional | only to run the database security tests locally (`npm run test:sql`). The app itself talks to Supabase's Postgres, not your local one. |
| MongoDB, RabbitMQ, Android Studio | ❌ not used | this project doesn't use them |

> Why not just your local Postgres? The app relies on Supabase Auth (logins, `auth.uid()` in the security rules) and Supabase Storage (private CV files). Plain Postgres has neither. (Advanced: you can run the full Supabase stack locally with the Supabase CLI + Docker, but the free cloud project is far simpler.)

---

## Run it — step by step

### 1. Unzip and open
Unzip `internlink.zip`, then in **VS Code**: *File → Open Folder…* → choose the `internlink` folder. Open the built-in terminal (*Terminal → New Terminal*).

### 2. Install dependencies
```bash
npm install
```

### 3. Create the Supabase project
1. Go to **supabase.com → New project** (free plan is fine). Choose a region near you and set a database password (save it).
2. Wait ~2 minutes until the project is ready.

### 4. Create the database
In Supabase open **SQL Editor → New query**. Paste the contents of each file below, **in this order**, and click **Run** each time (each should say *Success*):

1. `supabase/migrations/0001_schema.sql`
2. `supabase/migrations/0002_functions_triggers.sql`
3. `supabase/migrations/0003_rls.sql`
4. `supabase/migrations/0004_storage.sql`
5. `supabase/migrations/0005_stats.sql`
6. *(optional, recommended for a demo)* `supabase/seed.sql` — 5 sample companies and 14 sample internships, all flagged as sample data.

### 5. Configure login
Supabase → **Authentication**:
- **Sign In / Providers → Email**: for local development you may turn **off "Confirm email"** so you can log in immediately after registering. For production keep it **on** (email verification).
- **URL Configuration**: set **Site URL** to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to **Redirect URLs** (add your Vercel URL too when you deploy).

### 6. Add your keys
Supabase → **Project Settings → API**. Copy the three values into a new file named **`.env.local`** (copy `.env.example` and fill it in):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...anon public key...
SUPABASE_SERVICE_ROLE_KEY=...service_role key...   # secret! never share or commit
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CRON_SECRET=any-long-random-text
```
`.env.local` is git-ignored. The service-role key is used **only** by the daily deadline-reminder route.

### 7. Start the app
```bash
npm run dev
```
Open **http://localhost:3000**.

### 8. Create an administrator
Admins can't be created from the public sign-up (by design).
1. Register normally at `/register` (any role) with the email you want as admin.
2. In Supabase **SQL Editor** run:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
3. Log out and in again → you land on `/admin`.

### 9. Try the full journey
1. Register a **company** → complete the company profile (description + location are required to publish) → *Post internship* → **Publish**.
2. In another browser/incognito window register a **student** → complete profile (add skills!) → *Find internships* → open the listing → **Save** → **Apply now** (upload a PDF CV + cover letter).
3. As the company: **Applicants** → open the application → change status to *Shortlisted* and add a private note → download the CV.
4. As the student: **Applications** → see the new status and history; check **Notifications**.
5. As admin: report a listing from the student account, then **Admin → Reports → Approve/Reject**; suspend/reactivate a user.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | development server on :3000 |
| `npm run build` / `npm start` | production build / run it |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | unit tests (Vitest) |
| `npm run test:sql` | **database security tests on your local PostgreSQL** (needs `psql`; set `PGUSER`/`PGPASSWORD`/`PGHOST` if your Postgres needs a login, e.g. `PGUSER=postgres PGPASSWORD=yourpass npm run test:sql`). Creates and deletes a throw-away database `internlink_test` (it also creates two harmless roles, `anon` and `authenticated`, in your local Postgres). `psql` must be on your PATH — on Windows add `C:\\Program Files\\PostgreSQL\\<version>\\bin` to PATH. |
| `npx playwright install chromium` then `npm run test:e2e` | browser smoke tests (app must be configured with Supabase) |

---

## Deploy to Vercel
1. Push the project to GitHub. In **vercel.com → Add New Project**, import the repo (framework: Next.js is auto-detected).
2. Add the environment variables from the table below (use your real production URL for `NEXT_PUBLIC_SITE_URL`).
3. Deploy. Then add the Vercel URL and `https://YOUR-APP.vercel.app/auth/callback` to Supabase **Auth → URL Configuration**.
4. `vercel.json` registers a daily cron (`/api/cron/deadlines`, 06:00 UTC) that creates "deadline approaching" notifications for saved internships. Vercel sends `Authorization: Bearer $CRON_SECRET` automatically — set `CRON_SECRET` in Vercel.

## Environment variables
| Variable | Public? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | anon key (safe in the browser; protected by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **no — server only** | bypasses RLS; used only in `src/app/api/cron/deadlines` |
| `NEXT_PUBLIC_SITE_URL` | yes | absolute URLs / metadata |
| `CRON_SECRET` | **no** | authorises the cron route |
| `RESEND_API_KEY`, `EMAIL_FROM` | no | *placeholders only* — email sending is **not implemented**; in-app notifications work without them |

---

## How security works
- **Roles** are stored in `profiles.role`. Public sign-up can only produce `student` or `company`; the signup trigger ignores anything else, and a trigger blocks users from changing their own role/status.
- **Row Level Security** is on for every table and storage bucket (`0003_rls.sql`, `0004_storage.sql`). Students see only their own applications; companies only applications to *their* internships; private company notes are never readable by students; phone numbers live in a separate table readable only by the student, a company that received their application, and admins.
- **Workflow rules in the database** (trigger): students can only *withdraw*; companies can only change *status*; no applying to drafts/closed/expired listings; duplicate applications blocked; suspended accounts can't write.
- **Resumes** are in a *private* bucket (PDF/DOC/DOCX ≤ 5 MB). Downloads go through `/api/applications/[id]/cv`, which checks access with the user's own session and issues a 60-second signed link.
- **Admin pages** are protected in `middleware.ts`, in the admin layout, in every admin server action, and again by RLS.
- Server code uses `supabase.auth.getUser()` (token verified) — never trusts client-supplied roles.

## Matching
Recommendations are **rule-based, not AI**: up to 100 points from skill overlap (60), field of study (15), location (10), work arrangement (10), category (5). A score is shown only when it can be computed from real data, with the reasons listed (`src/lib/matching.ts`).

## Project layout
```
supabase/migrations/   0001 schema · 0002 functions+triggers · 0003 RLS · 0004 storage · 0005 stats
supabase/seed.sql      sample companies + internships (flagged is_sample)
src/app/               pages: landing, internships, auth, dashboard (student), company, admin, API routes
src/actions/           server actions (validate with Zod, then write through RLS)
src/components/        ui primitives, layout, forms, admin/company/student widgets
src/lib/               supabase clients, auth guards, validators, matching, formatting, queries
tests/                 unit tests (Vitest) + tests/sql (database security tests)
e2e/                   Playwright smoke tests
```

## Troubleshooting
- **"Invalid API key" / blank data** — re-check `.env.local`, then restart `npm run dev`.
- **Register works but can't log in** — "Confirm email" is on; click the link in the email, or turn it off for local dev.
- **Seed fails on `auth.users`** — skip `seed.sql` and create listings through the company dashboard instead.
- **Build/lint/type errors on first run** — expected (the code was never compiled). Copy the first error message and fix or send it back; they are usually one-line typing issues.
- **`npm run test:sql` can't connect** — set `PGUSER`, `PGPASSWORD`, `PGHOST`, `PGPORT` for your local Postgres.
