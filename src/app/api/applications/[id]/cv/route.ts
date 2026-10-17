import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Authorised CV download. The application row is read with the caller's own session, so Row Level Security
 * only returns it to the applicant, the company that owns the internship, or an admin. The signed URL is then
 * created with the same session, so storage policies are enforced too. Link lifetime: 60 seconds.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: app } = await supabase.from('applications').select('cv_path').eq('id', id).maybeSingle();
  if (!app?.cv_path) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { data, error } = await supabase.storage.from('resumes').createSignedUrl(app.cv_path, 60);
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
