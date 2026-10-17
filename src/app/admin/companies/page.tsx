import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { cleanTerm } from '@/lib/queries';
import { PAGE_SIZE } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { Avatar } from '@/components/shared/avatar';
import { Pagination } from '@/components/internships/pagination';
import { AccountToggle, VerifyToggle } from '@/components/admin/admin-buttons';

export const metadata = { title: 'Manage companies' };
type SP = { q?: string; page?: string };
type Row = { id: string; name: string; logo_url: string | null; is_verified: boolean; industry: string | null; owner_id: string; profiles: { status: string } | null };

export default async function AdminCompanies({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const s = await createClient();
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);
  let q = s.from('company_profiles').select('id,name,logo_url,is_verified,industry,owner_id,profiles!company_profiles_owner_id_fkey(status)', { count: 'exact' }).order('name');
  const term = cleanTerm(sp.q ?? '');
  if (term) q = q.ilike('name', `%${term}%`);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await q.range(from, from + PAGE_SIZE - 1);
  const rows = (data ?? []) as unknown as Row[];
  return (
    <div>
      <PageHeader title="Companies" description={`${count ?? 0} compan${count === 1 ? 'y' : 'ies'}`} />
      <form className="mb-5 flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card" role="search"><Input name="q" aria-label="Search companies" placeholder="Search by company name" defaultValue={sp.q ?? ''} /><Button type="submit" variant="primary">Search</Button></form>
      <Card className="divide-y divide-slate-100">
        {rows.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
            <Avatar name={c.name} src={c.logo_url} size={40} square />
            <div className="min-w-0 flex-1"><Link href={`/companies/${c.id}`} className="flex items-center gap-1 font-medium text-navy-900 hover:underline">{c.name}{c.is_verified && <BadgeCheck size={15} className="text-teal-600" />}</Link><p className="text-sm text-slate-500">{c.industry ?? 'Industry not set'}</p></div>
            {c.profiles && <StatusBadge status={c.profiles.status} />}
            <VerifyToggle companyId={c.id} verified={c.is_verified} />
            <AccountToggle userId={c.owner_id} status={c.profiles?.status ?? 'active'} />
          </div>))}
        {!rows.length && <p className="p-8 text-center text-sm text-slate-500">No companies found.</p>}
      </Card>
      <Pagination page={page} pages={Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))} basePath="/admin/companies" params={sp as Record<string, string | undefined>} />
    </div>
  );
}
