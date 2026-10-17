import Link from 'next/link';
import { ArrowRight, BadgeCheck, BellRing, Briefcase, Building2, CheckCircle2, FileSearch, GraduationCap, Search, Send, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { INTERNSHIP_SELECT } from '@/lib/queries';
import { CATEGORIES, FALLBACK_IMAGES } from '@/lib/constants';
import { CATEGORY_ICONS } from '@/lib/icons';
import { InternshipCard } from '@/components/internships/internship-card';
import { LinkButton, Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form';
import { SafeImage } from '@/components/shared/safe-image';
import type { Internship } from '@/types/db';

type Stats = { internships: number; sample_internships: number; companies: number; students: number; applications: number };

export default async function Home() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: statsRaw }, { data: featured }, current] = await Promise.all([
    supabase.rpc('platform_stats'),
    supabase.from('internships').select(INTERNSHIP_SELECT).eq('status', 'published').or(`deadline.is.null,deadline.gte.${today}`).order('published_at', { ascending: false }).limit(6),
    getCurrentUser(),
  ]);
  const stats = (statsRaw ?? null) as Stats | null;
  const jobs = (featured ?? []) as Internship[];
  const usesSample = (stats?.sample_internships ?? 0) > 0;

  return (
    <main id="main">
      {/* HERO */}
      <section className="gradient-hero">
        <div className="container-page grid items-center gap-10 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200"><span className="h-1.5 w-1.5 rounded-full bg-teal-500" />Your Future Starts With an Internship.</p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-navy-900 sm:text-5xl lg:text-6xl">Find Your First Opportunity. <span className="bg-gradient-to-r from-teal-500 to-teal-700 bg-clip-text text-transparent">Build Your Future.</span></h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">InternLink connects university students with companies that want to grow young talent. Build a profile, discover internships that fit your skills, and apply in minutes — or post a role and meet your next intern.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton href="/internships" variant="accent" size="lg">Find an Internship<ArrowRight size={18} /></LinkButton>
              <LinkButton href="/register?role=company" variant="primary" size="lg">Hire an Intern</LinkButton>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-lift"><SafeImage src={FALLBACK_IMAGES.hero} alt="Young professionals collaborating in a bright modern office" className="object-cover" priority /></div>
            <div className="absolute -bottom-5 -left-4 hidden w-56 overflow-hidden rounded-2xl border-4 border-white shadow-lift sm:block"><div className="relative aspect-[4/3]"><SafeImage src={FALLBACK_IMAGES.graduate} alt="Graduates celebrating with caps in the air" className="object-cover" sizes="224px" /></div></div>
            <div className="absolute -right-3 top-6 hidden rounded-2xl bg-white p-3 shadow-lift sm:flex sm:items-center sm:gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-teal-700"><CheckCircle2 size={18} /></span><span className="text-xs font-semibold text-navy-900">Apply in minutes</span></div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="container-page pb-12">
          <form action="/internships" role="search" aria-label="Search internships" className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lift md:grid-cols-[1.4fr_1fr_1fr_auto]">
            <div className="relative"><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><Input name="q" aria-label="Keyword" placeholder="Job title, skill or company" className="pl-10" /></div>
            <Input name="location" aria-label="Location" placeholder="Location (e.g. Kigali)" />
            <Select name="category" aria-label="Category" defaultValue=""><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
            <Button type="submit" variant="accent" size="md" className="h-[42px]">Search</Button>
          </form>
        </div>
      </section>

      {/* STATS */}
      <section aria-label="Platform statistics" className="border-y border-slate-100 bg-white">
        <div className="container-page grid grid-cols-2 gap-6 py-8 text-center md:grid-cols-4">
          {[
            { v: stats?.internships, l: 'Open internships', i: Briefcase }, { v: stats?.companies, l: 'Companies registered', i: Building2 },
            { v: stats?.students, l: 'Students registered', i: GraduationCap }, { v: stats?.applications, l: 'Applications sent', i: Send },
          ].map(({ v, l, i: Icon }) => (
            <div key={l}><Icon className="mx-auto text-teal-600" size={22} /><p className="mt-1 font-display text-3xl font-bold text-navy-900">{v ?? '—'}</p><p className="text-sm text-slate-500">{l}</p></div>
          ))}
        </div>
        {usesSample && <p className="pb-4 text-center text-xs text-slate-500">Live counts from our database. {stats!.sample_internships} of the open internships and the companies behind them are <strong>sample data</strong> used for demonstration.</p>}
      </section>

      {/* FEATURED */}
      <section className="section bg-slate-50">
        <div className="container-page">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-3xl font-bold text-navy-900">Featured internships</h2><p className="mt-1 text-slate-600">The newest opportunities, fresh from our partner companies.</p></div><Link href="/internships" className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:underline">View all<ArrowRight size={16} /></Link></div>
          {jobs.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{jobs.map((i) => <InternshipCard key={i.id} internship={i} />)}</div>
            : <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-600">No internships are published yet. Companies can <Link href="/register?role=company" className="font-semibold text-teal-700 underline">post the first one</Link>.</p>}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="container-page">
          <h2 className="text-center font-display text-3xl font-bold text-navy-900">How InternLink works</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[{ i: UserPlus, t: '1. Create your profile', d: 'Add your studies, skills and CV once. Companies see a clear picture of who you are.' },
              { i: FileSearch, t: '2. Discover & apply', d: 'Search by skill, location or category, then apply with a cover letter and your CV.' },
              { i: BellRing, t: '3. Track your progress', d: 'Follow every application from Submitted to Accepted and get notified at each step.' }].map(({ i: Icon, t, d }) => (
              <div key={t} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-navy-700 to-teal-500 text-white"><Icon size={22} /></span><h3 className="mt-4 font-display text-lg font-semibold text-navy-900">{t}</h3><p className="mt-1 text-slate-600">{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section bg-slate-50">
        <div className="container-page">
          <h2 className="text-center font-display text-3xl font-bold text-navy-900">Popular career categories</h2>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {CATEGORIES.map((c) => { const Icon = CATEGORY_ICONS[c]!; return (
              <Link key={c} href={`/internships?category=${encodeURIComponent(c)}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lift">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition group-hover:bg-teal-500 group-hover:text-white"><Icon size={22} /></span>
                <p className="mt-3 font-display font-semibold text-navy-900">{c}</p></Link>); })}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="section">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          {[{ t: 'For students', c: 'bg-navy-900 text-white', ic: 'text-teal-300', img: FALLBACK_IMAGES.coding, alt: 'Student coding on a laptop', pts: ['One profile, unlimited applications', 'Skill-based recommendations that explain why', 'Save internships and never miss a deadline', 'Real-time updates on every application'], cta: { h: '/register?role=student', l: 'Create student profile' } },
            { t: 'For employers', c: 'bg-teal-700 text-white', ic: 'text-sun-300', img: FALLBACK_IMAGES.team, alt: 'Team meeting in a modern office', pts: ['Publish internships in minutes', 'Review applicants with CVs and cover letters', 'Shortlist, interview and decide in one place', 'Private notes your candidates never see'], cta: { h: '/register?role=company', l: 'Post an internship' } }].map((b) => (
            <div key={b.t} className={`overflow-hidden rounded-3xl ${b.c}`}>
              <div className="relative aspect-[16/7]"><SafeImage src={b.img} alt={b.alt} className="object-cover opacity-80" /><div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" /></div>
              <div className="p-7"><h3 className="font-display text-2xl font-bold">{b.t}</h3><ul className="mt-4 space-y-2">{b.pts.map((p) => <li key={p} className="flex gap-2"><BadgeCheck size={20} className={`mt-0.5 shrink-0 ${b.ic}`} />{p}</li>)}</ul>
                <LinkButton href={b.cta.h} variant="sun" size="lg" className="mt-6">{b.cta.l}</LinkButton></div>
            </div>))}
        </div>
      </section>

      {/* FINAL CTA */}
      {!current && (
        <section className="gradient-navy py-16 text-center text-white"><div className="container-page">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Ready to start?</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-300">Students: create your profile and apply today. Companies: post your first internship for free.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3"><LinkButton href="/register?role=student" variant="accent" size="lg">I&apos;m a student</LinkButton><LinkButton href="/register?role=company" variant="sun" size="lg">I&apos;m hiring</LinkButton></div>
        </div></section>
      )}
    </main>
  );
}
