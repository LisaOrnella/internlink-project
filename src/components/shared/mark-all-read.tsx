'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { markNotificationsReadAction } from '@/actions/student';

export function MarkAllRead() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button variant="outline" disabled={pending} onClick={() => start(async () => {
      const r = await markNotificationsReadAction();
      if (r.ok) { toast.success('All notifications marked as read'); router.refresh(); } else toast.error('Could not update notifications');
    })}><CheckCheck size={16} />Mark all as read</Button>
  );
}
