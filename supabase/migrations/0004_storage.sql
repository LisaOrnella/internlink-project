-- Storage buckets and policies. Object path convention: <user_id>/<filename>
-- resumes: PRIVATE, PDF/DOC/DOCX only, 5 MB
-- avatars + company-assets: public read, images only, 2-5 MB

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('resumes', 'resumes', false, 5242880,
    array['application/pdf', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('company-assets', 'company-assets', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- resumes: owner full control; hiring company can read a CV attached to an application for its own internship; admins read
create policy resumes_owner_all on storage.objects for all to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy resumes_company_read on storage.objects for select to authenticated using (
  bucket_id = 'resumes' and exists (
    select 1 from public.applications a
    where a.cv_path = storage.objects.name and public.owns_internship(a.internship_id)
  )
);

create policy resumes_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'resumes' and public.is_admin());

-- public image buckets: anyone reads, owner writes inside own folder
create policy public_images_read on storage.objects for select
  using (bucket_id in ('avatars', 'company-assets'));

create policy public_images_write on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars', 'company-assets') and (storage.foldername(name))[1] = auth.uid()::text);

create policy public_images_update on storage.objects for update to authenticated
  using (bucket_id in ('avatars', 'company-assets') and (storage.foldername(name))[1] = auth.uid()::text);

create policy public_images_delete on storage.objects for delete to authenticated
  using (bucket_id in ('avatars', 'company-assets') and (storage.foldername(name))[1] = auth.uid()::text);
