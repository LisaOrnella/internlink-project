import { Bookmark } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { INTERNSHIP_SELECT } from '@/lib/queries';
import { InternshipCard } from '@/components/internships/internship-card';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { LinkButton } from '@/components/ui/button';
import type { Internship } from '@/types/db';

export const metadata = { title: 'Saved internships' };

export default async function SavedPage() {
  const { user } = await requireRole('student');
  const supabase = await createClient();
  const { data: saved } = await supabase.from('saved_internships').select('internship_id').eq('user_id', user.id).order('created_at', { ascending: false });
  const ids = (saved ?? []).map((s) => s.internship_id);
  const { data } = ids.length ? await supabase.from('internships').select(INTERNSHIP_SELECT).in('id', ids) : { data: [] };
  const items = (data ?? []) as Internship[];
  return (
    <div>
      <PageHeader title="Saved internships" description="Your shortlist of opportunities to come back to." />
      {items.length === 0 ? (
        <EmptyState icon={<Bookmark />} title="Nothing saved yet" description="Tap the bookmark on any internship to keep it here." action={<LinkButton href="/internships" variant="accent">Browse internships</LinkButton>} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map((i) => <InternshipCard key={i.id} internship={i} saved />)}</div>
      )}
    </div>
  );
}
