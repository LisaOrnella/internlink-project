-- Helper functions and triggers

-- ---------- role helpers (SECURITY DEFINER so RLS policies can call them without recursion) ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active');
$$;

create or replace function public.is_active()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'active');
$$;

create or replace function public.my_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.company_profiles where owner_id = auth.uid();
$$;

-- True when the current user owns the company that owns this internship
create or replace function public.owns_internship(p_internship uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.internships i
    join public.company_profiles c on c.id = i.company_id
    where i.id = p_internship and c.owner_id = auth.uid()
  );
$$;

-- True when the current user (company) received an application from this student
create or replace function public.company_has_applicant(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.applications a
    join public.internships i on i.id = a.internship_id
    join public.company_profiles c on c.id = i.company_id
    where a.student_id = p_student and c.owner_id = auth.uid()
  );
$$;

-- ---------- updated_at ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger trg_student_touch before update on public.student_profiles for each row execute function public.touch_updated_at();
create trigger trg_company_touch before update on public.company_profiles for each row execute function public.touch_updated_at();
create trigger trg_internships_touch before update on public.internships for each row execute function public.touch_updated_at();
create trigger trg_applications_touch before update on public.applications for each row execute function public.touch_updated_at();

-- ---------- signup: create profile from auth.users ----------
-- The role comes from user metadata, but ONLY 'student' or 'company' is honoured.
-- Anything else (including 'admin') becomes 'student'. Admins are promoted manually in SQL.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role user_role;
  v_name text;
begin
  v_role := case new.raw_user_meta_data ->> 'role'
    when 'company' then 'company'::user_role
    else 'student'::user_role
  end;
  v_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1));

  insert into public.profiles (id, role, full_name, email)
  values (new.id, v_role, v_name, coalesce(new.email, ''));

  if v_role = 'student' then
    insert into public.student_profiles (user_id) values (new.id);
    insert into public.student_contacts (user_id) values (new.id);
  else
    insert into public.company_profiles (owner_id, name, contact_email)
    values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'company_name'), ''), v_name), new.email);
  end if;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- block role / status escalation by regular users ----------
create or replace function public.protect_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() is null for service-role / SQL-editor sessions, which are trusted
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role or new.status is distinct from old.status then
      raise exception 'You are not allowed to change role or status';
    end if;
  end if;
  return new;
end; $$;

create trigger trg_profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Companies cannot flag themselves as verified
create or replace function public.protect_company_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.is_verified is distinct from old.is_verified or new.owner_id is distinct from old.owner_id then
      raise exception 'You are not allowed to change verification or ownership';
    end if;
  end if;
  return new;
end; $$;

create trigger trg_company_protect before update on public.company_profiles
  for each row execute function public.protect_company_columns();

-- ---------- internships: publish rules ----------
create or replace function public.internship_before_write()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- non-admins cannot set 'removed' or mark sample data
  if auth.uid() is not null and not public.is_admin() then
    if new.status = 'removed' and (tg_op = 'INSERT' or old.status <> 'removed') then
      raise exception 'Only administrators can remove listings';
    end if;
    if tg_op = 'UPDATE' and old.status = 'removed' then
      raise exception 'This listing was removed by moderators';
    end if;
    if new.is_sample then raise exception 'Sample flag is admin only'; end if;
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end; $$;

create trigger trg_internship_write before insert or update on public.internships
  for each row execute function public.internship_before_write();

-- ---------- applications: workflow enforcement ----------
-- Students may only withdraw their own application. Companies may only change status.
-- Applying is allowed only for published, non-expired listings and by active students.
create or replace function public.application_before_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_status internship_status;
  v_deadline date;
  v_role user_role;
begin
  if tg_op = 'INSERT' then
    select status, deadline into v_status, v_deadline from public.internships where id = new.internship_id;
    select role into v_role from public.profiles where id = new.student_id;
    if v_role is distinct from 'student' then raise exception 'Only students can apply'; end if;
    if v_status is distinct from 'published' then raise exception 'This internship is not open for applications'; end if;
    if v_deadline is not null and v_deadline < current_date then raise exception 'The application deadline has passed'; end if;
    new.status := 'submitted';
    return new;
  end if;

  -- UPDATE
  if auth.uid() is not null and not public.is_admin() then
    if new.internship_id is distinct from old.internship_id
       or new.student_id is distinct from old.student_id then
      raise exception 'Application ownership cannot change';
    end if;
    if auth.uid() = old.student_id then
      if new.status is distinct from old.status then
        if new.status <> 'withdrawn' or old.status in ('accepted', 'rejected', 'withdrawn') then
          raise exception 'Students may only withdraw an application that is still in progress';
        end if;
      end if;
      -- students can edit nothing else once submitted
      if new.cover_letter is distinct from old.cover_letter or new.cv_path is distinct from old.cv_path then
        raise exception 'Submitted applications cannot be edited';
      end if;
    elsif public.owns_internship(old.internship_id) then
      if new.status = 'withdrawn' or old.status = 'withdrawn' then
        raise exception 'Withdrawn applications cannot be changed by the company';
      end if;
      if new.cover_letter is distinct from old.cover_letter or new.cv_path is distinct from old.cv_path then
        raise exception 'Companies cannot edit applications';
      end if;
    end if;
  end if;
  return new;
end; $$;

create trigger trg_application_write before insert or update on public.applications
  for each row execute function public.application_before_write();

-- history + notifications
create or replace function public.application_after_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_title text;
  v_owner uuid;
  v_student_name text;
  v_label text;
begin
  select i.title, c.owner_id into v_title, v_owner
  from public.internships i join public.company_profiles c on c.id = i.company_id
  where i.id = new.internship_id;

  if tg_op = 'INSERT' then
    insert into public.application_events (application_id, status, actor_id) values (new.id, new.status, new.student_id);
    select full_name into v_student_name from public.profiles where id = new.student_id;
    insert into public.notifications (user_id, type, title, body, link)
    values (v_owner, 'application_received', 'New application received',
            coalesce(v_student_name, 'A student') || ' applied for ' || v_title,
            '/company/applications/' || new.id);
    insert into public.notifications (user_id, type, title, body, link)
    values (new.student_id, 'application_submitted', 'Application submitted',
            'Your application for ' || v_title || ' was sent.', '/dashboard/applications');
  elsif new.status is distinct from old.status then
    insert into public.application_events (application_id, status, actor_id) values (new.id, new.status, auth.uid());
    v_label := initcap(replace(new.status::text, '_', ' '));
    if auth.uid() is not distinct from new.student_id then
      insert into public.notifications (user_id, type, title, body, link)
      values (v_owner, 'application_withdrawn', 'Application withdrawn',
              'A candidate withdrew their application for ' || v_title, '/company/applications/' || new.id);
    else
      insert into public.notifications (user_id, type, title, body, link)
      values (new.student_id, 'application_status', 'Application update: ' || v_label,
              'Your application for ' || v_title || ' is now "' || v_label || '".', '/dashboard/applications');
    end if;
  end if;
  return null;
end; $$;

create trigger trg_application_after after insert or update on public.applications
  for each row execute function public.application_after_write();

-- ---------- notify students when a listing they might match is published? (kept simple: category-less) ----------
-- Deadline reminders are produced by public.create_deadline_reminders(), meant to be run daily
-- (Supabase cron / Vercel cron route). It is idempotent per application per day.
create or replace function public.create_deadline_reminders()
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  with due as (
    select s.user_id, i.id as internship_id, i.title, i.deadline
    from public.saved_internships s
    join public.internships i on i.id = s.internship_id
    where i.status = 'published'
      and i.deadline between current_date and current_date + 3
      and not exists (select 1 from public.applications a where a.internship_id = i.id and a.student_id = s.user_id)
      and not exists (
        select 1 from public.notifications n
        where n.user_id = s.user_id and n.type = 'deadline' and n.link = '/internships/' || i.id
          and n.created_at::date = current_date)
  ), ins as (
    insert into public.notifications (user_id, type, title, body, link)
    select user_id, 'deadline', 'Deadline approaching',
           title || ' closes on ' || to_char(deadline, 'DD Mon YYYY'), '/internships/' || internship_id
    from due returning 1
  )
  select count(*) into v_count from ins;
  return v_count;
end; $$;
revoke all on function public.create_deadline_reminders() from public, anon, authenticated;

-- ---------- reports: admin actions are audited ----------
create or replace function public.log_audit(p_action text, p_entity text, p_entity_id text, p_details jsonb default '{}')
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_details);
end; $$;
