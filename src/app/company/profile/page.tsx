import { Eye } from 'lucide-react';
import { getMyCompany, requireRole } from '@/lib/auth';
import { PageHeader } from '@/components/ui/misc';
import { LinkButton } from '@/components/ui/button';
import { CompanyProfileForm } from '@/components/company/profile-form';
import type { CompanyProfile } from '@/types/db';

export const metadata = { title: 'Company profile' };
export default async function CompanyProfilePage() {
  const { user } = await requireRole('company');
  const company = (await getMyCompany(user.id)) as CompanyProfile;
  return (
    <div className="space-y-6"><PageHeader title="Company profile" description="This is what students see on your public page." action={<LinkButton href={`/companies/${company.id}`} variant="outline"><Eye size={16} />View public page</LinkButton>} /><CompanyProfileForm c={company} /></div>
  );
}
