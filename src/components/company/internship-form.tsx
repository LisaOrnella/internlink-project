'use client';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { saveInternshipAction } from '@/actions/company';
import { ARRANGEMENTS, CATEGORIES, DURATIONS, EDUCATION_LEVELS, INTERNSHIP_TYPES } from '@/lib/constants';
import type { Internship } from '@/types/db';

export function InternshipForm({ internship, skills }: { internship?: Internship; skills?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [e, setE] = useState<Record<string, string>>({});
  const [paid, setPaid] = useState(internship?.is_paid ?? false);
  const intent = useRef<'draft' | 'publish'>('draft');
  const i = internship;

  function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    fd.set('intent', intent.current);
    fd.set('isPaid', String(paid));
    start(async () => {
      const res = await saveInternshipAction(i?.id ?? null, fd);
      if (!res.ok) { setE(res.errors ?? {}); toast.error(res.message ?? 'Please fix the highlighted fields.'); return; }
      toast.success(res.message); router.push(res.redirect ?? '/company/internships'); router.refresh();
    });
  }
  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Card><CardHeader title="Basics" /><div className="grid gap-4 p-5 sm:grid-cols-2">
        <Field id="title" label="Internship title" error={e.title} required className="sm:col-span-2"><Input id="title" name="title" defaultValue={i?.title} placeholder="e.g. Frontend Developer Intern" /></Field>
        <Field id="category" label="Career category" error={e.category} required><Select id="category" name="category" defaultValue={i?.category ?? CATEGORIES[0]}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field id="type" label="Internship type"><Select id="type" name="type" defaultValue={i?.type ?? 'full_time'}>{INTERNSHIP_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select></Field>
        <Field id="location" label="Location" error={e.location} required><Input id="location" name="location" defaultValue={i?.location} placeholder="Kigali, Rwanda" /></Field>
        <Field id="arrangement" label="Work arrangement"><Select id="arrangement" name="arrangement" defaultValue={i?.arrangement ?? 'onsite'}>{ARRANGEMENTS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</Select></Field>
      </div></Card>
      <Card><CardHeader title="Details" /><div className="space-y-4 p-5">
        <Field id="description" label="Description" error={e.description} required hint="What is this internship about? (min. 30 characters)"><Textarea id="description" name="description" rows={5} defaultValue={i?.description} /></Field>
        <Field id="responsibilities" label="Responsibilities" hint="One per line" error={e.responsibilities}><Textarea id="responsibilities" name="responsibilities" rows={4} defaultValue={i?.responsibilities ?? ''} /></Field>
        <Field id="requirements" label="Requirements" hint="One per line" error={e.requirements}><Textarea id="requirements" name="requirements" rows={4} defaultValue={i?.requirements ?? ''} /></Field>
        <Field id="skills" label="Skills required" hint="Comma separated — used to match students" error={e.skills}><Input id="skills" name="skills" defaultValue={skills} placeholder="React, TypeScript, Git" /></Field>
        <Field id="benefits" label="Benefits" hint="One per line" error={e.benefits}><Textarea id="benefits" name="benefits" rows={3} defaultValue={i?.benefits ?? ''} /></Field>
      </div></Card>
      <Card><CardHeader title="Compensation & schedule" /><div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field id="isPaid" label="Paid or unpaid"><Select id="isPaid" value={String(paid)} onChange={(ev) => setPaid(ev.target.value === 'true')}><option value="false">Unpaid</option><option value="true">Paid</option></Select></Field>
        {paid && <>
          <Field id="stipendMin" label="Monthly stipend (min)" error={e.stipendMin}><Input id="stipendMin" name="stipendMin" type="number" min={0} defaultValue={i?.stipend_min ?? ''} /></Field>
          <Field id="stipendMax" label="Monthly stipend (max)" error={e.stipendMax}><Input id="stipendMax" name="stipendMax" type="number" min={0} defaultValue={i?.stipend_max ?? ''} /></Field>
          <Field id="currency" label="Currency"><Input id="currency" name="currency" maxLength={3} defaultValue={i?.currency ?? 'RWF'} /></Field></>}
        <Field id="durationMonths" label="Duration" error={e.durationMonths}><Select id="durationMonths" name="durationMonths" defaultValue={String(i?.duration_months ?? 3)}>{DURATIONS.map((d) => <option key={d} value={d}>{d} month{d > 1 ? 's' : ''}</option>)}</Select></Field>
        <Field id="startDate" label="Start date"><Input id="startDate" name="startDate" type="date" defaultValue={i?.start_date ?? ''} /></Field>
        <Field id="deadline" label="Application deadline" error={e.deadline} required><Input id="deadline" name="deadline" type="date" defaultValue={i?.deadline ?? ''} /></Field>
        <Field id="positions" label="Open positions" error={e.positions}><Input id="positions" name="positions" type="number" min={1} defaultValue={i?.positions ?? 1} /></Field>
        <Field id="educationLevel" label="Required education level"><Select id="educationLevel" name="educationLevel" defaultValue={i?.education_level ?? 'Any'}>{EDUCATION_LEVELS.map((l) => <option key={l}>{l}</option>)}</Select></Field>
        <Field id="applicationInstructions" label="Application instructions" className="sm:col-span-2 lg:col-span-3"><Textarea id="applicationInstructions" name="applicationInstructions" rows={3} defaultValue={i?.application_instructions ?? ''} /></Field>
      </div></Card>
      <div className="sticky bottom-4 flex flex-wrap justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" variant="outline" disabled={pending} onClick={() => { intent.current = 'draft'; }} className="bg-white shadow-card">Save as draft</Button>
        <Button type="submit" variant="accent" disabled={pending} onClick={() => { intent.current = 'publish'; }} className="shadow-lift">{pending ? 'Saving…' : i?.status === 'published' ? 'Save & keep published' : 'Publish'}</Button>
      </div>
    </form>
  );
}
