import { BarChart3, Briefcase, Building2, Flag, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('admin');   // server-side authorization — not just hidden links
  const supabase = await createClient();
  const { count } = await supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open');
  return (
    <DashboardShell title="Admin" links={[
      { href: '/admin', label: 'Overview', icon: <BarChart3 size={18} /> },
      { href: '/admin/users', label: 'Users', icon: <Users size={18} /> },
      { href: '/admin/companies', label: 'Companies', icon: <Building2 size={18} /> },
      { href: '/admin/internships', label: 'Internships', icon: <Briefcase size={18} /> },
      { href: '/admin/reports', label: 'Reports', icon: <Flag size={18} />, badge: count ?? 0 },
    ]}>{children}</DashboardShell>
  );
}
