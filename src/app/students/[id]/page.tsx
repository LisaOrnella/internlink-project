import { notFound } from 'next/navigation';
import { Github, Globe, GraduationCap, Linkedin, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { Avatar } from '@/components/shared/avatar';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Student profile' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Visible to signed-in users only when the student made the profile public, to the student, to companies that received an application from them, and to admins. RLS decides — we just query. */
export default async function PublicStudentProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const current = await getCurrentUser();
  const supabase = await createClient();
  const [{ data: p }, { data: sp }, { data: sk }, edu, work, proj, cert] = await Promise.all([
    supabase.from('profiles').select('id,full_name,avatar_url,role').eq('id', id).maybeSingle(),
    supabase.from('student_profiles').select('*').eq('user_id', id).maybeSingle(),
    supabase.from('student_skills').select('skills(name)').eq('user_id', id),
    supabase.from('education').select('*').eq('user_id', id),
    supabase.from('work_experience').select('*').eq('user_id', id),
    supabase.from('student_projects').select('*').eq('user_id', id),
    supabase.from('certifications').select('*').eq('user_id', id),
  ]);
  if (!p || !sp || p.role !== 'student') notFound();
  const skills = ((sk ?? []) as unknown as { skills: { name: string } | null }[]).map((s) => s.skills?.name).filter(Boolean) as string[];
  const isSelf = current?.user.id === id;

  return (
    <main id="main" className="bg-slate-50 pb-16">
      <div className="gradient-navy h-32" />
      <div className="container-page -mt-14 max-w-4xl space-y-6">
        {isSelf && <p className="rounded-xl bg-sun-100 px-4 py-2 text-sm text-sun-600">This is how companies see your profile. Your phone number and CV are never shown here.</p>}
        <Card className="flex flex-col items-start gap-5 p-6 sm:flex-row">
          <Avatar name={p.full_name} src={p.avatar_url} size={96} className="ring-4 ring-white" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold text-navy-900">{p.full_name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
              {sp.degree_program && <span className="flex items-center gap-1"><GraduationCap size={15} />{sp.degree_program}{sp.university ? ` · ${sp.university}` : ''}</span>}
              {sp.location && <span className="flex items-center gap-1"><MapPin size={15} />{sp.location}</span>}
            </p>
            <div className="mt-3 flex gap-3">
              {sp.linkedin_url && <a href={sp.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-navy-700" aria-label="LinkedIn"><Linkedin size={20} /></a>}
              {sp.portfolio_url && <a href={sp.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-navy-700" aria-label="Portfolio">{sp.portfolio_url.includes('github') ? <Github size={20} /> : <Globe size={20} />}</a>}
            </div>
          </div>
        </Card>
        {sp.bio && <Card><CardHeader title="About" /><p className="whitespace-pre-line p-5 text-slate-700">{sp.bio}</p></Card>}
        {(skills.length > 0 || sp.soft_skills?.length > 0 || sp.languages?.length > 0) && (
          <Card><CardHeader title="Skills" /><div className="space-y-3 p-5">
            {skills.length > 0 && <div className="flex flex-wrap gap-2">{skills.map((s) => <Badge key={s} tone="teal">{s}</Badge>)}</div>}
            {sp.soft_skills?.length > 0 && <div className="flex flex-wrap gap-2">{sp.soft_skills.map((s: string) => <Badge key={s} tone="navy">{s}</Badge>)}</div>}
            {sp.languages?.length > 0 && <p className="text-sm text-slate-600"><span className="font-medium">Languages:</span> {sp.languages.join(', ')}</p>}
          </div></Card>
        )}
        {[
          ['Education', edu.data, (e: Record<string, string>) => [e.qualification, `${e.institution}${e.start_year || e.end_year ? ` · ${e.start_year ?? ''}–${e.end_year ?? ''}` : ''}`]],
          ['Experience', work.data, (e: Record<string, string>) => [e.title, `${e.company} · ${formatDate(e.start_date)} – ${e.end_date ? formatDate(e.end_date) : 'present'}`, e.description]],
          ['Projects', proj.data, (e: Record<string, string>) => [e.title, e.url, e.description]],
          ['Certifications', cert.data, (e: Record<string, string>) => [e.name, `${e.issuer ?? ''}${e.issued_on ? ` · ${formatDate(e.issued_on)}` : ''}`]],
        ].map(([title, rows, fmt]) => {
          const list = (rows as Record<string, string>[] | null) ?? [];
          if (!list.length) return null;
          return (
            <Card key={title as string}><CardHeader title={title as string} />
              <ul className="divide-y divide-slate-100">{list.map((r) => { const [a, b, c] = (fmt as (e: Record<string, string>) => string[])(r);
                return <li key={r.id} className="px-5 py-3"><p className="font-medium text-navy-900">{a}</p>{b && <p className="text-sm text-slate-500">{b}</p>}{c && <p className="mt-1 text-sm text-slate-700">{c}</p>}</li>; })}</ul></Card>
          );
        })}
      </div>
    </main>
  );
}
