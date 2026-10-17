import Link from 'next/link';
import { Bell, Briefcase, CalendarClock, CheckCircle2, FileText, Search, Send, Sparkles, UserRound } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getStudentMatchProfile, INTERNSHIP_SELECT, skillNames } from '@/lib/queries';
import { getStudentCompletion } from '@/lib/student-data';
import { matchInternship } from '@/lib/matching';
import { daysUntil, deadlineText, formatDate, timeAgo } from '@/lib/format';
import { APPLICATION_STATUSES, STATUS_LABEL } from '@/lib/constants';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState, PageHeader, Progress, Stat } from '@/components/ui/misc';
import { LinkButton } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { InternshipCard } from '@/components/internships/internship-card';
import type { Internship } from '@/types/db';

export const metadata = { title: 'Student dashboard' };

export default async function StudentDashboard() {
  const { user, profile } = await requireRole('student');
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: apps }, { data: saved }, { data: notes }, { data: recent }, completion, match] = await Promise.all([
    supabase.from('applications').select('id,status,created_at,internships(id,title,company_profiles(name))').eq('student_id', user.id).order('created_at', { ascending: false }),
    supabase.from('saved_internships').select('internships(id,title,deadline,status,company_profiles(name))').eq('user_id', user.id),
    supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('internships').select(INTERNSHIP_SELECT).eq('status', 'published').or(`deadline.is.null,deadline.gte.${today}`).order('published_at', { ascending: false }).limit(30),
    getStudentCompletion(supabase, user.id),
    getStudentMatchProfile(supabase, user.id),
  ]);

  const appList = apps ?? [];
  const counts = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, appList.filter((a) => a.status === s).length]));
  const appliedIds = new Set(appList.map((a) => (a.internships as unknown as { id: string } | null)?.id));
  const jobs = ((recent ?? []) as Internship[]).filter((i) => !appliedIds.has(i.id));
  const recommended = jobs
    .map((i) => ({ i, m: matchInternship(match, { title: i.title, category: i.category, location: i.location, arrangement: i.arrangement, skills: skillNames(i) }) }))
    .filter((r) => r.m && r.m.score > 0).sort((a, b) => b.m!.score - a.m!.score).slice(0, 3);
  const savedList = ((saved ?? []) as unknown as { internships: { id: string; title: string; deadline: string | null; status: string; company_profiles: { name: string } | null } | null }[])
    .map((s) => s.internships).filter((i): i is NonNullable<typeof i> => !!i);
  const upcoming = savedList.filter((i) => i.status === 'published' && (daysUntil(i.deadline) ?? -1) >= 0 && (daysUntil(i.deadline) ?? 99) <= 14)
    .sort((a, b) => (a.deadline ?? '').localeCompare(b.deadline ?? '')).slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back, ${profile.full_name.split(' ')[0]} 👋`} description="Here's what's happening with your internship search."
        action={<LinkButton href="/internships" variant="accent"><Search size={16} />Find internships</LinkButton>} />

      {completion.percent < 100 && (
        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between"><p className="font-display font-semibold text-navy-900">Profile completion</p><span className="text-sm font-bold text-teal-700">{completion.percent}%</span></div>
            <Progress value={completion.percent} label="Profile completion" />
            <p className="mt-2 text-xs text-slate-500">Still missing: {completion.missing.slice(0, 4).join(', ')}{completion.missing.length > 4 ? '…' : ''}</p>
          </div>
          <LinkButton href="/dashboard/profile" variant="primary"><UserRound size={16} />Complete profile</LinkButton>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Applications" value={appList.length} icon={<Send size={18} />} />
        <Stat label="In progress" value={(counts.submitted ?? 0) + (counts.under_review ?? 0)} icon={<FileText size={18} />} />
        <Stat label="Shortlisted / Interview" value={(counts.shortlisted ?? 0) + (counts.interview ?? 0)} icon={<CheckCircle2 size={18} />} />
        <Stat label="Saved" value={savedList.length} icon={<Briefcase size={18} />} />
      </div>

      <section aria-labelledby="rec">
        <div className="mb-3 flex items-center justify-between"><h2 id="rec" className="flex items-center gap-2 font-display text-lg font-semibold text-navy-900"><Sparkles size={18} className="text-sun-500" />Recommended for you</h2><Link href="/internships?sort=relevance" className="text-sm font-medium text-teal-700 hover:underline">See all</Link></div>
        {recommended.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{recommended.map(({ i, m }) => <InternshipCard key={i.id} internship={i} match={m} />)}</div>
        ) : (
          <EmptyState icon={<Sparkles />} title="Add skills to get recommendations" description="Recommendations compare your listed skills, field of study, location and preferences with each listing. Complete your profile to see matches."
            action={<LinkButton href="/dashboard/profile" variant="primary">Update profile</LinkButton>} />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Application status" action={<Link href="/dashboard/applications" className="text-sm font-medium text-teal-700 hover:underline">View all</Link>} />
          {appList.length ? (
            <ul className="divide-y divide-slate-100">
              {APPLICATION_STATUSES.map((s) => <li key={s} className="flex items-center justify-between px-5 py-2.5 text-sm"><StatusBadge status={s} /><span className="font-semibold text-navy-900">{counts[s]}</span></li>)}
            </ul>
          ) : <p className="p-5 text-sm text-slate-500">No applications yet. Your {STATUS_LABEL.submitted.toLowerCase()} applications will appear here.</p>}
        </Card>
        <Card>
          <CardHeader title="Upcoming deadlines (saved)" />
          {upcoming.length ? (
            <ul className="divide-y divide-slate-100">{upcoming.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <Link href={`/internships/${i.id}`} className="min-w-0"><p className="truncate font-medium text-navy-900 hover:underline">{i.title}</p><p className="truncate text-xs text-slate-500">{i.company_profiles?.name}</p></Link>
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-sun-600"><CalendarClock size={14} />{formatDate(i.deadline)} · {deadlineText(i.deadline)}</span>
              </li>))}</ul>
          ) : <p className="p-5 text-sm text-slate-500">Save internships to track their deadlines here.</p>}
        </Card>
      </div>

      <Card>
        <CardHeader title="Notifications" action={<Link href="/notifications" className="text-sm font-medium text-teal-700 hover:underline">View all</Link>} />
        {notes?.length ? (
          <ul className="divide-y divide-slate-100">{notes.map((n) => (
            <li key={n.id} className="flex items-start gap-3 px-5 py-3 text-sm"><Bell size={16} className={n.is_read ? 'mt-0.5 text-slate-300' : 'mt-0.5 text-sun-500'} />
              <div className="min-w-0 flex-1"><p className="font-medium text-navy-900">{n.title}</p><p className="text-slate-600">{n.body}</p></div><span className="shrink-0 text-xs text-slate-400">{timeAgo(n.created_at)}</span></li>))}</ul>
        ) : <p className="p-5 text-sm text-slate-500">You&apos;re all caught up.</p>}
      </Card>

      <Card className="p-5"><h2 className="mb-3 font-display text-base font-semibold text-navy-900">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/internships" variant="outline"><Search size={16} />Browse internships</LinkButton>
          <LinkButton href="/dashboard/profile" variant="outline"><UserRound size={16} />Edit profile</LinkButton>
          <LinkButton href={`/students/${user.id}`} variant="outline">Preview public profile</LinkButton>
          <LinkButton href="/dashboard/saved" variant="outline">Saved internships</LinkButton>
        </div></Card>
    </div>
  );
}
