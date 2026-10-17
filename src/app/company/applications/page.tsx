import Link from 'next/link';
import { Inbox } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { cleanTerm } from '@/lib/queries';
import { formatDate } from '@/lib/format';
import { APPLICATION_STATUSES, PAGE_SIZE, STATUS_LABEL } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form';
import { Avatar } from '@/components/shared/avatar';
import { Pagination } from '@/components/internships/pagination';

export const metadata = { title: 'Applicants' };
type SP = { q?: string; status?: string; internship?: string; page?: string };
type Row = { id: string; status: string; created_at: string; internships: { id: string; title: string } | null; profiles: { full_name: string; email: string; avatar_url: string | null } | null };

export default async function CompanyApplications({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { user } = await requireRole('company');
  const supabase = await createClient();
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  const { data: mine } = await supabase.from('internships').select('id,title,company_profiles!inner(owner_id)').eq('company_profiles.owner_id', user.id).order('title');
  let q = supabase.from('applications').select('id,status,created_at,internships!inner(id,title),profiles!applications_student_id_fkey(full_name,email,avatar_url)', { count: 'exact' }).order('created_at', { ascending: false });
  if (sp.status && (APPLICATION_STATUSES as readonly string[]).includes(sp.status)) q = q.eq('status', sp.status);
  if (sp.internship && /^[0-9a-f-]{36}$/i.test(sp.internship)) q = q.eq('internship_id', sp.internship);
  const term = cleanTerm(sp.q ?? '');
  if (term) {
    const { data: people } = await supabase.from('profiles').select('id').or(`full_name.ilike.%${term}%,email.ilike.%${term}%`).limit(100);
    q = q.in('student_id', people?.length ? people.map((p) => p.id) : ['00000000-0000-0000-0000-000000000000']);
  }
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await q.range(from, from + PAGE_SIZE - 1);
  const rows = (data ?? []) as unknown as Row[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <PageHeader title="Applicants" description={`${count ?? 0} application${count === 1 ? '' : 's'}`} />
      <form className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card md:grid-cols-[1fr_200px_220px_auto]" role="search">
        <Input name="q" aria-label="Search applicants" placeholder="Search by name or email" defaultValue={sp.q ?? ''} />
        <Select name="status" aria-label="Status" defaultValue={sp.status ?? ''}><option value="">All statuses</option>{APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</Select>
        <Select name="internship" aria-label="Internship" defaultValue={sp.internship ?? ''}><option value="">All internships</option>{(mine ?? []).map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</Select>
        <Button type="submit" variant="primary">Filter</Button>
      </form>
      {rows.length === 0 ? <EmptyState icon={<Inbox />} title="No applications found" description="Try different filters, or wait for candidates to apply." /> : (
        <Card className="divide-y divide-slate-100">
          {rows.map((a) => (
            <Link key={a.id} href={`/company/applications/${a.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50">
              <Avatar name={a.profiles?.full_name ?? '?'} src={a.profiles?.avatar_url} size={40} />
              <div className="min-w-0 flex-1"><p className="truncate font-medium text-navy-900">{a.profiles?.full_name}</p><p className="truncate text-sm text-slate-500">{a.internships?.title} · applied {formatDate(a.created_at)}</p></div>
              <StatusBadge status={a.status} />
            </Link>))}
        </Card>)}
      <Pagination page={page} pages={pages} basePath="/company/applications" params={sp as Record<string, string | undefined>} />
    </div>
  );
}
