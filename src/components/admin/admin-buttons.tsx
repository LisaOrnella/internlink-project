'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmButton } from '@/components/shared/confirm-button';
import { moderateInternshipAction, resolveReportAction, setAccountStatusAction, setCompanyVerifiedAction } from '@/actions/admin';
import type { ActionResult } from '@/types/db';

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ActionResult>) => start(async () => {
    const r = await fn();
    if (r.ok) { toast.success(r.message); router.refresh(); } else toast.error(r.message ?? 'Action failed');
  });
  return { pending, run, router };
}

export function AccountToggle({ userId, status }: { userId: string; status: string }) {
  const { run } = useRun();
  const next = status === 'suspended' ? 'active' : 'suspended';
  return (
    <ConfirmButton variant={next === 'active' ? 'outline' : 'danger'} title={next === 'active' ? 'Reactivate this account?' : 'Suspend this account?'}
      description={next === 'active' ? 'The user will be able to log in and use InternLink again.' : 'The user will be signed out of all actions and cannot apply, post or edit until reactivated.'}
      confirmLabel={next === 'active' ? 'Reactivate' : 'Suspend'} action={async () => run(() => setAccountStatusAction(userId, next))}>
      {next === 'active' ? 'Reactivate' : 'Suspend'}
    </ConfirmButton>
  );
}
export function VerifyToggle({ companyId, verified }: { companyId: string; verified: boolean }) {
  const { pending, run } = useRun();
  return <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setCompanyVerifiedAction(companyId, !verified))}>{verified ? 'Remove badge' : 'Verify'}</Button>;
}
export function ModerateToggle({ id, status }: { id: string; status: string }) {
  const { run } = useRun();
  return status === 'removed'
    ? <Button size="sm" variant="outline" onClick={() => run(() => moderateInternshipAction(id, 'restore'))}>Restore</Button>
    : <ConfirmButton title="Remove this listing?" description="It will be hidden from students immediately and the company can no longer edit it." confirmLabel="Remove" action={async () => run(() => moderateInternshipAction(id, 'remove'))}>Remove</ConfirmButton>;
}
export function ReportDecision({ id }: { id: string }) {
  const { pending, run } = useRun();
  return (
    <div className="flex gap-2">
      <ConfirmButton title="Approve report and remove listing?" description="The listing will be removed from the platform." confirmLabel="Approve & remove" action={async () => run(() => resolveReportAction(id, 'approve'))}>Approve</ConfirmButton>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => resolveReportAction(id, 'reject'))}>Reject</Button>
    </div>
  );
}
