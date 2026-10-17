import Link from 'next/link';
import { Flag } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import { PAGE_SIZE } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { Select } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/internships/pagination';
import { ReportDecision } from '@/components/admin/admin-buttons';

export const metadata = { title: 'Reported listings' };
type SP = { status?: string; page?: string };
type Row = { id: string; reason: string; status: string; created_at: string; internships: { id: string; title: string; status: string } | null; profiles: { full_name: string } | null };

export default async function AdminReports({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const s = await createClient();
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);
  const status = sp.status ?? 'open';
  let q = s.from('reports').select('id,reason,status,created_at,internships(id,title,status),profiles!reports_reporter_id_fkey(full_name)', { count: 'exact' }).order('created_at', { ascending: false });
  if (['open', 'dismissed', 'actioned'].includes(status)) q = q.eq('status', status);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await q.range(from, from + PAGE_SIZE - 1);
  const rows = (data ?? []) as unknown as Row[];
  return (
    <div>
      <PageHeader title="Reported listings" description="Review reports of inappropriate or fraudulent listings." />
      <form className="mb-5 flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card"><Select name="status" aria-label="Report status" defaultValue={status} className="max-w-xs"><option value="open">Open</option><option value="actioned">Approved (removed)</option><option value="dismissed">Rejected</option><option value="all">All</option></Select><Button type="submit" variant="primary">Filter</Button></form>
      {rows.length === 0 ? <EmptyState icon={<Flag />} title="No reports here" description="Nothing needs your attention right now." /> : (
        <div className="space-y-4">{rows.map((r) => (
          <Card key={r.id} className="space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><Link href={`/internships/${r.internships?.id}`} className="font-display font-semibold text-navy-900 hover:underline">{r.internships?.title}</Link><p className="text-xs text-slate-500">Reported by {r.profiles?.full_name} on {formatDate(r.created_at)} · listing is <b>{r.internships?.status}</b></p></div>
              <StatusBadge status={r.status} />
            </div>
            <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{r.reason}</p>
            {r.status === 'open' && <ReportDecision id={r.id} />}
          </Card>))}</div>)}
      <Pagination page={page} pages={Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))} basePath="/admin/reports" params={sp as Record<string, string | undefined>} />
    </div>
  );
}
