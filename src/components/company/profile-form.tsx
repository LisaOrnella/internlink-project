'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Avatar } from '@/components/shared/avatar';
import { saveCompanyProfileAction } from '@/actions/company';
import { validateFile } from '@/lib/validators';
import { COMPANY_SIZES } from '@/lib/constants';
import type { CompanyProfile } from '@/types/db';

export function CompanyProfileForm({ c }: { c: CompanyProfile }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [e, setE] = useState<Record<string, string>>({});
  function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    const local: Record<string, string> = {};
    const l = validateFile(fd.get('logo') as File, 'image'); if (l) local.logo = l;
    const cv = validateFile(fd.get('cover') as File, 'image'); if (cv) local.cover = cv;
    if (Object.keys(local).length) { setE(local); return; }
    start(async () => {
      const res = await saveCompanyProfileAction(fd);
      if (!res.ok) { setE(res.errors ?? {}); toast.error(res.message ?? 'Could not save'); return; }
      setE({}); toast.success(res.message); router.refresh();
    });
  }
  const s = c.social_links ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Card><CardHeader title="Brand" /><div className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="flex items-center gap-4"><Avatar name={c.name} src={c.logo_url} size={64} square /><Field id="logo" label="Company logo" hint="JPG, PNG, WebP · max 2 MB" error={e.logo} className="flex-1"><Input id="logo" name="logo" type="file" accept="image/jpeg,image/png,image/webp" /></Field></div>
        <Field id="cover" label="Cover image" hint="Wide image, max 2 MB" error={e.cover}><Input id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp" /></Field>
        <Field id="name" label="Company name" error={e.name} required><Input id="name" name="name" defaultValue={c.name} required /></Field>
        <Field id="industry" label="Industry" error={e.industry}><Input id="industry" name="industry" defaultValue={c.industry ?? ''} placeholder="Fintech, Agriculture…" /></Field>
        <Field id="size" label="Company size"><Select id="size" name="size" defaultValue={c.size ?? ''}><option value="">Select…</option>{COMPANY_SIZES.map((x) => <option key={x}>{x}</option>)}</Select></Field>
        <Field id="location" label="Location" error={e.location}><Input id="location" name="location" defaultValue={c.location ?? ''} placeholder="Kigali, Rwanda" /></Field>
        <Field id="description" label="Description" hint="What does your company do?" error={e.description} className="sm:col-span-2"><Textarea id="description" name="description" defaultValue={c.description ?? ''} rows={5} /></Field>
      </div></Card>
      <Card><CardHeader title="Contact & links" /><div className="grid gap-4 p-5 sm:grid-cols-2">
        <Field id="website" label="Website" error={e.website}><Input id="website" name="website" type="url" defaultValue={c.website ?? ''} placeholder="https://" /></Field>
        <Field id="contactEmail" label="Contact email" error={e.contactEmail}><Input id="contactEmail" name="contactEmail" type="email" defaultValue={c.contact_email ?? ''} /></Field>
        <Field id="phone" label="Phone" error={e.phone}><Input id="phone" name="phone" type="tel" defaultValue={c.phone ?? ''} /></Field>
        <Field id="linkedin" label="LinkedIn" error={e.linkedin}><Input id="linkedin" name="linkedin" type="url" defaultValue={s.linkedin ?? ''} /></Field>
        <Field id="twitter" label="X / Twitter" error={e.twitter}><Input id="twitter" name="twitter" type="url" defaultValue={s.twitter ?? ''} /></Field>
        <Field id="facebook" label="Facebook" error={e.facebook}><Input id="facebook" name="facebook" type="url" defaultValue={s.facebook ?? ''} /></Field>
      </div></Card>
      <Card><CardHeader title="Mission & culture" /><div className="grid gap-4 p-5">
        <Field id="mission" label="Mission" error={e.mission}><Textarea id="mission" name="mission" defaultValue={c.mission ?? ''} /></Field>
        <Field id="culture" label="Culture" error={e.culture}><Textarea id="culture" name="culture" defaultValue={c.culture ?? ''} /></Field>
      </div></Card>
      <div className="sticky bottom-4 flex justify-end"><Button type="submit" variant="accent" size="lg" disabled={pending} className="shadow-lift">{pending ? 'Saving…' : 'Save company profile'}</Button></div>
    </form>
  );
}
