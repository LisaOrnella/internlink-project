-- InternLink core schema
-- Run order: 0001_schema -> 0002_functions_triggers -> 0003_rls -> 0004_storage

create extension if not exists "pgcrypto";

-- ---------- enums ----------
create type user_role as enum ('student', 'company', 'admin');
create type account_status as enum ('active', 'suspended');
create type work_arrangement as enum ('remote', 'hybrid', 'onsite');
create type internship_type as enum ('full_time', 'part_time', 'summer', 'co_op', 'project_based');
create type internship_status as enum ('draft', 'published', 'closed', 'archived', 'removed');
create type application_status as enum
  ('submitted', 'under_review', 'shortlisted', 'interview', 'accepted', 'rejected', 'withdrawn');
create type report_status as enum ('open', 'dismissed', 'actioned');

-- ---------- profiles (1:1 with auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'student',
  status account_status not null default 'active',
  full_name text not null default '',
  email text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);

-- ---------- students ----------
create table public.student_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  university text,
  degree_program text,
  field_of_study text,
  year_of_study smallint check (year_of_study between 1 and 10),
  graduation_date date,
  location text,
  bio text check (char_length(bio) <= 1500),
  soft_skills text[] not null default '{}',
  languages text[] not null default '{}',
  preferred_location text,
  preferred_arrangement work_arrangement,
  linkedin_url text,
  portfolio_url text,
  resume_path text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Private contact details: readable only by the student, companies that received an application from them, and admins.
create table public.student_contacts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  phone text,
  updated_at timestamptz not null default now()
);

create table public.education (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  institution text not null,
  qualification text not null,
  start_year smallint,
  end_year smallint,
  created_at timestamptz not null default now()
);
create index education_user_idx on public.education (user_id);

create table public.work_experience (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  company text not null,
  title text not null,
  start_date date,
  end_date date,
  description text,
  created_at timestamptz not null default now()
);
create index work_experience_user_idx on public.work_experience (user_id);

create table public.student_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  url text,
  created_at timestamptz not null default now()
);
create index student_projects_user_idx on public.student_projects (user_id);

create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  issuer text,
  issued_on date,
  url text,
  created_at timestamptz not null default now()
);
create index certifications_user_idx on public.certifications (user_id);

-- ---------- skills ----------
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.student_skills (
  user_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  primary key (user_id, skill_id)
);
create index student_skills_skill_idx on public.student_skills (skill_id);

-- ---------- companies ----------
create table public.company_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  name text not null,
  logo_url text,
  cover_url text,
  industry text,
  description text check (char_length(description) <= 4000),
  website text,
  contact_email text,
  phone text,
  location text,
  size text,
  social_links jsonb not null default '{}'::jsonb,
  mission text,
  culture text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- internships ----------
create table public.internships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 150),
  category text not null,
  description text not null,
  responsibilities text,
  requirements text,
  benefits text,
  location text not null,
  arrangement work_arrangement not null default 'onsite',
  type internship_type not null default 'full_time',
  is_paid boolean not null default false,
  stipend_min integer check (stipend_min >= 0),
  stipend_max integer check (stipend_max >= 0),
  currency text not null default 'RWF',
  duration_months smallint check (duration_months between 1 and 24),
  start_date date,
  deadline date,
  positions smallint not null default 1 check (positions >= 1),
  education_level text,
  application_instructions text,
  status internship_status not null default 'draft',
  is_sample boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fts tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, '') || ' ' || coalesce(location, ''))
  ) stored,
  check (stipend_max is null or stipend_min is null or stipend_max >= stipend_min)
);
create index internships_company_idx on public.internships (company_id);
create index internships_status_idx on public.internships (status, published_at desc);
create index internships_category_idx on public.internships (category);
create index internships_deadline_idx on public.internships (deadline);
create index internships_fts_idx on public.internships using gin (fts);

create table public.internship_skills (
  internship_id uuid not null references public.internships (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  primary key (internship_id, skill_id)
);
create index internship_skills_skill_idx on public.internship_skills (skill_id);

-- ---------- applications ----------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  internship_id uuid not null references public.internships (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  cv_path text,
  cover_letter text not null check (char_length(cover_letter) between 20 and 5000),
  status application_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (internship_id, student_id)
);
create index applications_student_idx on public.applications (student_id);
create index applications_internship_idx on public.applications (internship_id);

-- status history visible to both sides
create table public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  status application_status not null,
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index application_events_app_idx on public.application_events (application_id, created_at);

-- private company-only notes (never visible to students)
create table public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index application_notes_app_idx on public.application_notes (application_id);

-- ---------- saved, notifications, reports, audit ----------
create table public.saved_internships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  internship_id uuid not null references public.internships (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, internship_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  internship_id uuid not null references public.internships (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (char_length(reason) between 10 and 2000),
  status report_status not null default 'open',
  resolved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (internship_id, reporter_id)
);
create index reports_status_idx on public.reports (status);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
