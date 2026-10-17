import { Briefcase, Building2, FileText, GraduationCap, Layers } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { APPLICATION_STATUSES, STATUS_LABEL } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { Card, CardHeader } from '@/components/ui/card';
import { PageHeader, Stat } from '@/components/ui/misc';
import { StatusChart } from '@/components/admin/status-chart';

export const metadata = { title: 'Admin overview' };
const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;

export default async function AdminHome() {
  const s = await createClient();
  const head = { count: 'exact' as const, head: true };
  const [students, companies, internships, active, apps, ...byStatus] = await Promise.all([
    count(s.from('profiles').select('id', head).eq('role', 'student')),
    count(s.from('company_profiles').select('id', head)),
    count(s.from('internships').select('id', head)),
    count(s.from('internships').select('id', head).eq('status', 'published')),
    count(s.from('applications').select('id', head)),
    ...APPLICATION_STATUSES.map((st) => count(s.from('applications').select('id', head).eq('status', st))),
  ]);
  const { data: logs } = await s.from('audit_logs').select('id,action,entity,created_at').order('created_at', { ascending: false }).limit(8);
  return (
    <div className="space-y-6">
      <PageHeader title="Platform overview" description="Live counts from the database (includes any seeded sample listings)." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Students" value={students} icon={<GraduationCap size={18} />} />
        <Stat label="Companies" value={companies} icon={<Building2 size={18} />} />
        <Stat label="Internships" value={internships} icon={<Briefcase size={18} />} />
        <Stat label="Active listings" value={active} icon={<Layers size={18} />} />
        <Stat label="Applications" value={apps} icon={<FileText size={18} />} />
      </div>
      <Card><CardHeader title="Applications by status" /><div className="p-5"><StatusChart data={APPLICATION_STATUSES.map((st, i) => ({ name: STATUS_LABEL[st], value: byStatus[i] ?? 0 }))} /></div></Card>
      <Card><CardHeader title="Recent admin activity" />
        {logs?.length ? <ul className="divide-y divide-slate-100 text-sm">{logs.map((l) => <li key={l.id} className="flex justify-between px-5 py-2.5"><span className="font-medium text-navy-900">{l.action.replace(/_/g, ' ')} <span className="font-normal text-slate-500">· {l.entity}</span></span><span className="text-xs text-slate-500">{formatDate(l.created_at)}</span></li>)}</ul> : <p className="p-5 text-sm text-slate-500">No admin actions yet.</p>}</Card>
    </div>
  );
}
