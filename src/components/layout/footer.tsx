import Link from 'next/link';
import { Mail, MapPin, Phone, Linkedin, Twitter, Facebook, Instagram } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { CATEGORIES } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="gradient-navy text-slate-300">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo light />
          <p className="max-w-xs text-sm">Your Future Starts With an Internship. InternLink connects university students with companies that want to grow young talent.</p>
          <div className="flex gap-3">
            {[{ i: Linkedin, l: 'LinkedIn' }, { i: Twitter, l: 'X (Twitter)' }, { i: Facebook, l: 'Facebook' }, { i: Instagram, l: 'Instagram' }].map(({ i: Icon, l }) => (
              <a key={l} href="#" aria-label={l} className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-teal-500"><Icon size={18} /></a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Students</h3>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/internships">Find internships</Link></li>
            <li><Link className="hover:text-white" href="/register?role=student">Create a profile</Link></li>
            <li><Link className="hover:text-white" href="/how-it-works">How it works</Link></li>
            <li><Link className="hover:text-white" href="/login">Log in</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Companies</h3>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/for-companies">Why InternLink</Link></li>
            <li><Link className="hover:text-white" href="/register?role=company">Post an internship</Link></li>
            <li><Link className="hover:text-white" href="/login">Company login</Link></li>
          </ul>
          <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-white">Categories</h3>
          <ul className="space-y-2 text-sm">
            {CATEGORIES.slice(0, 4).map((c) => <li key={c}><Link className="hover:text-white" href={`/internships?category=${encodeURIComponent(c)}`}>{c}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Contact</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-teal-300" /> Kigali, Rwanda</li>
            <li className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0 text-teal-300" /> hello@internlink.com</li>
          </ul>
          <p className="mt-3 text-xs text-slate-400">Placeholder contact details — replace before launch.</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} InternLink. All rights reserved.</p>
          <p>Built for Rwanda, ready for the world.</p>
        </div>
      </div>
    </footer>
  );
}
