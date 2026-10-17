'use client';
import { useRef, useState, useTransition } from 'react';
import { Flag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea, Field } from '@/components/ui/form';
import { reportInternshipAction } from '@/actions/student';

export function ReportButton({ internshipId }: { internshipId: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const reason = String(new FormData(e.currentTarget).get('reason') ?? '');
    start(async () => {
      const res = await reportInternshipAction({ internshipId, reason });
      if (res.ok) { toast.success(res.message); ref.current?.close(); setError(undefined); }
      else setError(res.errors?.reason ?? res.message);
    });
  }
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600"><Flag size={14} />Report this listing</button>
      <dialog ref={ref} className="w-[min(92vw,28rem)] rounded-2xl p-0 shadow-lift backdrop:bg-navy-950/50">
        <form onSubmit={submit} className="space-y-3 p-6">
          <h3 className="font-display text-lg font-semibold text-navy-900">Report this listing</h3>
          <p className="text-sm text-slate-600">Tell us what&apos;s wrong — for example fraud, requests for payment, or misleading information.</p>
          <Field id="reason" label="What is the problem?" error={error} required><Textarea id="reason" name="reason" required minLength={10} maxLength={2000} /></Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => ref.current?.close()}>Cancel</Button>
            <Button type="submit" variant="danger" disabled={pending}>{pending ? 'Sending…' : 'Submit report'}</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
