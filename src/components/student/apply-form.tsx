'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/form';
import { applyAction } from '@/actions/student';
import { validateFile } from '@/lib/validators';

export function ApplyForm({ internshipId, hasProfileResume }: { internshipId: string; hasProfileResume: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [useProfile, setUseProfile] = useState(hasProfileResume);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get('cv') as File | null;
    const fileErr = validateFile(file, 'resume');
    if (fileErr) { setErrors({ cv: fileErr }); return; }
    setErrors({});
    start(async () => {
      const res = await applyAction(fd);
      if (!res.ok) { setErrors(res.errors ?? {}); toast.error(res.message ?? 'Please fix the highlighted fields.'); return; }
      toast.success(res.message);
      router.push(res.redirect ?? '/dashboard/applications'); router.refresh();
    });
  }
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <input type="hidden" name="internshipId" value={internshipId} />
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-navy-800">Your CV <span className="text-red-600">*</span></legend>
        {hasProfileResume && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="useProfileResume" checked={useProfile} onChange={(e) => setUseProfile(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-teal-600" />
            Use the CV saved on my profile
          </label>
        )}
        {(!hasProfileResume || !useProfile) && (
          <Field id="cv" label="Upload a CV" hint="PDF, DOC or DOCX · max 5 MB" error={errors.cv}>
            <Input id="cv" name="cv" type="file" accept=".pdf,.doc,.docx,application/pdf" aria-invalid={!!errors.cv} className="file:mr-3 file:rounded-lg file:border-0 file:bg-navy-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-navy-700" />
          </Field>
        )}
        {hasProfileResume && useProfile && errors.cv && <p role="alert" className="text-xs font-medium text-red-600">{errors.cv}</p>}
        {!hasProfileResume && <p className="text-xs text-slate-500">Tip: add a CV to <Link href="/dashboard/profile" className="text-teal-700 underline">your profile</Link> to reuse it.</p>}
      </fieldset>
      <Field id="coverLetter" label="Cover letter / message to the company" hint="Introduce yourself and say why you are a good fit (min. 20 characters)" error={errors.coverLetter} required>
        <Textarea id="coverLetter" name="coverLetter" rows={8} maxLength={5000} aria-invalid={!!errors.coverLetter} />
      </Field>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" variant="accent" size="lg" disabled={pending}>{pending ? 'Submitting…' : 'Submit application'}</Button>
      </div>
    </form>
  );
}
