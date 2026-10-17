import { Bell, Briefcase, Building2, LayoutDashboard, PlusCircle, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireRole('company');
  const supabase = await createClient();
  const { count } = await supabase.from('applications').select('id, internships!inner(company_profiles!inner(owner_id))', { count: 'exact', head: true })
    .eq('status', 'submitted').eq('internships.company_profiles.owner_id', user.id);
  return (
    <DashboardShell title="Company" links={[
      { href: '/company', label: 'Overview', icon: <LayoutDashboard size={18} /> },
      { href: '/company/internships', label: 'My internships', icon: <Briefcase size={18} /> },
      { href: '/company/internships/new', label: 'Post internship', icon: <PlusCircle size={18} /> },
      { href: '/company/applications', label: 'Applicants', icon: <Users size={18} />, badge: count ?? 0 },
      { href: '/company/profile', label: 'Company profile', icon: <Building2 size={18} /> },
      { href: '/notifications', label: 'Notifications', icon: <Bell size={18} /> },
    ]}>{children}</DashboardShell>
  );
}
