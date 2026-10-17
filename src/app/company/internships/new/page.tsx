import { requireRole } from '@/lib/auth';
import { PageHeader } from '@/components/ui/misc';
import { InternshipForm } from '@/components/company/internship-form';

export const metadata = { title: 'Post an internship' };
export default async function NewInternship() {
  await requireRole('company');
  return (<div><PageHeader title="Post an internship" description="Save a draft any time, publish when you're ready." /><InternshipForm /></div>);
}
