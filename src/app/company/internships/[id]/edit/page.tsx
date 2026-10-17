import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { INTERNSHIP_SELECT, skillNames } from '@/lib/queries';
import { PageHeader } from '@/components/ui/misc';
import { InternshipForm } from '@/components/company/internship-form';
import type { Internship } from '@/types/db';

export const metadata = { title: 'Edit internship' };
export default async function EditInternship({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireRole('company');
  const supabase = await createClient();
  const { data } = await supabase.from('internships').select(`${INTERNSHIP_SELECT}, company_profiles!inner(id,name,logo_url,is_verified,location,owner_id)`).eq('id', id).maybeSingle();
  const i = data as (Internship & { company_profiles: { owner_id: string } }) | null;
  if (!i || i.company_profiles.owner_id !== user.id) notFound();   // also enforced by RLS
  if (i.status === 'removed') notFound();
  return (<div><PageHeader title="Edit internship" description={i.title} /><InternshipForm internship={i} skills={skillNames(i).join(', ')} /></div>);
}
