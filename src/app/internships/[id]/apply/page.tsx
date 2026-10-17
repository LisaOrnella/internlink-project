import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ApplyForm } from '@/components/student/apply-form';
import { Card } from '@/components/ui/card';
import { daysUntil } from '@/lib/format';

export const metadata = { title: 'Apply' };

export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireRole('student');
  const supabase = await createClient();
  const { data: i } = await supabase.from('internships').select('id,title,status,deadline,company_profiles(name)').eq('id', id).maybeSingle();
  if (!i) notFound();
  const { data: existing } = await supabase.from('applications').select('id').eq('internship_id', id).eq('student_id', user.id).maybeSingle();
  if (existing) redirect('/dashboard/applications');
  const d = daysUntil(i.deadline);
  if (i.status !== 'published' || (d !== null && d < 0)) redirect(`/internships/${id}`);
  const { data: sp } = await supabase.from('student_profiles').select('resume_path').eq('user_id', user.id).single();
  const company = (i.company_profiles as unknown as { name: string } | null)?.name ?? 'the company';

  return (
    <main id="main" className="bg-slate-50 py-10">
      <div className="container-page max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-navy-900 sm:text-3xl">Apply: {i.title}</h1>
        <p className="mb-6 mt-1 text-slate-600">at {company}</p>
        <Card className="p-6"><ApplyForm internshipId={i.id} hasProfileResume={!!sp?.resume_path} /></Card>
      </div>
    </main>
  );
}
