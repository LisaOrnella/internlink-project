'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types/db';

const uuid = z.string().uuid();
// Every action re-checks the admin role on the server; RLS + triggers enforce it again in the database.

export async function setAccountStatusAction(userId: string, status: 'active' | 'suspended'): Promise<ActionResult> {
  const { user } = await requireRole('admin');
  if (!uuid.safeParse(userId).success || !['active', 'suspended'].includes(status)) return { ok: false, message: 'Invalid request.' };
  if (userId === user.id) return { ok: false, message: 'You cannot suspend your own account.' };
  const supabase = await createClient();
  const { data: target } = await supabase.from('profiles').select('role').eq('id', userId).single();
  if (target?.role === 'admin') return { ok: false, message: 'Administrator accounts cannot be suspended here.' };
  const { data, error } = await supabase.from('profiles').update({ status }).eq('id', userId).select('id');
  if (error || !data?.length) return { ok: false, message: error?.message ?? 'User not found.' };
  await supabase.rpc('log_audit', { p_action: status === 'suspended' ? 'suspend_user' : 'reactivate_user', p_entity: 'profile', p_entity_id: userId, p_details: {} });
  revalidatePath('/admin', 'layout');
  return { ok: true, message: status === 'suspended' ? 'Account suspended.' : 'Account reactivated.' };
}

export async function setCompanyVerifiedAction(companyId: string, verified: boolean): Promise<ActionResult> {
  await requireRole('admin');
  if (!uuid.safeParse(companyId).success) return { ok: false, message: 'Invalid request.' };
  const supabase = await createClient();
  const { data, error } = await supabase.from('company_profiles').update({ is_verified: verified }).eq('id', companyId).select('id');
  if (error || !data?.length) return { ok: false, message: error?.message ?? 'Company not found.' };
  await supabase.rpc('log_audit', { p_action: verified ? 'verify_company' : 'unverify_company', p_entity: 'company', p_entity_id: companyId, p_details: {} });
  revalidatePath('/admin/companies');
  return { ok: true, message: verified ? 'Company verified.' : 'Verification removed.' };
}

export async function moderateInternshipAction(id: string, action: 'remove' | 'restore'): Promise<ActionResult> {
  await requireRole('admin');
  if (!uuid.safeParse(id).success) return { ok: false, message: 'Invalid request.' };
  const supabase = await createClient();
  const { data, error } = await supabase.from('internships').update({ status: action === 'remove' ? 'removed' : 'draft' }).eq('id', id).select('id');
  if (error || !data?.length) return { ok: false, message: error?.message ?? 'Listing not found.' };
  await supabase.rpc('log_audit', { p_action: `${action}_listing`, p_entity: 'internship', p_entity_id: id, p_details: {} });
  revalidatePath('/admin', 'layout'); revalidatePath('/internships');
  return { ok: true, message: action === 'remove' ? 'Listing removed from the platform.' : 'Listing restored as a draft (the company can republish).' };
}

/** Approve a report = take action (remove the listing). Reject = dismiss it and keep the listing. */
export async function resolveReportAction(reportId: string, decision: 'approve' | 'reject'): Promise<ActionResult> {
  const { user } = await requireRole('admin');
  if (!uuid.safeParse(reportId).success) return { ok: false, message: 'Invalid request.' };
  const supabase = await createClient();
  const { data: report } = await supabase.from('reports').select('id,internship_id,status').eq('id', reportId).single();
  if (!report) return { ok: false, message: 'Report not found.' };
  if (report.status !== 'open') return { ok: false, message: 'This report was already handled.' };
  if (decision === 'approve') {
    const { error } = await supabase.from('internships').update({ status: 'removed' }).eq('id', report.internship_id);
    if (error) return { ok: false, message: error.message };
  }
  const { error } = await supabase.from('reports').update({ status: decision === 'approve' ? 'actioned' : 'dismissed', resolved_by: user.id }).eq('id', reportId);
  if (error) return { ok: false, message: error.message };
  await supabase.rpc('log_audit', { p_action: `report_${decision}`, p_entity: 'report', p_entity_id: reportId, p_details: { internship_id: report.internship_id } });
  revalidatePath('/admin', 'layout'); revalidatePath('/internships');
  return { ok: true, message: decision === 'approve' ? 'Report approved — listing removed.' : 'Report rejected — listing kept.' };
}
