import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { LinkButton } from '@/components/ui/button';
import { Avatar } from '@/components/shared/avatar';
import { MobileMenu } from './mobile-menu';
import { getCurrentUser, homeFor } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/internships', label: 'Find Internships' },
  { href: '/for-companies', label: 'For Companies' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About' },
];

export async function Navbar() {
  const current = await getCurrentUser();
  let unread = 0;
  if (current) {
    const supabase = await createClient();
    const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', current.user.id).eq('is_read', false);
    unread = count ?? 0;
  }
  const home = current ? homeFor(current.profile.role) : '/login';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-lg">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-navy-50 hover:text-navy-800">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {current ? (
            <>
              <Link href="/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className="relative rounded-xl p-2 text-slate-600 hover:bg-navy-50">
                <Bell size={20} />
                {unread > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sun-500 px-1 text-[10px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}
              </Link>
              <Link href={home} className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-3 hover:bg-navy-50">
                <Avatar name={current.profile.full_name} src={current.profile.avatar_url} size={32} />
                <span className="text-sm font-medium text-navy-800">Dashboard</span>
              </Link>
              <form action="/auth/signout" method="post"><button className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Log out</button></form>
            </>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost">Log in</LinkButton>
              <LinkButton href="/register" variant="accent">Sign up</LinkButton>
            </>
          )}
        </div>
        <MobileMenu links={NAV_LINKS} signedIn={!!current} dashboardHref={home} unread={unread} />
      </div>
    </header>
  );
}
