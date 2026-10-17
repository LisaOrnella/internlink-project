'use client';
import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Archive, Eye, Lock, Pencil, Rocket, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmButton } from '@/components/shared/confirm-button';
import { deleteInternshipAction, setInternshipStatusAction } from '@/actions/company';

export function ListingActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (s: 'draft' | 'published' | 'closed' | 'archived') => start(async () => {
    const r = await setInternshipStatusAction(id, s);
    if (r.ok) { toast.success(r.message); router.refresh(); } else toast.error(r.message ?? 'Failed');
  });
  const del = async () => {
    const r = await deleteInternshipAction(id);
    if (r.ok) { toast.success(r.message); router.refresh(); } else toast.error(r.message ?? 'Failed');
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link href={`/internships/${id}`} className="rounded-lg p-2 text-slate-500 hover:bg-navy-50" aria-label="View listing"><Eye size={16} /></Link>
      <Link href={`/company/internships/${id}/edit`} className="rounded-lg p-2 text-slate-500 hover:bg-navy-50" aria-label="Edit listing"><Pencil size={16} /></Link>
      {(status === 'draft' || status === 'closed') && <Button size="sm" variant="accent" disabled={pending} onClick={() => set('published')}><Rocket size={14} />Publish</Button>}
      {status === 'published' && <Button size="sm" variant="outline" disabled={pending} onClick={() => set('closed')}><Lock size={14} />Close</Button>}
      {status !== 'archived' && <ConfirmButton variant="outline" title="Archive this listing?" description="It will disappear from search. Applications are kept." confirmLabel="Archive" action={async () => set('archived')}><Archive size={14} />Archive</ConfirmButton>}
      <ConfirmButton title="Delete this listing?" description="This permanently deletes the listing. Listings that already have applications cannot be deleted — archive them instead." confirmLabel="Delete" action={del}><Trash2 size={14} />Delete</ConfirmButton>
    </div>
  );
}
