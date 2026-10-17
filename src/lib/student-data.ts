import type { SupabaseClient } from '@supabase/supabase-js';
import { profileCompletion } from './matching';

export async function getStudentCompletion(supabase: SupabaseClient, userId: string) {
  const [{ data: sp }, { data: p }, { count: skills }, { count: edu }, { data: contact }] = await Promise.all([
    supabase.from('student_profiles').select('*').eq('user_id', userId).single(),
    supabase.from('profiles').select('full_name,avatar_url').eq('id', userId).single(),
    supabase.from('student_skills').select('skill_id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('education').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('student_contacts').select('phone').eq('user_id', userId).maybeSingle(),
  ]);
  const result = profileCompletion({
    'Full name': p?.full_name, 'Profile photo': p?.avatar_url, 'Phone number': contact?.phone, University: sp?.university,
    'Degree program': sp?.degree_program, 'Field of study': sp?.field_of_study, 'Year of study': sp?.year_of_study,
    'Graduation date': sp?.graduation_date, Location: sp?.location, Biography: sp?.bio, Skills: skills ? ['x'] : [],
    'Education history': edu ? ['x'] : [], 'CV / resume': sp?.resume_path, 'LinkedIn or portfolio': sp?.linkedin_url || sp?.portfolio_url,
  });
  return { ...result, profile: sp, phone: contact?.phone ?? null };
}
