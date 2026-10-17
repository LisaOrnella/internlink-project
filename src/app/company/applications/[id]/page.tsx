import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Download, ExternalLink, Mail, Phone } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import { Card, CardHeader } from '@/components/ui/card';
import { StatusBadge, Badge } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/button';
import { Avatar } from '@/components/shared/avatar';
import { StatusControls, Notes } from '@/components/company/application-controls';

export const metadata = { title: 'Application' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole('company');
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  // RLS only returns this row if the internship belongs to this company
  const { data: a } = await supabase.from('applications').select('*, internships(id,title)').eq('id', id).maybeSingle();
  if (!a) notFound();
  const [{ data: p }, { data: sp }, { data: contact }, { data: notes }, { data: events }, { data: sk }] = await Promise.all([
    supabase.from('profiles').select('id,full_name,email,avatar_url').eq('id', a.student_id).single(),
    supabase.from('student_profiles').select('university,degree_program,field_of_study,year_of_study,location').eq('user_id', a.student_id).maybeSingle(),
    supabase.from('student_contacts').select('phone').eq('user_id', a.student_id).maybeSingle(),
    supabase.from('application_notes').select('id,body,created_at').eq('application_id', id).order('created_at', { ascending: false }),
    supabase.from('application_events').select('status,created_at').eq('application_id', id).order('created_at'),
    supabase.from('student_skills').select('skills(name)').eq('user_id', a.student_id),
  ]);
  const skills = ((sk ?? []) as unknown as { skills: { name: string } | null }[]).map((s) => s.skills?.name).filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500"><Link href="/company/applications" className="hover:underline">Applicants</Link> / {p?.full_name}</nav>
      <Card className="flex flex-wrap items-center gap-4 p-5">
        <Avatar name={p?.full_name ?? '?'} src={p?.avatar_url} size={64} />
        <div className="min-w-0 flex-1"><h1 className="font-display text-xl font-bold text-navy-900">{p?.full_name}</h1>
          <p className="text-sm text-slate-600">Applied for <Link className="font-medium text-teal-700 hover:underline" href={`/internships/${a.internships?.id}`}>{a.internships?.title}</Link> on {formatDate(a.created_at)}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
            <a href={`mailto:${p?.email}`} className="inline-flex items-center gap-1 hover:text-navy-800"><Mail size={14} />{p?.email}</a>
            {contact?.phone && <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1 hover:text-navy-800"><Phone size={14} />{contact.phone}</a>}</div></div>
        <StatusBadge status={a.status} />
      </Card>

      <Card><CardHeader title="Update status" /><div className="p-5"><StatusControls applicationId={a.id} current={a.status} /></div></Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card><CardHeader title="Cover letter" /><p className="whitespace-pre-line p-5 text-slate-700">{a.cover_letter}</p></Card>
          <Card><CardHeader title="Candidate" action={<LinkButton href={`/students/${a.student_id}`} variant="outline" size="sm"><ExternalLink size={14} />Full profile</LinkButton>} />
            <dl className="grid gap-3 p-5 text-sm sm:grid-cols-2">
              {[['University', sp?.university], ['Program', sp?.degree_program], ['Field of study', sp?.field_of_study], ['Year', sp?.year_of_study], ['Location', sp?.location]].map(([k, v]) => v ? <div key={k as string}><dt className="text-xs text-slate-500">{k}</dt><dd className="font-medium text-navy-900">{String(v)}</dd></div> : null)}
            </dl>
            {skills.length > 0 && <div className="flex flex-wrap gap-2 px-5 pb-5">{skills.map((s) => <Badge key={s} tone="teal">{s}</Badge>)}</div>}
          </Card>
          {a.cv_path && <a href={`/api/applications/${a.id}/cv`} className="inline-flex items-center gap-2 rounded-xl bg-navy-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-700"><Download size={16} />Download CV</a>}
        </div>
        <div className="space-y-6">
          <Card><CardHeader title="Private notes" /><Notes applicationId={a.id} notes={notes ?? []} /></Card>
          <Card><CardHeader title="History" /><ol className="space-y-2 p-5 text-sm">{(events ?? []).map((e, n) => <li key={n} className="flex items-center justify-between"><StatusBadge status={e.status} /><span className="text-xs text-slate-500">{formatDate(e.created_at)}</span></li>)}</ol></Card>
        </div>
      </div>
    </div>
  );
}
