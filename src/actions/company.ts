'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getMyCompany, requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { companyProfileSchema, fieldErrors, internshipSchema, noteSchema, statusSchema, validateFile } from '@/lib/validators';
import { slugify, splitList } from '@/lib/utils';
import type { ActionResult } from '@/types/db';

const uuid = z.string().uuid();
const dbMessage = (m: string) => (/row-level security|permission denied/i.test(m) ? 'You do not have permission to do that.' : m);

async function uploadImage(userId: string, file: File | null, prefix: string): Promise<{ url?: string; error?: string }> {
  if (!file || file.size === 0) return {};
  const err = validateFile(file, 'image');
  if (err) return { error: err };
  const supabase = await createClient();
  const path = `${userId}/${prefix}-${Date.now()}.${file.type.split('/')[1]}`;
  const { error } = await supabase.storage.from('company-assets').upload(path, file, { contentType: file.type });
  if (error) return { error: 'Upload failed. Please try again.' };
  return { url: supabase.storage.from('company-assets').getPublicUrl(path).data.publicUrl };
}

export async function saveCompanyProfileAction(formData: FormData): Promise<ActionResult> {
  const { user } = await requireRole('company');
  const parsed = companyProfileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: 'Please fix the highlighted fields.' };
  const v = parsed.data;
  const [logo, cover] = await Promise.all([uploadImage(user.id, formData.get('logo') as File, 'logo'), uploadImage(user.id, formData.get('cover') as File, 'cover')]);
  if (logo.error || cover.error) return { ok: false, errors: { ...(logo.error && { logo: logo.error }), ...(cover.error && { cover: cover.error }) } };

  const supabase = await createClient();
  const { error } = await supabase.from('company_profiles').update({
    name: v.name, industry: v.industry || null, description: v.description || null, website: v.website || null,
    contact_email: v.contactEmail || null, phone: v.phone || null, location: v.location || null, size: v.size || null,
    mission: v.mission || null, culture: v.culture || null,
    social_links: { linkedin: v.linkedin || '', twitter: v.twitter || '', facebook: v.facebook || '' },
    ...(logo.url ? { logo_url: logo.url } : {}), ...(cover.url ? { cover_url: cover.url } : {}),
  }).eq('owner_id', user.id);
  if (error) return { ok: false, message: dbMessage(error.message) };
  revalidatePath('/company', 'layout');
  return { ok: true, message: 'Company profile saved.' };
}

export async function saveInternshipAction(id: string | null, formData: FormData): Promise<ActionResult> {
  const { user } = await requireRole('company');
  if (id && !uuid.safeParse(id).success) return { ok: false, message: 'Invalid internship.' };
  const raw = Object.fromEntries(formData.entries());
  const parsed = internshipSchema.safeParse({ ...raw, isPaid: raw.isPaid === 'true' });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: 'Please fix the highlighted fields.' };
  const v = parsed.data;
  const company = await getMyCompany(user.id);
  if (!company) return { ok: false, message: 'Company profile not found.' };
  if (v.intent === 'publish' && (!company.description || !company.location)) {
    return { ok: false, message: 'Add a description and location to your company profile before publishing.' };
  }

  const supabase = await createClient();
  const row = {
    title: v.title, category: v.category, description: v.description, responsibilities: v.responsibilities || null, requirements: v.requirements || null,
    benefits: v.benefits || null, location: v.location, arrangement: v.arrangement, type: v.type, is_paid: v.isPaid,
    stipend_min: v.isPaid ? v.stipendMin ?? null : null, stipend_max: v.isPaid ? v.stipendMax ?? null : null, currency: v.currency.toUpperCase(),
    duration_months: v.durationMonths, start_date: v.startDate || null, deadline: v.deadline, positions: v.positions,
    education_level: v.educationLevel || null, application_instructions: v.applicationInstructions || null,
    status: v.intent === 'publish' ? 'published' : 'draft',
  };

  let internshipId = id;
  if (id) {
    // Never silently re-open closed/archived listings through an edit: keep their status unless explicitly publishing/drafting
    const { data, error } = await supabase.from('internships').update(row).eq('id', id).select('id');
    if (error) return { ok: false, message: dbMessage(error.message) };
    if (!data?.length) return { ok: false, message: 'Internship not found.' };
  } else {
    const { data, error } = await supabase.from('internships').insert({ ...row, company_id: company.id }).select('id').single();
    if (error || !data) return { ok: false, message: dbMessage(error?.message ?? 'Could not create internship.') };
    internshipId = data.id;
  }

  const names = splitList(v.skills);
  await supabase.from('internship_skills').delete().eq('internship_id', internshipId!);
  if (names.length) {
    await supabase.from('skills').upsert(names.map((n) => ({ name: n, slug: slugify(n) })), { onConflict: 'slug', ignoreDuplicates: true });
    const { data: sk } = await supabase.from('skills').select('id').in('slug', names.map(slugify));
    if (sk?.length) await supabase.from('internship_skills').insert(sk.map((s) => ({ internship_id: internshipId!, skill_id: s.id })));
  }
  revalidatePath('/company/internships');
  revalidatePath('/internships');
  return { ok: true, message: v.intent === 'publish' ? 'Internship published!' : 'Draft saved.', redirect: '/company/internships' };
}

export async function setInternshipStatusAction(id: string, status: 'draft' | 'published' | 'closed' | 'archived'): Promise<ActionResult> {
  await requireRole('company');
  if (!uuid.safeParse(id).success || !['draft', 'published', 'closed', 'archived'].includes(status)) return { ok: false, message: 'Invalid request.' };
  const supabase = await createClient();
  const { data, error } = await supabase.from('internships').update({ status }).eq('id', id).select('id');
  if (error) return { ok: false, message: dbMessage(error.message) };
  if (!data?.length) return { ok: false, message: 'Internship not found.' };
  revalidatePath('/company/internships'); revalidatePath('/internships');
  return { ok: true, message: `Internship ${status === 'published' ? 'published' : status}.` };
}

export async function deleteInternshipAction(id: string): Promise<ActionResult> {
  await requireRole('company');
  if (!uuid.safeParse(id).success) return { ok: false, message: 'Invalid request.' };
  const supabase = await createClient();
  const { count } = await supabase.from('applications').select('id', { count: 'exact', head: true }).eq('internship_id', id);
  if ((count ?? 0) > 0) return { ok: false, message: 'This internship has applications, so it cannot be deleted. Archive it instead.' };
  const { data, error } = await supabase.from('internships').delete().eq('id', id).select('id');
  if (error) return { ok: false, message: dbMessage(error.message) };
  if (!data?.length) return { ok: false, message: 'Internship not found.' };
  revalidatePath('/company/internships'); revalidatePath('/internships');
  return { ok: true, message: 'Internship deleted.' };
}

export async function updateApplicationStatusAction(raw: unknown): Promise<ActionResult> {
  await requireRole('company');
  const parsed = statusSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: 'Invalid status.' };
  const supabase = await createClient();
  const { data, error } = await supabase.from('applications').update({ status: parsed.data.status }).eq('id', parsed.data.applicationId).select('id');
  if (error) return { ok: false, message: /withdrawn/i.test(error.message) ? 'This candidate withdrew their application.' : dbMessage(error.message) };
  if (!data?.length) return { ok: false, message: 'Application not found.' };
  revalidatePath('/company', 'layout');
  return { ok: true, message: 'Status updated. The candidate has been notified.' };
}

export async function addNoteAction(raw: unknown): Promise<ActionResult> {
  const { user } = await requireRole('company');
  const parsed = noteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.from('application_notes').insert({ application_id: parsed.data.applicationId, author_id: user.id, body: parsed.data.body });
  if (error) return { ok: false, message: dbMessage(error.message) };
  revalidatePath(`/company/applications/${parsed.data.applicationId}`);
  return { ok: true, message: 'Note saved (only your team can see it).' };
}

export async function deleteNoteAction(noteId: string, applicationId: string): Promise<ActionResult> {
  await requireRole('company');
  if (!uuid.safeParse(noteId).success) return { ok: false, message: 'Invalid note.' };
  const supabase = await createClient();
  const { error } = await supabase.from('application_notes').delete().eq('id', noteId);
  if (error) return { ok: false, message: dbMessage(error.message) };
  revalidatePath(`/company/applications/${applicationId}`);
  return { ok: true };
}
