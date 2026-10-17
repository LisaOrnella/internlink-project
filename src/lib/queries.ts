import type { SupabaseClient } from '@supabase/supabase-js';
import { PAGE_SIZE } from './constants';
import { matchInternship, type MatchStudent } from './matching';
import type { Internship } from '@/types/db';

export const INTERNSHIP_SELECT =
  '*, company_profiles(id,name,logo_url,is_verified,location), internship_skills(skills(name))';

export type SearchParams = {
  q?: string; location?: string; category?: string; arrangement?: string; paid?: string;
  duration?: string; education?: string; skill?: string; sort?: string; page?: string;
};

/** Remove characters that have meaning inside PostgREST filter strings. */
export const cleanTerm = (s: string) => s.replace(/[,()%*\\:"']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

export function skillNames(i: Internship): string[] {
  return (i.internship_skills ?? []).map((s) => s.skills?.name).filter((n): n is string => !!n);
}

export async function searchInternships(supabase: SupabaseClient, p: SearchParams, student?: MatchStudent | null) {
  const page = Math.max(1, Number.parseInt(p.page ?? '1', 10) || 1);
  const today = new Date().toISOString().slice(0, 10);
  const q = cleanTerm(p.q ?? '');
  const relevance = (p.sort === 'relevance') && !!student;

  let query = supabase
    .from('internships')
    .select(INTERNSHIP_SELECT, { count: 'exact' })
    .eq('status', 'published')
    .or(`deadline.is.null,deadline.gte.${today}`);

  if (q) {
    const ors = [`title.ilike.%${q}%`, `description.ilike.%${q}%`, `category.ilike.%${q}%`];
    const [{ data: cos }, { data: sk }] = await Promise.all([
      supabase.from('company_profiles').select('id').ilike('name', `%${q}%`).limit(50),
      supabase.from('skills').select('id').ilike('name', `%${q}%`).limit(50),
    ]);
    if (cos?.length) ors.push(`company_id.in.(${cos.map((c) => c.id).join(',')})`);
    if (sk?.length) {
      const { data: links } = await supabase.from('internship_skills').select('internship_id').in('skill_id', sk.map((s) => s.id)).limit(500);
      const ids = Array.from(new Set((links ?? []).map((l) => l.internship_id)));
      if (ids.length) ors.push(`id.in.(${ids.join(',')})`);
    }
    query = query.or(ors.join(','));
  }
  const loc = cleanTerm(p.location ?? '');
  if (loc) query = query.ilike('location', `%${loc}%`);
  if (p.category) query = query.eq('category', p.category);
  if (p.arrangement && ['remote', 'hybrid', 'onsite'].includes(p.arrangement)) query = query.eq('arrangement', p.arrangement);
  if (p.paid === 'paid') query = query.eq('is_paid', true);
  if (p.paid === 'unpaid') query = query.eq('is_paid', false);
  if (p.duration) {
    const d = Number.parseInt(p.duration, 10);
    if (d) query = query.eq('duration_months', d);
  }
  if (p.education && p.education !== 'Any') query = query.in('education_level', [p.education, 'Any']);
  if (p.skill) {
    const { data: sk } = await supabase.from('skills').select('id').ilike('name', cleanTerm(p.skill)).limit(5);
    const { data: links } = sk?.length
      ? await supabase.from('internship_skills').select('internship_id').in('skill_id', sk.map((s) => s.id))
      : { data: [] as { internship_id: string }[] };
    const ids = (links ?? []).map((l) => l.internship_id);
    query = query.in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  }

  if (p.sort === 'deadline') query = query.order('deadline', { ascending: true, nullsFirst: false });
  else query = query.order('published_at', { ascending: false });

  if (relevance) {
    // Rank up to 100 candidates by transparent match score, then paginate the ranked list.
    const { data, error } = await query.range(0, 99);
    if (error) throw error;
    const ranked = ((data ?? []) as Internship[])
      .map((i) => ({ i, m: matchInternship(student!, { title: i.title, category: i.category, location: i.location, arrangement: i.arrangement, skills: skillNames(i) }) }))
      .sort((a, b) => (b.m?.score ?? -1) - (a.m?.score ?? -1));
    const from = (page - 1) * PAGE_SIZE;
    return { items: ranked.slice(from, from + PAGE_SIZE).map((r) => r.i), total: ranked.length, page, pages: Math.max(1, Math.ceil(ranked.length / PAGE_SIZE)) };
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  const total = count ?? 0;
  return { items: (data ?? []) as Internship[], total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getStudentMatchProfile(supabase: SupabaseClient, userId: string): Promise<MatchStudent> {
  const [{ data: sp }, { data: sk }] = await Promise.all([
    supabase.from('student_profiles').select('field_of_study,degree_program,location,preferred_location,preferred_arrangement').eq('user_id', userId).single(),
    supabase.from('student_skills').select('skills(name)').eq('user_id', userId),
  ]);
  return {
    skills: ((sk ?? []) as unknown as { skills: { name: string } | null }[]).map((r) => r.skills?.name).filter((n): n is string => !!n),
    fieldOfStudy: sp?.field_of_study, degreeProgram: sp?.degree_program, location: sp?.location,
    preferredLocation: sp?.preferred_location, preferredArrangement: sp?.preferred_arrangement,
  };
}
