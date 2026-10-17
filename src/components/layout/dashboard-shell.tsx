import Link from 'next/link';
import { cn } from '@/lib/utils';

export type SideLink = { href: string; label: string; icon: React.ReactNode; badge?: number };

/** Sidebar on desktop, horizontal scroll tabs on mobile. Pure server component (active state handled via CSS-free links). */
export function DashboardShell({ title, links, children }: { title: string; links: SideLink[]; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50">
      <div className="container-page grid gap-6 py-6 lg:grid-cols-[240px_1fr] lg:py-8">
        <aside aria-label={`${title} navigation`}>
          <p className="mb-2 hidden px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 lg:block">{title}</p>
          <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {links.map((l) => (
              <Link key={l.href} href={l.href}
                className={cn('flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/70 transition hover:bg-navy-50 hover:text-navy-800 lg:bg-transparent lg:shadow-none lg:ring-0')}>
                <span className="text-teal-600">{l.icon}</span>
                {l.label}
                {!!l.badge && <span className="ml-auto rounded-full bg-sun-400 px-1.5 text-[11px] font-bold text-navy-900">{l.badge}</span>}
              </Link>
            ))}
          </nav>
        </aside>
        <main id="main" className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
