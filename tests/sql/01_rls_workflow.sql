-- Behavioural security tests for migrations. Run after the stub (plain Postgres) or against a scratch Supabase DB.
-- Every check raises an exception on failure; success prints "ALL RLS TESTS PASSED".
\set ON_ERROR_STOP on
begin;

create temp table ids (k text primary key, v uuid);
grant all on ids to public;

-- helper: act as a user (or anon when null)
create function pg_temp.as_user(p uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p::text, ''), true);
  execute case when p is null then 'set local role anon' else 'set local role authenticated' end;
end $$;
create function pg_temp.as_root() returns void language plpgsql as $$
begin reset role; perform set_config('request.jwt.claim.sub', '', true); end $$;
create function pg_temp.id(k text) returns uuid language sql as $$ select v from ids where k = $1 $$;
create function pg_temp.assert(cond boolean, msg text) returns void language plpgsql as $$
begin if not coalesce(cond, false) then raise exception 'FAILED: %', msg; end if; end $$;
-- run sql expecting an error
create function pg_temp.must_fail(q text, msg text) returns void language plpgsql as $$
begin
  begin execute q; exception when others then return; end;
  raise exception 'FAILED (expected error): %', msg;
end $$;
-- run sql expecting zero rows affected/returned
create function pg_temp.rows(q text) returns bigint language plpgsql as $$
declare n bigint; begin execute 'select count(*) from (' || q || ') s' into n; return n; end $$;
grant execute on all functions in schema pg_temp to public;

-- ---------- signup trigger ----------
insert into auth.users (email, raw_user_meta_data) values
  ('a@x.rw', '{"role":"student","full_name":"Alice Student"}'),
  ('b@x.rw', '{"role":"student","full_name":"Bob Student"}'),
  ('cx@x.rw', '{"role":"company","full_name":"Xavier","company_name":"XCorp"}'),
  ('cy@x.rw', '{"role":"company","full_name":"Yara","company_name":"YCorp"}'),
  ('evil@x.rw', '{"role":"admin","full_name":"Mallory"}'),
  ('root@x.rw', '{"role":"student","full_name":"Root Admin"}');
insert into ids select 'a', id from auth.users where email='a@x.rw';
insert into ids select 'b', id from auth.users where email='b@x.rw';
insert into ids select 'cx', id from auth.users where email='cx@x.rw';
insert into ids select 'cy', id from auth.users where email='cy@x.rw';
insert into ids select 'evil', id from auth.users where email='evil@x.rw';
insert into ids select 'admin', id from auth.users where email='root@x.rw';
update public.profiles set role='admin' where id = (select v from ids where k='admin');  -- manual promotion (service role / SQL editor)

select pg_temp.assert((select role from public.profiles where id=pg_temp.id('evil')) = 'student', 'public signup cannot create admin');
select pg_temp.assert((select role from public.profiles where id=pg_temp.id('cx')) = 'company', 'company role honoured');
select pg_temp.assert(exists(select 1 from public.company_profiles where owner_id=pg_temp.id('cx') and name='XCorp'), 'company profile auto-created');
select pg_temp.assert(exists(select 1 from public.student_profiles where user_id=pg_temp.id('a')), 'student profile auto-created');

-- ---------- privilege escalation blocked ----------
select pg_temp.as_user(pg_temp.id('a'));
select pg_temp.must_fail($$update public.profiles set role='admin' where id=auth.uid()$$, 'student self-promotes to admin');
select pg_temp.must_fail($$update public.profiles set status='active', role='company' where id=auth.uid()$$, 'student switches role');
update public.profiles set full_name='Alice Updated' where id=auth.uid();
select pg_temp.assert((select full_name from public.profiles where id=auth.uid())='Alice Updated', 'student edits own name');
select pg_temp.assert(pg_temp.rows($$select 1 from public.profiles where id = pg_temp.id('cx')$$)=0, 'student cannot read company owner profile row');
select pg_temp.as_user(pg_temp.id('cx'));
select pg_temp.must_fail($$update public.company_profiles set is_verified=true where owner_id=auth.uid()$$, 'company self-verifies');

-- ---------- company creates internships ----------
select pg_temp.as_user(pg_temp.id('cx'));
insert into public.internships (company_id, title, category, description, location, status, deadline)
  values (public.my_company_id(), 'Draft Role', 'Software Development', 'draft desc', 'Kigali', 'draft', current_date + 10);
insert into public.internships (company_id, title, category, description, location, status, deadline)
  values (public.my_company_id(), 'Dev Intern', 'Software Development', 'real desc', 'Kigali', 'published', current_date + 10);
insert into public.internships (company_id, title, category, description, location, status, deadline)
  values (public.my_company_id(), 'Expired Role', 'Software Development', 'old desc', 'Kigali', 'published', current_date - 1);
select pg_temp.must_fail($$insert into public.internships (company_id,title,category,description,location,status) values (public.my_company_id(),'Sneaky','x','y','z','removed')$$, 'company sets removed status');
select pg_temp.must_fail($$insert into public.internships (company_id,title,category,description,location) values ('00000000-0000-0000-0000-000000000000','Forged','x','y','z')$$, 'company posts for another company');
select pg_temp.as_root();
insert into ids select 'draft', id from public.internships where title='Draft Role';
insert into ids select 'job', id from public.internships where title='Dev Intern';
insert into ids select 'old', id from public.internships where title='Expired Role';

-- visibility
select pg_temp.as_user(null);
select pg_temp.assert(pg_temp.rows($$select 1 from public.internships where title='Draft Role'$$)=0, 'anon cannot see drafts');
select pg_temp.assert(pg_temp.rows($$select 1 from public.internships where title='Dev Intern'$$)=1, 'anon sees published');
select pg_temp.must_fail($$select * from public.applications$$, 'anon reads applications');
select pg_temp.as_user(pg_temp.id('cy'));
select pg_temp.assert(pg_temp.rows($$select 1 from public.internships where title='Draft Role'$$)=0, 'other company cannot see draft');
update public.internships set title='Hijacked' where title='Dev Intern';  -- RLS hides the row: 0 rows updated, no error
select pg_temp.as_root();
select pg_temp.assert((select title from public.internships where id=pg_temp.id('job'))='Dev Intern', 'listing unchanged by other company');

-- ---------- applications ----------
select pg_temp.as_user(pg_temp.id('a'));
select pg_temp.must_fail(format($$insert into public.applications (internship_id,student_id,cover_letter) values (%L,auth.uid(),'Short cover letter here that is long enough')$$, pg_temp.id('draft')), 'apply to draft');
select pg_temp.must_fail(format($$insert into public.applications (internship_id,student_id,cover_letter) values (%L,auth.uid(),'Short cover letter here that is long enough')$$, pg_temp.id('old')), 'apply after deadline');
select pg_temp.must_fail(format($$insert into public.applications (internship_id,student_id,cover_letter) values (%L,%L,'Short cover letter here that is long enough')$$, pg_temp.id('job'), pg_temp.id('b')), 'apply as someone else');
insert into public.applications (internship_id, student_id, cover_letter, cv_path)
  values (pg_temp.id('job'), auth.uid(), 'I am very interested in this internship and have the skills.', pg_temp.id('a')::text || '/cv.pdf');
select pg_temp.must_fail(format($$insert into public.applications (internship_id,student_id,cover_letter) values (%L,auth.uid(),'Duplicate application attempt with long text')$$, pg_temp.id('job')), 'duplicate application');
select pg_temp.as_root();
insert into ids select 'app', id from public.applications limit 1;
select pg_temp.assert((select count(*) from public.application_events where application_id=pg_temp.id('app'))=1, 'history row on submit');
select pg_temp.assert(exists(select 1 from public.notifications where user_id=pg_temp.id('cx') and type='application_received'), 'company notified of application');

-- isolation
select pg_temp.as_root();
update public.student_contacts set phone='+250788000111' where user_id=pg_temp.id('a');
select pg_temp.as_user(pg_temp.id('b'));
select pg_temp.assert(pg_temp.rows($$select 1 from public.student_profiles where user_id=pg_temp.id('a')$$)=1, 'public student profile is readable');
select pg_temp.assert(pg_temp.rows($$select 1 from public.student_contacts where user_id=pg_temp.id('a')$$)=0, 'other student cannot read A phone');
select pg_temp.assert(pg_temp.rows($$select 1 from public.applications$$)=0, 'student B cannot see A application');
select pg_temp.assert(pg_temp.rows($$select 1 from public.notifications where user_id <> auth.uid()$$)=0, 'student B sees no foreign notifications');
select pg_temp.as_user(pg_temp.id('cy'));
select pg_temp.assert(pg_temp.rows($$select 1 from public.student_contacts where user_id=pg_temp.id('a')$$)=0, 'non-applicant company cannot read phone');
select pg_temp.assert(pg_temp.rows($$select 1 from public.applications$$)=0, 'company Y cannot see applications to X');
select pg_temp.assert(pg_temp.rows($$select 1 from public.student_profiles where user_id=pg_temp.id('a') and false$$)=0, 'sanity');
select pg_temp.as_user(pg_temp.id('cx'));
select pg_temp.assert(pg_temp.rows($$select 1 from public.applications$$)=1, 'company X sees its application');
select pg_temp.assert(pg_temp.rows($$select 1 from public.profiles where id=pg_temp.id('a')$$)=1, 'company X reads applicant profile');
select pg_temp.assert(pg_temp.rows($$select 1 from public.student_contacts where user_id=pg_temp.id('a')$$)=1, 'applicant-receiving company reads phone');

-- ---------- status workflow ----------
select pg_temp.as_user(pg_temp.id('a'));
select pg_temp.must_fail(format($$update public.applications set status='accepted' where id=%L$$, pg_temp.id('app')), 'student self-accepts');
select pg_temp.must_fail(format($$update public.applications set cover_letter='changed my mind but this is a long enough text' where id=%L$$, pg_temp.id('app')), 'student edits submitted letter');
select pg_temp.as_user(pg_temp.id('cx'));
update public.applications set status='shortlisted' where id=pg_temp.id('app');
select pg_temp.must_fail(format($$update public.applications set cover_letter='company rewrites candidate letter, long enough' where id=%L$$, pg_temp.id('app')), 'company edits letter');
insert into public.application_notes (application_id, author_id, body) values (pg_temp.id('app'), auth.uid(), 'Strong candidate, call Monday');
select pg_temp.as_user(pg_temp.id('cy'));
select pg_temp.must_fail(format($$insert into public.application_notes (application_id,author_id,body) values (%L,auth.uid(),'intruder note')$$, pg_temp.id('app')), 'foreign company adds note');
select pg_temp.as_user(pg_temp.id('a'));
select pg_temp.assert(pg_temp.rows($$select 1 from public.application_notes$$)=0, 'student cannot read private notes');
select pg_temp.assert((select status from public.applications where id=pg_temp.id('app'))='shortlisted', 'student sees updated status');
select pg_temp.assert(pg_temp.rows($$select 1 from public.notifications where type='application_status'$$)=1, 'student notified of status change');
select pg_temp.assert(pg_temp.rows($$select 1 from public.application_events where application_id=pg_temp.id('app')$$)=2, 'student sees history');
update public.applications set status='withdrawn' where id=pg_temp.id('app');
select pg_temp.as_user(pg_temp.id('cx'));
select pg_temp.must_fail(format($$update public.applications set status='accepted' where id=%L$$, pg_temp.id('app')), 'company changes withdrawn application');
select pg_temp.must_fail(format($$delete from public.applications where id=%L$$, pg_temp.id('app')), 'company deletes application');

-- ---------- suspension ----------
select pg_temp.as_user(pg_temp.id('admin'));
update public.profiles set status='suspended' where id=pg_temp.id('b');
select pg_temp.as_user(pg_temp.id('b'));
select pg_temp.must_fail(format($$insert into public.applications (internship_id,student_id,cover_letter) values (%L,auth.uid(),'Suspended user tries to apply here')$$, pg_temp.id('job')), 'suspended student applies');
select pg_temp.as_user(pg_temp.id('admin'));
update public.profiles set status='active' where id=pg_temp.id('b');
select pg_temp.assert((select status from public.profiles where id=pg_temp.id('b'))='active', 'admin reactivates account');

-- ---------- reports & moderation ----------
select pg_temp.as_user(pg_temp.id('b'));
insert into public.reports (internship_id, reporter_id, reason) values (pg_temp.id('job'), auth.uid(), 'This looks like a fraudulent listing asking for fees');
update public.reports set status='dismissed';  -- filtered by RLS to 0 rows
select pg_temp.assert((select status from public.reports limit 1)='open', 'student cannot resolve report');
select pg_temp.as_user(pg_temp.id('cx'));
select pg_temp.assert(pg_temp.rows($$select 1 from public.reports$$)=0, 'company cannot read reports');
select pg_temp.as_user(pg_temp.id('admin'));
select pg_temp.assert(pg_temp.rows($$select 1 from public.reports$$)=1, 'admin reads reports');
update public.internships set status='removed' where id=pg_temp.id('job');
select public.log_audit('remove_listing','internship', pg_temp.id('job')::text);
select pg_temp.as_user(pg_temp.id('cx'));
select pg_temp.must_fail(format($$update public.internships set status='published' where id=%L$$, pg_temp.id('job')), 'company republishes removed listing');
select pg_temp.must_fail($$select public.log_audit('x','y','z')$$, 'non-admin writes audit log');
select pg_temp.assert(pg_temp.rows($$select 1 from public.audit_logs$$)=0, 'company cannot read audit logs');

-- ---------- storage (resume privacy) ----------
select pg_temp.as_root();
insert into storage.objects (bucket_id, name) values ('resumes', pg_temp.id('a')::text || '/cv.pdf');
select pg_temp.as_user(pg_temp.id('b'));
select pg_temp.assert(pg_temp.rows($$select 1 from storage.objects where bucket_id='resumes'$$)=0, 'other student cannot read resume');
select pg_temp.as_user(pg_temp.id('cy'));
select pg_temp.assert(pg_temp.rows($$select 1 from storage.objects where bucket_id='resumes'$$)=0, 'unrelated company cannot read resume');
select pg_temp.as_user(pg_temp.id('cx'));
select pg_temp.assert(pg_temp.rows($$select 1 from storage.objects where bucket_id='resumes'$$)=1, 'hiring company reads applicant resume');
select pg_temp.as_user(pg_temp.id('a'));
select pg_temp.assert(pg_temp.rows($$select 1 from storage.objects where bucket_id='resumes'$$)=1, 'owner reads own resume');
select pg_temp.must_fail(format($$insert into storage.objects (bucket_id,name) values ('resumes','%s/x.pdf')$$, pg_temp.id('b')), 'upload into another user folder');

select pg_temp.as_root();
select 'ALL RLS TESTS PASSED' as result;
rollback;
