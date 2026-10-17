'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Avatar } from '@/components/shared/avatar';
import { saveStudentProfileAction } from '@/actions/student';
import { validateFile } from '@/lib/validators';
import type { StudentProfile } from '@/types/db';

export function StudentProfileForm({ fullName, email, avatarUrl, skills, sp, phone }: {
  fullName: string; email: string; avatarUrl: string | null; skills: string; sp: StudentProfile | null; phone: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const local: Record<string, string> = {};
    const r = validateFile(fd.get('resume') as File, 'resume'); if (r) local.resume = r;
    const a = validateFile(fd.get('avatar') as File, 'image'); if (a) local.avatar = a;
    if (Object.keys(local).length) { setErrors(local); return; }
    start(async () => {
      const res = await saveStudentProfileAction(fd);
      if (!res.ok) { setErrors(res.errors ?? {}); toast.error(res.message ?? 'Could not save profile'); return; }
      setErrors({}); toast.success(res.message); router.refresh();
    });
  }
  const e = errors;
  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Card>
        <CardHeader title="Personal details" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="flex items-center gap-4 sm:col-span-2"><Avatar name={fullName} src={avatarUrl} size={64} />
            <Field id="avatar" label="Profile picture" hint="JPG, PNG or WebP · max 2 MB" error={e.avatar} className="flex-1"><Input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" /></Field></div>
          <Field id="fullName" label="Full name" error={e.fullName} required><Input id="fullName" name="fullName" defaultValue={fullName} required /></Field>
          <Field id="email" label="Email" hint="Your login email — change it from account settings"><Input id="email" value={email} readOnly disabled /></Field>
          <Field id="phone" label="Phone number" error={e.phone}><Input id="phone" name="phone" type="tel" defaultValue={phone ?? ''} placeholder="+250 7XX XXX XXX" /></Field>
          <Field id="location" label="Location" error={e.location}><Input id="location" name="location" defaultValue={sp?.location ?? ''} placeholder="Kigali, Rwanda" /></Field>
          <Field id="bio" label="Short professional biography" hint="Up to 1,500 characters" error={e.bio} className="sm:col-span-2"><Textarea id="bio" name="bio" defaultValue={sp?.bio ?? ''} maxLength={1500} /></Field>
        </div>
      </Card>
      <Card>
        <CardHeader title="Education" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field id="university" label="University or college" error={e.university}><Input id="university" name="university" defaultValue={sp?.university ?? ''} /></Field>
          <Field id="degreeProgram" label="Degree program" error={e.degreeProgram}><Input id="degreeProgram" name="degreeProgram" defaultValue={sp?.degree_program ?? ''} placeholder="BSc Information Technology" /></Field>
          <Field id="fieldOfStudy" label="Field of study" error={e.fieldOfStudy}><Input id="fieldOfStudy" name="fieldOfStudy" defaultValue={sp?.field_of_study ?? ''} placeholder="Software engineering" /></Field>
          <Field id="yearOfStudy" label="Year of study" error={e.yearOfStudy}><Input id="yearOfStudy" name="yearOfStudy" type="number" min={1} max={10} defaultValue={sp?.year_of_study ?? ''} /></Field>
          <Field id="graduationDate" label="Expected graduation" error={e.graduationDate}><Input id="graduationDate" name="graduationDate" type="date" defaultValue={sp?.graduation_date ?? ''} /></Field>
        </div>
      </Card>
      <Card>
        <CardHeader title="Skills & preferences" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field id="skills" label="Technical skills" hint="Comma separated, e.g. Python, SQL, Figma — used for matching" error={e.skills} className="sm:col-span-2"><Input id="skills" name="skills" defaultValue={skills} /></Field>
          <Field id="softSkills" label="Soft skills" hint="Comma separated" error={e.softSkills}><Input id="softSkills" name="softSkills" defaultValue={sp?.soft_skills?.join(', ') ?? ''} /></Field>
          <Field id="languages" label="Languages" hint="e.g. Kinyarwanda, English, French" error={e.languages}><Input id="languages" name="languages" defaultValue={sp?.languages?.join(', ') ?? ''} /></Field>
          <Field id="preferredLocation" label="Preferred location" error={e.preferredLocation}><Input id="preferredLocation" name="preferredLocation" defaultValue={sp?.preferred_location ?? ''} placeholder="Kigali" /></Field>
          <Field id="preferredArrangement" label="Preferred work arrangement">
            <Select id="preferredArrangement" name="preferredArrangement" defaultValue={sp?.preferred_arrangement ?? ''}><option value="">No preference</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></Select></Field>
        </div>
      </Card>
      <Card>
        <CardHeader title="Links & CV" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field id="linkedinUrl" label="LinkedIn profile" error={e.linkedinUrl}><Input id="linkedinUrl" name="linkedinUrl" type="url" defaultValue={sp?.linkedin_url ?? ''} placeholder="https://linkedin.com/in/…" /></Field>
          <Field id="portfolioUrl" label="GitHub or portfolio" error={e.portfolioUrl}><Input id="portfolioUrl" name="portfolioUrl" type="url" defaultValue={sp?.portfolio_url ?? ''} placeholder="https://github.com/…" /></Field>
          <Field id="resume" label="CV / resume" hint="PDF, DOC or DOCX · max 5 MB · stored privately" error={e.resume} className="sm:col-span-2">
            <Input id="resume" name="resume" type="file" accept=".pdf,.doc,.docx,application/pdf" />
            {sp?.resume_path && <a href="/api/my-resume" className="mt-1 inline-flex items-center gap-1.5 text-sm text-teal-700 underline"><FileText size={14} />View current CV</a>}
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2"><input type="checkbox" name="isPublic" defaultChecked={sp?.is_public ?? true} className="h-4 w-4 rounded border-slate-300 text-teal-600" />Make my profile visible to signed-in companies (your CV is never public)</label>
        </div>
      </Card>
      <div className="sticky bottom-4 flex justify-end"><Button type="submit" variant="accent" size="lg" disabled={pending} className="shadow-lift">{pending ? 'Saving…' : 'Save profile'}</Button></div>
    </form>
  );
}
