import Link from 'next/link';
import { Briefcase, PlusCircle } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { LinkButton } from '@/components/ui/button';
import { ListingActions } from '@/components/company/listing-actions';

export const metadata = { title: 'My internships' };

export default async function CompanyInternships() {
  const { user } = await requireRole('company');
  const supabase = await createClient();
  const { data } = await supabase.from('internships').select('id,title,status,deadline,created_at,is_sample,applications(count),company_profiles!inner(owner_id)')
    .eq('company_profiles.owner_id', user.id).order('created_at', { ascending: false });
  const rows = (data ?? []) as unknown as { id: string; title: string; status: string; deadline: string | null; created_at: string; applications: { count: number }[] }[];
  return (
    <div>
      <PageHeader title="My internships" description="Create, edit, close and archive your listings." action={<LinkButton href="/company/internships/new" variant="accent"><PlusCircle size={16} />Post internship</LinkButton>} />
      {rows.length === 0 ? <EmptyState icon={<Briefcase />} title="No internships yet" description="Post your first internship to start receiving applications." action={<LinkButton href="/company/internships/new" variant="accent">Post an internship</LinkButton>} /> : (
        <Card className="divide-y divide-slate-100">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0"><Link href={`/company/internships/${r.id}/edit`} className="font-medium text-navy-900 hover:underline">{r.title}</Link>
                <p className="text-xs text-slate-500">Posted {formatDate(r.created_at)} · deadline {formatDate(r.deadline)} · <Link href={`/company/applications?internship=${r.id}`} className="text-teal-700 hover:underline">{r.applications?.[0]?.count ?? 0} applicant(s)</Link></p></div>
              <div className="flex items-center gap-3"><StatusBadge status={r.status} /><ListingActions id={r.id} status={r.status} /></div>
            </div>))}
        </Card>)}
    </div>
  );
}
