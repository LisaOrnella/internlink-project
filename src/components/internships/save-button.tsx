'use client';
import { useState, useTransition } from 'react';
import { Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { toggleSaveAction } from '@/actions/student';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function SaveButton({ internshipId, initialSaved, compact }: { internshipId: string; initialSaved: boolean; compact?: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();
  function toggle() {
    const next = !saved;
    setSaved(next); // optimistic
    start(async () => {
      const res = await toggleSaveAction(internshipId);
      if (!res.ok) { setSaved(!next); toast.error(res.message ?? 'Could not update saved internships'); }
      else toast.success(next ? 'Saved to your list' : 'Removed from saved');
    });
  }
  if (compact) {
    return (
      <button type="button" onClick={toggle} disabled={pending} aria-pressed={saved} aria-label={saved ? 'Remove from saved' : 'Save internship'}
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-navy-50 hover:text-navy-700">
        <Bookmark size={18} className={cn(saved && 'fill-sun-400 text-sun-500')} />
      </button>
    );
  }
  return (
    <Button type="button" variant="outline" onClick={toggle} disabled={pending} aria-pressed={saved}>
      <Bookmark size={16} className={cn(saved && 'fill-sun-400 text-sun-500')} />{saved ? 'Saved' : 'Save'}
    </Button>
  );
}
