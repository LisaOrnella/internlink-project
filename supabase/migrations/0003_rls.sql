-- Row Level Security. Every table is locked down by default; policies open exactly what is needed.

alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.student_contacts enable row level security;
alter table public.education enable row level security;
alter table public.work_experience enable row level security;
alter table public.student_projects enable row level security;
alter table public.certifications enable row level security;
alter table public.skills enable row level security;
alter table public.student_skills enable row level security;
alter table public.company_profiles enable row level security;
alter table public.internships enable row level security;
alter table public.internship_skills enable row level security;
alter table public.applications enable row level security;
alter table public.application_events enable row level security;
alter table public.application_notes enable row level security;
alter table public.saved_internships enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;

-- ---------- profiles ----------
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid()
  or public.is_admin()
  or public.company_has_applicant(id)
  or (role = 'student' and exists (select 1 from public.student_profiles sp where sp.user_id = profiles.id and sp.is_public))
);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid() and public.is_active()) with check (id = auth.uid());
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- no insert/delete policies: rows are created by the signup trigger and removed via auth.users cascade

-- ---------- student_profiles ----------
create policy student_select on public.student_profiles for select to authenticated using (
  user_id = auth.uid() or public.is_admin() or is_public or public.company_has_applicant(user_id)
);
create policy student_update_own on public.student_profiles for update to authenticated
  using (user_id = auth.uid() and public.is_active()) with check (user_id = auth.uid());

-- ---------- student_contacts (phone): NOT public, even when the profile is public ----------
create policy contacts_select on public.student_contacts for select to authenticated using (
  user_id = auth.uid() or public.is_admin() or public.company_has_applicant(user_id)
);
create policy contacts_update_own on public.student_contacts for update to authenticated
  using (user_id = auth.uid() and public.is_active()) with check (user_id = auth.uid());

-- ---------- student sub-resources (own rows; companies with an applicant can read; public profiles readable) ----------
do $$
declare t text;
begin
  foreach t in array array['education', 'work_experience', 'student_projects', 'certifications'] loop
    execute format($f$
      create policy %1$s_select on public.%1$I for select to authenticated using (
        user_id = auth.uid() or public.is_admin() or public.company_has_applicant(user_id)
        or exists (select 1 from public.student_profiles sp where sp.user_id = %1$I.user_id and sp.is_public)
      )$f$, t);
    execute format($f$
      create policy %1$s_write on public.%1$I for all to authenticated
        using (user_id = auth.uid() and public.is_active())
        with check (user_id = auth.uid() and public.is_active())$f$, t);
  end loop;
end $$;

-- ---------- skills ----------
create policy skills_read on public.skills for select using (true);
create policy skills_insert on public.skills for insert to authenticated with check (public.is_active());

create policy student_skills_select on public.student_skills for select to authenticated using (
  user_id = auth.uid() or public.is_admin() or public.company_has_applicant(user_id)
  or exists (select 1 from public.student_profiles sp where sp.user_id = student_skills.user_id and sp.is_public)
);
create policy student_skills_write on public.student_skills for all to authenticated
  using (user_id = auth.uid() and public.is_active()) with check (user_id = auth.uid() and public.is_active());

-- ---------- company_profiles: public read, owner write ----------
create policy company_read on public.company_profiles for select using (true);
create policy company_update_own on public.company_profiles for update to authenticated
  using ((owner_id = auth.uid() and public.is_active()) or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

-- ---------- internships ----------
create policy internships_public_read on public.internships for select using (status = 'published');
create policy internships_owner_read on public.internships for select to authenticated
  using (public.owns_internship(id) or public.is_admin());
create policy internships_owner_insert on public.internships for insert to authenticated
  with check (company_id = public.my_company_id() and public.is_active());
create policy internships_owner_update on public.internships for update to authenticated
  using ((public.owns_internship(id) and public.is_active()) or public.is_admin())
  with check (company_id = public.my_company_id() or public.is_admin());
create policy internships_owner_delete on public.internships for delete to authenticated
  using ((public.owns_internship(id) and public.is_active()) or public.is_admin());

create policy internship_skills_read on public.internship_skills for select using (true);
create policy internship_skills_write on public.internship_skills for all to authenticated
  using (public.owns_internship(internship_id) or public.is_admin())
  with check (public.owns_internship(internship_id) or public.is_admin());

-- ---------- applications ----------
create policy applications_student_select on public.applications for select to authenticated using (student_id = auth.uid());
create policy applications_company_select on public.applications for select to authenticated using (public.owns_internship(internship_id));
create policy applications_admin_select on public.applications for select to authenticated using (public.is_admin());
create policy applications_student_insert on public.applications for insert to authenticated
  with check (student_id = auth.uid() and public.is_active());
-- Column-level rules (students: withdraw only; companies: status only) are enforced by trigger.
create policy applications_student_update on public.applications for update to authenticated
  using (student_id = auth.uid() and public.is_active()) with check (student_id = auth.uid());
create policy applications_company_update on public.applications for update to authenticated
  using (public.owns_internship(internship_id) and public.is_active()) with check (public.owns_internship(internship_id));

-- history: both sides can read; written only by trigger
create policy events_select on public.application_events for select to authenticated using (
  exists (select 1 from public.applications a where a.id = application_id
          and (a.student_id = auth.uid() or public.owns_internship(a.internship_id)))
  or public.is_admin()
);

-- private notes: company-only, never students
create policy notes_company_select on public.application_notes for select to authenticated using (
  exists (select 1 from public.applications a where a.id = application_id and public.owns_internship(a.internship_id))
);
create policy notes_company_insert on public.application_notes for insert to authenticated with check (
  author_id = auth.uid() and public.is_active()
  and exists (select 1 from public.applications a where a.id = application_id and public.owns_internship(a.internship_id))
);
create policy notes_company_delete on public.application_notes for delete to authenticated using (author_id = auth.uid());

-- ---------- saved ----------
create policy saved_own on public.saved_internships for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_active());

-- ---------- notifications ----------
create policy notifications_select on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_delete on public.notifications for delete to authenticated using (user_id = auth.uid());
-- inserts happen only through SECURITY DEFINER triggers

-- ---------- reports ----------
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and public.is_active());
create policy reports_select on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());
create policy reports_admin_update on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- audit logs: admin read only; written through log_audit() ----------
create policy audit_admin_select on public.audit_logs for select to authenticated using (public.is_admin());

-- ---------- grants ----------
revoke all on all tables in schema public from anon;
grant select on public.skills, public.company_profiles, public.internships, public.internship_skills to anon;
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke insert, delete on public.profiles from authenticated;
revoke insert, delete on public.student_profiles from authenticated;
revoke insert, delete on public.student_contacts from authenticated;
revoke insert, delete on public.company_profiles from authenticated;
revoke insert, update, delete on public.application_events from authenticated;
revoke insert on public.notifications from authenticated;
revoke update, delete on public.audit_logs from authenticated;
revoke insert, update, delete on public.audit_logs from authenticated;
revoke delete on public.applications from authenticated;
grant execute on function public.log_audit(text, text, text, jsonb) to authenticated;
