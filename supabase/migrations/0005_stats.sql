-- Public, aggregate-only platform statistics for the landing page (no personal data exposed).
create or replace function public.platform_stats()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'internships', (select count(*) from internships where status = 'published'),
    'sample_internships', (select count(*) from internships where status = 'published' and is_sample),
    'companies', (select count(*) from company_profiles),
    'students', (select count(*) from profiles where role = 'student'),
    'applications', (select count(*) from applications)
  );
$$;
grant execute on function public.platform_stats() to anon, authenticated;
