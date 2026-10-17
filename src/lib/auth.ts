import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile, Role } from '@/types/db';

/** Verified current user + profile (getUser() validates the token with Supabase). Cached per request. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) return null;
  return { user, profile: profile as Profile };
});

export function homeFor(role: Role) {
  return role === 'admin' ? '/admin' : role === 'company' ? '/company' : '/dashboard';
}

/** Server-side authorization. Layouts and actions call this — hiding links in the UI is not security. */
export async function requireRole(role: Role) {
  const current = await getCurrentUser();
  if (!current) redirect('/login');
  if (current.profile.status === 'suspended') redirect('/suspended');
  if (current.profile.role !== role) redirect(homeFor(current.profile.role));
  return current;
}

export async function getMyCompany(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('company_profiles').select('*').eq('owner_id', userId).single();
  return data;
}
