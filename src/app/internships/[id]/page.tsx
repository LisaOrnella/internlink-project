import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { BadgeCheck, Calendar, Clock, GraduationCap, MapPin, Users, Wallet } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { INTERNSHIP_SELECT, getStudentMatchProfile, skillNames } from '@/lib/queries';
import { matchInternship } from '@/lib/matching';
import { arrangementLabel, bulletLines, deadlineText, daysUntil, formatDate, formatStipend, typeLabel } from '@/lib/format';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/button';
import { Avatar } from '@/components/shared/avatar';
import { SaveButton } from '@/components/internships/save-button';
import { ShareButton } from '@/components/internships/share-button';
import { ReportButton } from '@/components/internships/report-button';
import type { Internship } from '@/types/db';

type Props = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function load(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from('internships').select(INTERNSHIP_SELECT).eq('id', id).maybeSingle();
  return data as Internship | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const i = await load((await params).id);
  if (!i) return { title: 'Internship not found' };
  return { title: `${i.title} at ${i.company_profiles?.name}`, description: i.description.slice(0, 155) };
}

export default async function InternshipDetail({ params }: Props) {
  const { id } = await params;
  const i = await load(id);
  if (!i) notFound();
  const supabase = await createClient();
  const current = await getCurrentUser();
  const role = current?.profile.role;
  const company = i.company_profiles!;
  const skills = skillNames(i);

  let saved = false;
  let application: { id: string; status: string } | null = null;
  let match = null;
  if (role === 'student') {
    const [{ data: s }, { data: a }, profile] = await Promise.all([
      supabase.from('saved_internships').select('internship_id').eq('user_id', current!.user.id).eq('internship_id', id).maybeSingle(),
      supabase.from('applications').select('id,status').eq('internship_id', id).eq('student_id', current!.user.id).maybeSingle(),
      getStudentMatchProfile(supabase, current!.user.id),
    ]);
    saved = !!s; application = a;
    match = matchInternship(profile, { title: i.title, category: i.category, location: i.location, arrangement: i.arrangement, skills });
  }
  const days = daysUntil(i.deadline);
  const closed = i.status !== 'published' || (days !== null && days < 0);
  const isOwnerOrAdmin = i.status !== 'published';

  return (
    <main id="main" className="bg-slate-50 pb-16">
      <section className="gradient-navy text-white">
        <div className="container-page py-10">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-300"><Link href="/internships" className="hover:text-white">Internships</Link> / <span>{i.title}</span></nav>
          <div className="flex flex-wrap items-start gap-5">
            <Avatar name={company.name} src={company.logo_url} size={72} square className="ring-4 ring-white/20" />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-bold sm:text-4xl">{i.title}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-slate-200">
                <Link href={`/companies/${company.id}`} className="font-medium underline-offset-4 hover:underline">{company.name}</Link>
                {company.is_verified && <BadgeCheck size={16} className="text-teal-300" aria-label="Verified company" />}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="teal">{arrangementLabel(i.arrangement)}</Badge><Badge tone="navy">{typeLabel(i.type)}</Badge>
                <Badge tone={i.is_paid ? 'green' : 'slate'}>{i.is_paid ? 'Paid' : 'Unpaid'}</Badge>
                <Badge tone="sun">{i.category}</Badge>
                {i.is_sample && <Badge tone="sun">Sample listing</Badge>}
                {isOwnerOrAdmin && <StatusBadge status={i.status} />}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card><CardHeader title="About this internship" /><div className="whitespace-pre-line p-5 text-slate-700">{i.description}</div></Card>
          {[['Responsibilities', i.responsibilities], ['Requirements', i.requirements], ['Benefits', i.benefits]].map(([title, text]) => {
            const lines = bulletLines(text);
            return lines.length ? (
              <Card key={title}><CardHeader title={title!} />
                <ul className="list-disc space-y-1.5 p-5 pl-9 text-slate-700">{lines.map((l, n) => <li key={n}>{l}</li>)}</ul></Card>
            ) : null;
          })}
          {skills.length > 0 && (
            <Card><CardHeader title="Skills required" />
              <div className="flex flex-wrap gap-2 p-5">{skills.map((s) => (
                <Badge key={s} tone={match?.matchedSkills.includes(s) ? 'teal' : 'slate'}>{match?.matchedSkills.includes(s) ? '✓ ' : ''}{s}</Badge>
              ))}</div></Card>
          )}
          {i.application_instructions && <Card><CardHeader title="How to apply" /><p className="whitespace-pre-line p-5 text-slate-700">{i.application_instructions}</p></Card>}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="space-y-4 p-5">
            <dl className="space-y-3 text-sm">
              {[
                [MapPin, 'Location', i.location], [Wallet, 'Compensation', formatStipend(i)],
                [Clock, 'Duration', i.duration_months ? `${i.duration_months} month${i.duration_months > 1 ? 's' : ''}` : '—'],
                [Calendar, 'Starts', formatDate(i.start_date)], [Calendar, 'Apply by', `${formatDate(i.deadline)} (${deadlineText(i.deadline)})`],
                [Users, 'Open positions', String(i.positions)], [GraduationCap, 'Education', i.education_level ?? 'Any'],
              ].map(([Icon, label, value]) => {
                const I = Icon as typeof MapPin;
                return <div key={label as string} className="flex gap-3"><I size={16} className="mt-0.5 shrink-0 text-teal-600" /><div><dt className="text-xs text-slate-500">{label as string}</dt><dd className="font-medium text-navy-900">{value as string}</dd></div></div>;
              })}
            </dl>

            {match && match.reasons.length > 0 && (
              <div className="rounded-xl bg-teal-50 p-3 text-sm text-teal-900">
                <p className="font-semibold">{match.score}% match with your profile</p>
                <ul className="mt-1 list-disc pl-4 text-xs">{match.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
                <p className="mt-1 text-[11px] text-teal-700">Calculated from your listed skills, field of study, location and preferences.</p>
              </div>
            )}

            {application ? (
              <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-center text-sm">
                <p className="text-slate-600">You applied for this internship</p><StatusBadge status={application.status} />
                <LinkButton href="/dashboard/applications" variant="outline" className="w-full">View application</LinkButton>
              </div>
            ) : closed ? (
              <p className="rounded-xl bg-slate-100 p-3 text-center text-sm font-medium text-slate-600">Applications are closed</p>
            ) : role === 'student' ? (
              <div className="flex gap-2"><LinkButton href={`/internships/${i.id}/apply`} variant="accent" size="lg" className="flex-1">Apply now</LinkButton><SaveButton internshipId={i.id} initialSaved={saved} /></div>
            ) : !current ? (
              <div className="space-y-2"><LinkButton href={`/login?next=/internships/${i.id}/apply`} variant="accent" size="lg" className="w-full">Log in to apply</LinkButton>
                <p className="text-center text-xs text-slate-500">New? <Link href="/register" className="font-medium text-teal-700 underline">Create a student account</Link></p></div>
            ) : (
              <p className="rounded-xl bg-slate-100 p-3 text-center text-sm text-slate-600">Only student accounts can apply.</p>
            )}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3"><ShareButton title={i.title} />{current && role !== 'admin' && <ReportButton internshipId={i.id} />}</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3"><Avatar name={company.name} src={company.logo_url} size={44} square />
              <div><p className="font-display font-semibold text-navy-900">{company.name}</p><p className="text-xs text-slate-500">{company.location}</p></div></div>
            <LinkButton href={`/companies/${company.id}`} variant="outline" className="mt-4 w-full">View company profile</LinkButton>
          </Card>
        </aside>
      </div>
    </main>
  );
}
