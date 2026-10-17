import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Bell } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { timeAgo } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { MarkAllRead } from '@/components/shared/mark-all-read';

export const metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const current = await getCurrentUser();
  if (!current) redirect('/login?next=/notifications');
  const supabase = await createClient();
  const { data } = await supabase.from('notifications').select('*').eq('user_id', current.user.id).order('created_at', { ascending: false }).limit(50);
  const unread = (data ?? []).filter((n) => !n.is_read).length;
  return (
    <main id="main" className="bg-slate-50 py-8">
      <div className="container-page max-w-3xl">
        <PageHeader title="Notifications" description={unread ? `${unread} unread` : 'All caught up'} action={unread ? <MarkAllRead /> : undefined} />
        {!data?.length ? <EmptyState icon={<Bell />} title="No notifications yet" description="Updates about applications and deadlines will show up here." /> : (
          <Card><ul className="divide-y divide-slate-100">{data.map((n) => (
            <li key={n.id} className={n.is_read ? 'px-5 py-4' : 'bg-teal-50/50 px-5 py-4'}>
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.is_read ? 'bg-slate-300' : 'bg-sun-500'}`} aria-label={n.is_read ? 'Read' : 'Unread'} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-navy-900">{n.link ? <Link href={n.link} className="hover:underline">{n.title}</Link> : n.title}</p>
                  {n.body && <p className="text-sm text-slate-600">{n.body}</p>}
                </div>
                <span className="shrink-0 text-xs text-slate-400">{timeAgo(n.created_at)}</span>
              </div>
            </li>))}</ul></Card>
        )}
      </div>
    </main>
  );
}
