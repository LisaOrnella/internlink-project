'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole, getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { applicationSchema, fieldErrors, reportSchema, studentProfileSchema, validateFile } from '@/lib/validators';
import { slugify, splitList } from '@/lib/utils';
import type { ActionResult } from '@/types/db';

const safeName = (n: string) => n.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
const dbMessage = (m: string) =>
  /duplicate key|unique/i.test(m) ? 'You have already applied to this internship.'
  : /deadline/i.test(m) ? 'The application deadline has passed.'
  : /not open/i.test(m) ? 'This internship is not open for applications.'
  : /row-level security|permission denied/i.test(m) ? 'You do not have permission to do that.'
  : m;

export async function toggleSaveAction(internshipId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(internshipId).success) return { ok: false, message: 'Invalid internship.' };
  const current = await getCurrentUser();
  if (!current || current.profile.role !== 'student') return { ok: false, message: 'Log in as a student to save internships.' };
  const supabase = await createClient();
  const { data: existing } = await supabase.from('saved_internships').select('internship_id').eq('user_id', current.user.id).eq('internship_id', internshipId).maybeSingle();
  const { error } = existing
    ? await supabase.from('saved_internships').delete().eq('user_id', current.user.id).eq('internship_id', internshipId)
    : await supabase.from('saved_internships').insert({ user_id: current.user.id, internship_id: internshipId });
  if (error) return { ok: false, message: dbMessage(error.message) };
  revalidatePath('/dashboard/saved');
  return { ok: true };
}

export async function applyAction(formData: FormData): Promise<ActionResult> {
  const { user } = await requireRole('student');
  const parsed = applicationSchema.safeParse({
    internshipId: formData.get('internshipId'),
    coverLetter: formData.get('coverLetter'),
    useProfileResume: formData.get('useProfileResume') === 'on',
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: 'Please fix the highlighted fields.' };
  const { internshipId, coverLetter, useProfileResume } = parsed.data;

  const supabase = await createClient();
  const file = formData.get('cv') as File | null;
  const fileError = validateFile(file, 'resume');
  if (fileError) return { ok: false, errors: { cv: fileError } };

  let cvPath: string | null = null;
  if (file && file.size > 0) {
    cvPath = `${user.id}/${Date.now()}-${safeName(file.name)}`;
    const { error } = await supabase.storage.from('resumes').upload(cvPath, file, { contentType: file.type, upsert: false });
    if (error) return { ok: false, errors: { cv: 'Could not upload your CV. Please try again.' } };
  } else if (useProfileResume) {
    const { data: sp } = await supabase.from('student_profiles').select('resume_path').eq('user_id', user.id).single();
    cvPath = sp?.resume_path ?? null;
    if (!cvPath) return { ok: false, errors: { cv: 'You have no CV on your profile yet. Upload one below.' } };
  } else {
    return { ok: false, errors: { cv: 'Attach a CV or choose the one saved on your profile.' } };
  }

  const { error } = await supabase.from('applications').insert({ internship_id: internshipId, student_id: user.id, cover_letter: coverLetter, cv_path: cvPath });
  if (error) return { ok: false, message: dbMessage(error.message) };
  revalidatePath('/dashboard', 'layout');
  return { ok: true, message: 'Application submitted! The company has been notified.', redirect: '/dashboard/applications' };
}

export async function withdrawAction(applicationId: string): Promise<ActionResult> {
  const { user } = await requireRole('student');
  if (!z.string().uuid().safeParse(applicationId).success) return { ok: false, message: 'Invalid application.' };
  const supabase = await createClient();
  const { data, error } = await supabase.from('applications').update({ status: 'withdrawn' }).eq('id', applicationId).eq('student_id', user.id).select('id');
  if (error) return { ok: false, message: error.message.includes('still in progress') ? 'This application can no longer be withdrawn.' : dbMessage(error.message) };
  if (!data?.length) return { ok: false, message: 'Application not found.' };
  revalidatePath('/dashboard/applications');
  return { ok: true, message: 'Application withdrawn.' };
}

export async function reportInternshipAction(raw: unknown): Promise<ActionResult> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, message: 'Log in to report a listing.' };
  const parsed = reportSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.from('reports').insert({ internship_id: parsed.data.internshipId, reporter_id: current.user.id, reason: parsed.data.reason });
  if (error) return { ok: false, message: /duplicate/i.test(error.message) ? 'You have already reported this listing.' : dbMessage(error.message) };
  return { ok: true, message: 'Thank you. Our team will review this listing.' };
}

// ---------- profile ----------
async function syncSkills(userId: string, names: string[]) {
  const supabase = await createClient();
  await supabase.from('student_skills').delete().eq('user_id', userId);
  if (!names.length) return;
  await supabase.from('skills').upsert(names.map((n) => ({ name: n, slug: slugify(n) })), { onConflict: 'slug', ignoreDuplicates: true });
  const { data } = await supabase.from('skills').select('id').in('slug', names.map(slugify));
  if (data?.length) await supabase.from('student_skills').insert(data.map((s) => ({ user_id: userId, skill_id: s.id })));
}

export async function saveStudentProfileAction(formData: FormData): Promise<ActionResult> {
  const { user } = await requireRole('student');
  const raw = Object.fromEntries(formData.entries());
  const parsed = studentProfileSchema.safeParse({ ...raw, isPublic: formData.get('isPublic') === 'on' });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: 'Please fix the highlighted fields.' };
  const v = parsed.data;

  const supabase = await createClient();
  const resume = formData.get('resume') as File | null;
  const avatar = formData.get('avatar') as File | null;
  const errs: Record<string, string> = {};
  const rErr = validateFile(resume, 'resume'); if (rErr) errs.resume = rErr;
  const aErr = validateFile(avatar, 'image'); if (aErr) errs.avatar = aErr;
  if (Object.keys(errs).length) return { ok: false, errors: errs };

  let resumePath: string | undefined;
  if (resume && resume.size > 0) {
    resumePath = `${user.id}/${Date.now()}-${safeName(resume.name)}`;
    const { error } = await supabase.storage.from('resumes').upload(resumePath, resume, { contentType: resume.type });
    if (error) return { ok: false, errors: { resume: 'Could not upload your CV. Please try again.' } };
  }
  let avatarUrl: string | undefined;
  if (avatar && avatar.size > 0) {
    const path = `${user.id}/avatar-${Date.now()}.${avatar.type.split('/')[1]}`;
    const { error } = await supabase.storage.from('avatars').upload(path, avatar, { contentType: avatar.type });
    if (error) return { ok: false, errors: { avatar: 'Could not upload your photo.' } };
    avatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
  }

  const { error: e1 } = await supabase.from('profiles').update({ full_name: v.fullName, ...(avatarUrl ? { avatar_url: avatarUrl } : {}) }).eq('id', user.id);
  const { error: e3 } = await supabase.from('student_contacts').update({ phone: v.phone || null }).eq('user_id', user.id);
  const { error: e2 } = await supabase.from('student_profiles').update({
    university: v.university || null, degree_program: v.degreeProgram || null, field_of_study: v.fieldOfStudy || null,
    year_of_study: v.yearOfStudy ?? null, graduation_date: v.graduationDate || null, location: v.location || null, bio: v.bio || null,
    soft_skills: splitList(v.softSkills), languages: splitList(v.languages), preferred_location: v.preferredLocation || null,
    preferred_arrangement: v.preferredArrangement || null, linkedin_url: v.linkedinUrl || null, portfolio_url: v.portfolioUrl || null,
    is_public: v.isPublic, ...(resumePath ? { resume_path: resumePath } : {}),
  }).eq('user_id', user.id);
  if (e1 || e2 || e3) return { ok: false, message: dbMessage((e1 ?? e2 ?? e3)!.message) };
  await syncSkills(user.id, splitList(v.skills));
  revalidatePath('/dashboard', 'layout');
  return { ok: true, message: 'Profile saved.' };
}

const entrySchemas = {
  education: z.object({ institution: z.string().trim().min(2).max(150), qualification: z.string().trim().min(2).max(150), start_year: z.coerce.number().int().min(1950).max(2100).optional().or(z.literal('').transform(() => undefined)), end_year: z.coerce.number().int().min(1950).max(2100).optional().or(z.literal('').transform(() => undefined)) }),
  work_experience: z.object({ company: z.string().trim().min(2).max(150), title: z.string().trim().min(2).max(150), start_date: z.string().optional().or(z.literal('')), end_date: z.string().optional().or(z.literal('')), description: z.string().trim().max(1500).optional() }),
  student_projects: z.object({ title: z.string().trim().min(2).max(150), description: z.string().trim().max(1500).optional(), url: z.string().trim().url().optional().or(z.literal('')) }),
  certifications: z.object({ name: z.string().trim().min(2).max(150), issuer: z.string().trim().max(150).optional(), issued_on: z.string().optional().or(z.literal('')), url: z.string().trim().url().optional().or(z.literal('')) }),
} as const;
export type EntryTable = keyof typeof entrySchemas;

export async function addEntryAction(table: EntryTable, raw: Record<string, unknown>): Promise<ActionResult> {
  const { user } = await requireRole('student');
  const schema = entrySchemas[table];
  if (!schema) return { ok: false, message: 'Invalid section.' };
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: 'Please check the entry.' };
  const clean = Object.fromEntries(Object.entries(parsed.data).map(([k, v]) => [k, v === '' ? null : v]));
  const supabase = await createClient();
  const { error } = await supabase.from(table).insert({ ...clean, user_id: user.id });
  if (error) return { ok: false, message: dbMessage(error.message) };
  revalidatePath('/dashboard/profile');
  return { ok: true, message: 'Added.' };
}

export async function deleteEntryAction(table: EntryTable, id: string): Promise<ActionResult> {
  const { user } = await requireRole('student');
  if (!(table in entrySchemas) || !z.string().uuid().safeParse(id).success) return { ok: false, message: 'Invalid request.' };
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', user.id);
  if (error) return { ok: false, message: dbMessage(error.message) };
  revalidatePath('/dashboard/profile');
  return { ok: true };
}

// ---------- notifications (any signed-in user) ----------
export async function markNotificationsReadAction(id?: string): Promise<ActionResult> {
  const current = await getCurrentUser();
  if (!current) return { ok: false };
  const supabase = await createClient();
  let q = supabase.from('notifications').update({ is_read: true }).eq('user_id', current.user.id).eq('is_read', false);
  if (id) q = q.eq('id', id);
  const { error } = await q;
  if (error) return { ok: false, message: error.message };
  revalidatePath('/', 'layout');
  return { ok: true };
}
