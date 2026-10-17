import Link from 'next/link';
import { FileText } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate, timeAgo } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { LinkButton } from '@/components/ui/button';
import { Avatar } from '@/components/shared/avatar';
import { ConfirmButton } from '@/components/shared/confirm-button';
import { withdrawAction } from '@/actions/student';

export const metadata = { title: 'My applications' };
type Row = { id: string; status: string; created_at: string; updated_at: string; cv_path: string | null;
  internships: { id: string; title: string; location: string; company_profiles: { name: string; logo_url: string | null } | null } | null;
  application_events: { status: string; created_at: string }[] };

export default async function ApplicationsPage() {
  const { user } = await requireRole('student');
  const supabase = await createClient();
  const { data } = await supabase.from('applications')
    .select('id,status,created_at,updated_at,cv_path,internships(id,title,location,company_profiles(name,logo_url)),application_events(status,created_at)')
    .eq('student_id', user.id).order('created_at', { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div>
      <PageHeader title="My applications" description="Track every application and its current status." />
      {rows.length === 0 ? (
        <EmptyState icon={<FileText />} title="You haven't applied yet" description="When you apply for an internship, you'll be able to follow its progress here."
          action={<LinkButton href="/internships" variant="accent">Find internships</LinkButton>} />
      ) : (
        <div className="space-y-4">
          {rows.map((a) => {
            const events = [...(a.application_events ?? [])].sort((x, y) => x.created_at.localeCompare(y.created_at));
            const canWithdraw = !['accepted', 'rejected', 'withdrawn'].includes(a.status);
            return (
              <Card key={a.id} className="p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <Avatar name={a.internships?.company_profiles?.name ?? '?'} src={a.internships?.company_profiles?.logo_url} size={48} square />
                  <div className="min-w-0 flex-1">
                    <Link href={`/internships/${a.internships?.id}`} className="font-display font-semibold text-navy-900 hover:underline">{a.internships?.title}</Link>
                    <p className="text-sm text-slate-600">{a.internships?.company_profiles?.name} · {a.internships?.location}</p>
                    <p className="mt-1 text-xs text-slate-500">Applied {formatDate(a.created_at)} · updated {timeAgo(a.updated_at)}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500" aria-label="Status history">
                  {events.map((e, n) => <li key={n}><span className="font-medium text-slate-700">{e.status.replace('_', ' ')}</span> · {formatDate(e.created_at)}</li>)}
                </ol>
                {canWithdraw && (
                  <div className="mt-3 flex justify-end">
                    <ConfirmButton title="Withdraw this application?" description="The company will be notified and you won't be able to reopen it. You can still apply again only if the listing allows it."
                      confirmLabel="Withdraw" action={async () => { 'use server'; await withdrawAction(a.id); }}>Withdraw</ConfirmButton>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
