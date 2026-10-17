import { Suspense } from 'react';
import { SearchX } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { getStudentMatchProfile, searchInternships, skillNames, type SearchParams } from '@/lib/queries';
import { matchInternship } from '@/lib/matching';
import { InternshipFilters } from '@/components/internships/filters';
import { InternshipCard } from '@/components/internships/internship-card';
import { Pagination } from '@/components/internships/pagination';
import { EmptyState } from '@/components/ui/misc';
import { LinkButton } from '@/components/ui/button';

export const metadata = { title: 'Find Internships' };

export default async function InternshipsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const current = await getCurrentUser();
  const isStudent = current?.profile.role === 'student';
  const student = isStudent ? await getStudentMatchProfile(supabase, current!.user.id) : null;

  const { items, total, page, pages } = await searchInternships(supabase, params, student);

  let savedIds = new Set<string>();
  if (isStudent && items.length) {
    const { data } = await supabase.from('saved_internships').select('internship_id').eq('user_id', current!.user.id).in('internship_id', items.map((i) => i.id));
    savedIds = new Set((data ?? []).map((r) => r.internship_id));
  }

  return (
    <main id="main" className="bg-slate-50">
      <section className="gradient-navy py-10 text-white">
        <div className="container-page">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Find your internship</h1>
          <p className="mt-2 max-w-2xl text-slate-300">Search opportunities across Rwanda and remote roles. Filters are saved in the address bar so you can share a search.</p>
        </div>
      </section>
      <div className="container-page -mt-6 pb-16">
        <Suspense><InternshipFilters canRank={isStudent} /></Suspense>
        <p className="mb-4 mt-6 text-sm text-slate-600" aria-live="polite">
          {total === 0 ? 'No internships found' : `${total} internship${total === 1 ? '' : 's'} found`}
          {params.sort === 'relevance' && !isStudent && ' — log in as a student to rank by match'}
        </p>
        {items.length === 0 ? (
          <EmptyState icon={<SearchX />} title="No internships match your search" description="Try removing a filter, checking your spelling, or searching a broader location."
            action={<LinkButton href="/internships" variant="primary">Clear filters</LinkButton>} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((i) => (
              <InternshipCard key={i.id} internship={i} saved={isStudent ? savedIds.has(i.id) : null}
                match={student ? matchInternship(student, { title: i.title, category: i.category, location: i.location, arrangement: i.arrangement, skills: skillNames(i) }) : null} />
            ))}
          </div>
        )}
        <Pagination page={page} pages={pages} basePath="/internships" params={params as Record<string, string | undefined>} />
      </div>
    </main>
  );
}
