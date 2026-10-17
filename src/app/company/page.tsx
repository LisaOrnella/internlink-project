import Link from 'next/link';
import { Briefcase, CheckCircle2, Inbox, PlusCircle, Sparkles, Users } from 'lucide-react';
import { getMyCompany, requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { profileCompletion } from '@/lib/matching';
import { timeAgo } from '@/lib/format';
import { Card, CardHeader } from '@/components/ui/card';
import { PageHeader, Progress, Stat, EmptyState } from '@/components/ui/misc';
import { LinkButton } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/shared/avatar';

export const metadata = { title: 'Company dashboard' };
type AppRow = { id: string; status: string; created_at: string; profiles: { full_name: string; avatar_url: string | null } | null; internships: { title: string; company_id: string } | null };

export default async function CompanyDashboard() {
  const { user } = await requireRole('company');
  const company = (await getMyCompany(user.id))!;
  const supabase = await createClient();
  const [{ data: jobs }, { data: apps }] = await Promise.all([
    supabase.from('internships').select('id,status').eq('company_id', company.id),
    // RLS already limits this to applications for this company's internships
    supabase.from('applications').select('id,status,created_at,profiles!applications_student_id_fkey(full_name,avatar_url),internships!inner(title,company_id)').eq('internships.company_id', company.id).order('created_at', { ascending: false }),
  ]);
  const list = (apps ?? []) as unknown as AppRow[];
  const completion = profileCompletion({ Logo: company.logo_url, Cover: company.cover_url, Industry: company.industry, Description: company.description, Website: company.website,
    'Contact email': company.contact_email, Phone: company.phone, Location: company.location, Size: company.size, Mission: company.mission, Culture: company.culture });

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${company.name}`} description="Your hiring overview." action={<LinkButton href="/company/internships/new" variant="accent"><PlusCircle size={16} />Post an internship</LinkButton>} />
      {completion.percent < 100 && (
        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="flex-1"><div className="mb-2 flex justify-between"><p className="font-display font-semibold text-navy-900">Company profile completion</p><span className="text-sm font-bold text-teal-700">{completion.percent}%</span></div><Progress value={completion.percent} label="Company profile completion" /><p className="mt-2 text-xs text-slate-500">Missing: {completion.missing.slice(0, 5).join(', ')}</p></div><LinkButton href="/company/profile" variant="primary">Complete profile</LinkButton></Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Internships posted" value={jobs?.length ?? 0} icon={<Briefcase size={18} />} />
        <Stat label="Active listings" value={(jobs ?? []).filter((j) => j.status === 'published').length} icon={<Sparkles size={18} />} />
        <Stat label="Applications" value={list.length} icon={<Inbox size={18} />} />
        <Stat label="New (unreviewed)" value={list.filter((a) => a.status === 'submitted').length} icon={<Users size={18} />} />
        <Stat label="Shortlisted" value={list.filter((a) => a.status === 'shortlisted').length} icon={<CheckCircle2 size={18} />} />
      </div>
      <Card>
        <CardHeader title="Recent applications" action={<Link href="/company/applications" className="text-sm font-medium text-teal-700 hover:underline">View all</Link>} />
        {list.length === 0 ? <div className="p-5"><EmptyState icon={<Inbox />} title="No applications yet" description="Publish an internship and applicants will appear here." action={<LinkButton href="/company/internships/new" variant="accent">Post an internship</LinkButton>} /></div> : (
          <ul className="divide-y divide-slate-100">{list.slice(0, 6).map((a) => (
            <li key={a.id}><Link href={`/company/applications/${a.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50"><Avatar name={a.profiles?.full_name ?? '?'} src={a.profiles?.avatar_url} size={36} />
              <div className="min-w-0 flex-1"><p className="truncate font-medium text-navy-900">{a.profiles?.full_name}</p><p className="truncate text-sm text-slate-500">{a.internships?.title}</p></div><StatusBadge status={a.status} /><span className="hidden text-xs text-slate-400 sm:block">{timeAgo(a.created_at)}</span></Link></li>))}</ul>)}
      </Card>
    </div>
  );
}
