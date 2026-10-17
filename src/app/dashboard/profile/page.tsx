import Link from 'next/link';
import { Eye } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getStudentCompletion } from '@/lib/student-data';
import { PageHeader, Progress } from '@/components/ui/misc';
import { Card } from '@/components/ui/card';
import { LinkButton } from '@/components/ui/button';
import { StudentProfileForm } from '@/components/student/profile-form';
import { EntriesEditor } from '@/components/student/entries-editor';

export const metadata = { title: 'My profile' };

export default async function ProfilePage() {
  const { user, profile } = await requireRole('student');
  const supabase = await createClient();
  const [completion, { data: skills }, edu, work, proj, cert] = await Promise.all([
    getStudentCompletion(supabase, user.id),
    supabase.from('student_skills').select('skills(name)').eq('user_id', user.id),
    supabase.from('education').select('*').eq('user_id', user.id).order('end_year', { ascending: false }),
    supabase.from('work_experience').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
    supabase.from('student_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('certifications').select('*').eq('user_id', user.id).order('issued_on', { ascending: false }),
  ]);
  const skillList = ((skills ?? []) as unknown as { skills: { name: string } | null }[]).map((s) => s.skills?.name).filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <PageHeader title="My profile" description="A complete profile helps companies find you and improves your recommendations."
        action={<LinkButton href={`/students/${user.id}`} variant="outline"><Eye size={16} />Preview public profile</LinkButton>} />
      <Card className="p-5"><div className="mb-2 flex justify-between text-sm"><span className="font-medium text-navy-900">Profile completion</span><span className="font-bold text-teal-700">{completion.percent}%</span></div>
        <Progress value={completion.percent} label="Profile completion" />
        {completion.missing.length > 0 && <p className="mt-2 text-xs text-slate-500">Missing: {completion.missing.join(', ')}</p>}</Card>
      <StudentProfileForm fullName={profile.full_name} email={profile.email} avatarUrl={profile.avatar_url} skills={skillList} sp={completion.profile} phone={completion.phone} />
      <div className="grid gap-6 lg:grid-cols-2">
        <EntriesEditor table="education" title="Education" items={edu.data ?? []} labelKey="qualification" subKey="institution"
          fields={[{ name: 'institution', label: 'Institution' }, { name: 'qualification', label: 'Qualification' }, { name: 'start_year', label: 'Start year', type: 'number' }, { name: 'end_year', label: 'End year', type: 'number' }]} />
        <EntriesEditor table="work_experience" title="Work experience" items={work.data ?? []} labelKey="title" subKey="company"
          fields={[{ name: 'company', label: 'Company' }, { name: 'title', label: 'Role' }, { name: 'start_date', label: 'Start', type: 'date' }, { name: 'end_date', label: 'End', type: 'date' }, { name: 'description', label: 'What did you do?', area: true }]} />
        <EntriesEditor table="student_projects" title="Projects" items={proj.data ?? []} labelKey="title" subKey="url"
          fields={[{ name: 'title', label: 'Project title' }, { name: 'url', label: 'Link (optional)', type: 'url' }, { name: 'description', label: 'Description', area: true }]} />
        <EntriesEditor table="certifications" title="Certifications" items={cert.data ?? []} labelKey="name" subKey="issuer"
          fields={[{ name: 'name', label: 'Certification' }, { name: 'issuer', label: 'Issuer' }, { name: 'issued_on', label: 'Issued on', type: 'date' }, { name: 'url', label: 'Credential link', type: 'url' }]} />
      </div>
      <p className="text-center text-xs text-slate-500">Want to see what companies see? <Link href={`/students/${user.id}`} className="text-teal-700 underline">Open your public profile</Link>.</p>
    </div>
  );
}
