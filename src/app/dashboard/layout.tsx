import { Bell, Bookmark, FileText, LayoutDashboard, UserRound } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireRole('student');
  return (
    <DashboardShell title="Student" links={[
      { href: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
      { href: '/dashboard/profile', label: 'My profile', icon: <UserRound size={18} /> },
      { href: '/internships', label: 'Find internships', icon: <FileText size={18} /> },
      { href: '/dashboard/applications', label: 'Applications', icon: <FileText size={18} /> },
      { href: '/dashboard/saved', label: 'Saved', icon: <Bookmark size={18} /> },
      { href: '/notifications', label: 'Notifications', icon: <Bell size={18} /> },
    ]}>{children}</DashboardShell>
  );
}
