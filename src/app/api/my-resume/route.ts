import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: sp } = await supabase.from('student_profiles').select('resume_path').eq('user_id', user.id).single();
  if (!sp?.resume_path) return NextResponse.json({ error: 'No CV on file' }, { status: 404 });
  const { data } = await supabase.storage.from('resumes').createSignedUrl(sp.resume_path, 60);
  return data ? NextResponse.redirect(data.signedUrl) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
