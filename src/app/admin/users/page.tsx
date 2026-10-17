import { createClient } from '@/lib/supabase/server';
import { cleanTerm } from '@/lib/queries';
import { formatDate } from '@/lib/format';
import { PAGE_SIZE } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form';
import { Avatar } from '@/components/shared/avatar';
import { Pagination } from '@/components/internships/pagination';
import { AccountToggle } from '@/components/admin/admin-buttons';

export const metadata = { title: 'Manage users' };
type SP = { q?: string; role?: string; status?: string; page?: string };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const s = await createClient();
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);
  let q = s.from('profiles').select('id,full_name,email,role,status,avatar_url,created_at', { count: 'exact' }).order('created_at', { ascending: false });
  if (sp.role && ['student', 'company', 'admin'].includes(sp.role)) q = q.eq('role', sp.role);
  if (sp.status && ['active', 'suspended'].includes(sp.status)) q = q.eq('status', sp.status);
  const term = cleanTerm(sp.q ?? '');
  if (term) q = q.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await q.range(from, from + PAGE_SIZE - 1);
  return (
    <div>
      <PageHeader title="Users" description={`${count ?? 0} account(s)`} />
      <form className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card md:grid-cols-[1fr_160px_160px_auto]" role="search">
        <Input name="q" aria-label="Search users" placeholder="Search name or email" defaultValue={sp.q ?? ''} />
        <Select name="role" aria-label="Role" defaultValue={sp.role ?? ''}><option value="">All roles</option><option value="student">Students</option><option value="company">Companies</option><option value="admin">Admins</option></Select>
        <Select name="status" aria-label="Status" defaultValue={sp.status ?? ''}><option value="">Any status</option><option value="active">Active</option><option value="suspended">Suspended</option></Select>
        <Button type="submit" variant="primary">Filter</Button>
      </form>
      <Card className="divide-y divide-slate-100">
        {(data ?? []).map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
            <Avatar name={u.full_name} src={u.avatar_url} size={40} />
            <div className="min-w-0 flex-1"><p className="truncate font-medium text-navy-900">{u.full_name}</p><p className="truncate text-sm text-slate-500">{u.email} · joined {formatDate(u.created_at)}</p></div>
            <Badge tone="navy">{u.role}</Badge><StatusBadge status={u.status} />
            {u.role !== 'admin' && <AccountToggle userId={u.id} status={u.status} />}
          </div>))}
        {!data?.length && <p className="p-8 text-center text-sm text-slate-500">No users match these filters.</p>}
      </Card>
      <Pagination page={page} pages={Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))} basePath="/admin/users" params={sp as Record<string, string | undefined>} />
    </div>
  );
}
