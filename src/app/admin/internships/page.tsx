import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { cleanTerm } from '@/lib/queries';
import { formatDate } from '@/lib/format';
import { PAGE_SIZE, STATUS_LABEL } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form';
import { Pagination } from '@/components/internships/pagination';
import { ModerateToggle } from '@/components/admin/admin-buttons';

export const metadata = { title: 'Moderate internships' };
type SP = { q?: string; status?: string; page?: string };
type Row = { id: string; title: string; status: string; is_sample: boolean; created_at: string; company_profiles: { name: string } | null };

export default async function AdminInternships({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const s = await createClient();
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);
  let q = s.from('internships').select('id,title,status,is_sample,created_at,company_profiles(name)', { count: 'exact' }).order('created_at', { ascending: false });
  if (sp.status && ['draft', 'published', 'closed', 'archived', 'removed'].includes(sp.status)) q = q.eq('status', sp.status);
  const term = cleanTerm(sp.q ?? '');
  if (term) q = q.ilike('title', `%${term}%`);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await q.range(from, from + PAGE_SIZE - 1);
  const rows = (data ?? []) as unknown as Row[];
  return (
    <div>
      <PageHeader title="Internships" description={`${count ?? 0} listing(s)`} />
      <form className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card md:grid-cols-[1fr_180px_auto]" role="search">
        <Input name="q" aria-label="Search listings" placeholder="Search by title" defaultValue={sp.q ?? ''} />
        <Select name="status" aria-label="Status" defaultValue={sp.status ?? ''}><option value="">All statuses</option>{['draft', 'published', 'closed', 'archived', 'removed'].map((x) => <option key={x} value={x}>{STATUS_LABEL[x]}</option>)}</Select>
        <Button type="submit" variant="primary">Filter</Button>
      </form>
      <Card className="divide-y divide-slate-100">
        {rows.map((i) => (
          <div key={i.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
            <div className="min-w-0 flex-1"><Link href={`/internships/${i.id}`} className="font-medium text-navy-900 hover:underline">{i.title}</Link><p className="text-sm text-slate-500">{i.company_profiles?.name} · {formatDate(i.created_at)}</p></div>
            {i.is_sample && <Badge tone="sun">Sample</Badge>}<StatusBadge status={i.status} /><ModerateToggle id={i.id} status={i.status} />
          </div>))}
        {!rows.length && <p className="p-8 text-center text-sm text-slate-500">No listings found.</p>}
      </Card>
      <Pagination page={page} pages={Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))} basePath="/admin/internships" params={sp as Record<string, string | undefined>} />
    </div>
  );
}
