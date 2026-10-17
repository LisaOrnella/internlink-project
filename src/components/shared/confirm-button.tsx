'use client';
import { useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';

/** Button that asks for confirmation in an accessible native <dialog> before running a server action. */
export function ConfirmButton({ action, title, description, confirmLabel = 'Confirm', children, variant = 'danger', size = 'sm' }: {
  action: () => Promise<void> | void; title: string; description: string; confirmLabel?: string;
  children: React.ReactNode; variant?: 'danger' | 'outline' | 'primary'; size?: 'sm' | 'md';
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  return (
    <>
      <Button type="button" variant={variant === 'danger' ? 'outline' : variant} size={size}
        className={variant === 'danger' ? 'border-red-200 text-red-700 hover:bg-red-50' : ''} onClick={() => ref.current?.showModal()}>
        {children}
      </Button>
      <dialog ref={ref} className="w-[min(92vw,26rem)] rounded-2xl p-0 shadow-lift backdrop:bg-navy-950/50">
        <div className="space-y-3 p-6">
          <h3 className="font-display text-lg font-semibold text-navy-900">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => ref.current?.close()}>Cancel</Button>
            <Button type="button" variant={variant === 'primary' ? 'primary' : 'danger'} disabled={pending}
              onClick={() => start(async () => { await action(); ref.current?.close(); })}>
              {pending ? 'Working…' : confirmLabel}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
