'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form';
import { CATEGORIES, DURATIONS, EDUCATION_LEVELS } from '@/lib/constants';

const KEYS = ['q', 'location', 'category', 'arrangement', 'paid', 'duration', 'education', 'skill', 'sort'] as const;

/** Filters live in the URL so results are shareable and survive refresh. */
export function InternshipFilters({ canRank }: { canRank: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    KEYS.forEach((k) => { const v = String(fd.get(k) ?? '').trim(); if (v) next.set(k, v); });
    router.push(`${pathname}?${next.toString()}`);
  }
  const active = KEYS.filter((k) => k !== 'sort' && sp.get(k)).length;

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card" role="search" aria-label="Filter internships">
      <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input name="q" aria-label="Keyword, title, company or skill" placeholder="Title, company, skill or keyword" defaultValue={sp.get('q') ?? ''} className="pl-10" />
        </div>
        <Input name="location" aria-label="Location" placeholder="Location (e.g. Kigali)" defaultValue={sp.get('location') ?? ''} />
        <div className="flex gap-2">
          <Button type="submit" variant="accent" className="flex-1 md:flex-none">Search</Button>
          <Button type="button" variant="outline" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="more-filters">
            <SlidersHorizontal size={16} />Filters{active > 0 && <span className="rounded-full bg-teal-500 px-1.5 text-xs text-white">{active}</span>}
          </Button>
        </div>
      </div>
      <div id="more-filters" hidden={!open} className="grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select name="category" aria-label="Career category" defaultValue={sp.get('category') ?? ''}>
          <option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </Select>
        <Select name="arrangement" aria-label="Work arrangement" defaultValue={sp.get('arrangement') ?? ''}>
          <option value="">Remote, hybrid or on-site</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option>
        </Select>
        <Select name="paid" aria-label="Compensation" defaultValue={sp.get('paid') ?? ''}>
          <option value="">Paid or unpaid</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option>
        </Select>
        <Select name="duration" aria-label="Duration" defaultValue={sp.get('duration') ?? ''}>
          <option value="">Any duration</option>{DURATIONS.map((d) => <option key={d} value={d}>{d} month{d > 1 ? 's' : ''}</option>)}
        </Select>
        <Select name="education" aria-label="Education level" defaultValue={sp.get('education') ?? ''}>
          <option value="">Any education level</option>{EDUCATION_LEVELS.map((e) => <option key={e}>{e}</option>)}
        </Select>
        <Input name="skill" aria-label="Required skill" placeholder="Required skill (e.g. Python)" defaultValue={sp.get('skill') ?? ''} />
        <Select name="sort" aria-label="Sort by" defaultValue={sp.get('sort') ?? 'newest'}>
          <option value="newest">Newest first</option><option value="deadline">Closing soon</option>
          <option value="relevance" disabled={!canRank}>{canRank ? 'Best match for me' : 'Best match (log in as student)'}</option>
        </Select>
        {active > 0 && <Button type="button" variant="ghost" onClick={() => router.push(pathname)}><X size={16} />Clear all</Button>}
      </div>
    </form>
  );
}
