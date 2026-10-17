'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { LinkButton } from '@/components/ui/button';

export function MobileMenu({ links, signedIn, dashboardHref, unread }: {
  links: { href: string; label: string }[]; signedIn: boolean; dashboardHref: string; unread: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-nav"
        onClick={() => setOpen((o) => !o)} className="rounded-xl p-2 text-navy-800 hover:bg-navy-50">
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>
      {open && (
        <div id="mobile-nav" className="absolute inset-x-0 top-16 border-b border-slate-200 bg-white p-4 shadow-lift">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base font-medium text-navy-800 hover:bg-navy-50">{l.label}</Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
            {signedIn ? (
              <>
                <LinkButton href={dashboardHref} variant="primary" onClick={() => setOpen(false)}>Dashboard</LinkButton>
                <LinkButton href="/notifications" variant="outline" onClick={() => setOpen(false)}>Notifications{unread ? ` (${unread})` : ''}</LinkButton>
                <form action="/auth/signout" method="post"><button className="h-10 w-full rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Log out</button></form>
              </>
            ) : (
              <>
                <LinkButton href="/login" variant="outline" onClick={() => setOpen(false)}>Log in</LinkButton>
                <LinkButton href="/register" variant="accent" onClick={() => setOpen(false)}>Sign up</LinkButton>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
