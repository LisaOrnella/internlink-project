'use server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { fieldErrors, loginSchema, newPasswordSchema, registerSchema, resetRequestSchema } from '@/lib/validators';
import { siteUrl } from '@/lib/utils';
import type { ActionResult } from '@/types/db';

async function origin() {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  return host ? `${proto}://${host}` : siteUrl();
}

export async function registerAction(raw: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: 'Please fix the highlighted fields.' };
  const { email, password, fullName, role, companyName } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // The DB trigger only honours 'student' | 'company'; anything else becomes 'student'. Admin is never self-assignable.
      data: { role, full_name: fullName, company_name: role === 'company' ? companyName : undefined },
      emailRedirectTo: `${await origin()}/auth/callback`,
    },
  });
  if (error) {
    const msg = /registered|exists/i.test(error.message) ? 'An account with this email already exists.' : error.message;
    return { ok: false, message: msg };
  }
  // With email confirmation ON there is no session yet; with it OFF the user is signed in immediately.
  if (data.session) return { ok: true, redirect: role === 'company' ? '/company/profile' : '/dashboard/profile' };
  return { ok: true, message: 'Check your inbox to confirm your email address, then log in.', redirect: '/login?registered=1' };
}

export async function loginAction(raw: unknown, next?: string): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    const unconfirmed = error?.message?.toLowerCase().includes('not confirmed');
    return { ok: false, message: unconfirmed ? 'Please confirm your email first — check your inbox.' : 'Incorrect email or password.' };
  }
  const { data: profile } = await supabase.from('profiles').select('role,status').eq('id', data.user.id).single();
  if (profile?.status === 'suspended') {
    await supabase.auth.signOut();
    return { ok: false, message: 'This account has been suspended. Please contact support.' };
  }
  const home = profile?.role === 'admin' ? '/admin' : profile?.role === 'company' ? '/company' : '/dashboard';
  // only allow same-site relative redirects
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : undefined;
  return { ok: true, redirect: safeNext ?? home };
}

export async function requestResetAction(raw: unknown): Promise<ActionResult> {
  const parsed = resetRequestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${await origin()}/auth/callback?next=/reset-password` });
  // Same response whether or not the account exists (prevents account enumeration)
  return { ok: true, message: 'If an account exists for that email, a reset link is on its way.' };
}

export async function updatePasswordAction(raw: unknown): Promise<ActionResult> {
  const parsed = newPasswordSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Your reset link has expired. Please request a new one.' };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: 'Password updated.', redirect: '/login?reset=1' };
}
