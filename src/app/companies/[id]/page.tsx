import { notFound } from 'next/navigation';
import { BadgeCheck, Globe, Mail, MapPin, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { INTERNSHIP_SELECT } from '@/lib/queries';
import { Avatar } from '@/components/shared/avatar';
import { SafeImage } from '@/components/shared/safe-image';
import { Card, CardHeader } from '@/components/ui/card';
import { InternshipCard } from '@/components/internships/internship-card';
import { FALLBACK_IMAGES } from '@/lib/constants';
import type { CompanyProfile, Internship } from '@/types/db';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const metadata = { title: 'Company profile' };

export default async function CompanyPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [{ data }, { data: jobs }] = await Promise.all([
    supabase.from('company_profiles').select('*').eq('id', id).maybeSingle(),
    supabase.from('internships').select(INTERNSHIP_SELECT).eq('company_id', id).eq('status', 'published').or(`deadline.is.null,deadline.gte.${today}`).order('published_at', { ascending: false }),
  ]);
  const c = data as CompanyProfile | null;
  if (!c) notFound();
  const links = Object.entries(c.social_links ?? {}).filter(([, v]) => v);

  return (
    <main id="main" className="bg-slate-50 pb-16">
      <div className="relative h-48 sm:h-60"><SafeImage src={c.cover_url} fallback={FALLBACK_IMAGES.cover} alt={`${c.name} cover`} className="object-cover" /><div className="absolute inset-0 bg-navy-900/40" /></div>
      <div className="container-page -mt-12 space-y-6">
        <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <Avatar name={c.name} src={c.logo_url} size={88} square className="ring-4 ring-white" />
          <div className="min-w-0 flex-1"><h1 className="flex items-center gap-2 font-display text-2xl font-bold text-navy-900">{c.name}{c.is_verified && <BadgeCheck className="text-teal-600" size={22} aria-label="Verified company" />}</h1>
            <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">{c.industry && <span>{c.industry}</span>}{c.location && <span className="flex items-center gap-1"><MapPin size={14} />{c.location}</span>}{c.size && <span className="flex items-center gap-1"><Users size={14} />{c.size} employees</span>}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">{c.website && <a href={c.website} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 text-teal-700 hover:underline"><Globe size={14} />Website</a>}{c.contact_email && <a href={`mailto:${c.contact_email}`} className="flex items-center gap-1 text-teal-700 hover:underline"><Mail size={14} />{c.contact_email}</a>}
              {links.map(([k, v]) => <a key={k} href={v} target="_blank" rel="noopener noreferrer nofollow" className="capitalize text-teal-700 hover:underline">{k}</a>)}</div></div>
        </Card>
        {(c.description || c.mission || c.culture) && (
          <Card><CardHeader title="About" /><div className="space-y-4 p-5 text-slate-700">{c.description && <p className="whitespace-pre-line">{c.description}</p>}{c.mission && <div><h3 className="font-display font-semibold text-navy-900">Mission</h3><p className="whitespace-pre-line">{c.mission}</p></div>}{c.culture && <div><h3 className="font-display font-semibold text-navy-900">Culture</h3><p className="whitespace-pre-line">{c.culture}</p></div>}</div></Card>
        )}
        <section aria-labelledby="open"><h2 id="open" className="mb-3 font-display text-xl font-semibold text-navy-900">Open internships ({jobs?.length ?? 0})</h2>
          {jobs?.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{(jobs as Internship[]).map((i) => <InternshipCard key={i.id} internship={i} />)}</div> : <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-600">No open internships right now.</p>}</section>
      </div>
    </main>
  );
}
