'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/form';
import { addNoteAction, deleteNoteAction, updateApplicationStatusAction } from '@/actions/company';
import { COMPANY_SETTABLE, STATUS_LABEL } from '@/lib/constants';
import { formatDate } from '@/lib/format';

export function StatusControls({ applicationId, current }: { applicationId: string; current: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const disabled = current === 'withdrawn';
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Change application status">
      {COMPANY_SETTABLE.map((s) => (
        <Button key={s} size="sm" variant={current === s ? 'primary' : 'outline'} disabled={pending || disabled || current === s} aria-pressed={current === s}
          onClick={() => start(async () => {
            const r = await updateApplicationStatusAction({ applicationId, status: s });
            if (r.ok) { toast.success(r.message); router.refresh(); } else toast.error(r.message ?? 'Could not update');
          })}>{STATUS_LABEL[s]}</Button>))}
      {disabled && <p className="w-full text-xs text-slate-500">The candidate withdrew this application.</p>}
    </div>
  );
}

export function Notes({ applicationId, notes }: { applicationId: string; notes: { id: string; body: string; created_at: string }[] }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3 p-5">
      <p className="text-xs text-slate-500">Private notes — visible to your company only, never to the candidate.</p>
      <ul className="space-y-2">{notes.map((n) => (
        <li key={n.id} className="flex items-start justify-between gap-2 rounded-xl bg-sun-50 p-3 text-sm"><div><p className="whitespace-pre-line text-slate-800">{n.body}</p><p className="mt-1 text-xs text-slate-500">{formatDate(n.created_at)}</p></div>
          <button type="button" aria-label="Delete note" className="rounded p-1 text-slate-400 hover:text-red-600" onClick={() => start(async () => { await deleteNoteAction(n.id, applicationId); router.refresh(); })}><Trash2 size={14} /></button></li>))}</ul>
      <Textarea aria-label="New private note" value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={2000} placeholder="Add an internal note…" />
      <div className="flex justify-end"><Button size="sm" disabled={pending || !body.trim()} onClick={() => start(async () => {
        const r = await addNoteAction({ applicationId, body });
        if (r.ok) { setBody(''); toast.success(r.message); router.refresh(); } else toast.error(r.errors?.body ?? r.message ?? 'Could not save note');
      })}>Add note</Button></div>
    </div>
  );
}
