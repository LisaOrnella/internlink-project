'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/form';
import { addEntryAction, deleteEntryAction, type EntryTable } from '@/actions/student';

type FieldDef = { name: string; label: string; type?: string; area?: boolean };

export function EntriesEditor({ table, title, items, labelKey, subKey, fields }: {
  table: EntryTable; title: string; items: Record<string, unknown>[]; labelKey: string; subKey: string; fields: FieldDef[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries());
    start(async () => {
      const res = await addEntryAction(table, raw);
      if (!res.ok) { setErrors(res.errors ?? {}); toast.error(res.message ?? 'Could not add'); return; }
      setErrors({}); form.reset(); setOpen(false); toast.success(`${title} entry added`); router.refresh();
    });
  }
  function remove(id: string) {
    start(async () => {
      const res = await deleteEntryAction(table, id);
      if (res.ok) { toast.success('Removed'); router.refresh(); } else toast.error(res.message ?? 'Could not remove');
    });
  }
  return (
    <Card>
      <CardHeader title={title} action={<Button type="button" variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}><Plus size={16} />Add</Button>} />
      {items.length === 0 && !open && <p className="p-5 text-sm text-slate-500">Nothing added yet.</p>}
      <ul className="divide-y divide-slate-100">
        {items.map((it) => (
          <li key={String(it.id)} className="flex items-start justify-between gap-3 px-5 py-3 text-sm">
            <div className="min-w-0"><p className="font-medium text-navy-900">{String(it[labelKey] ?? '')}</p><p className="truncate text-slate-500">{String(it[subKey] ?? '')}</p></div>
            <button type="button" onClick={() => remove(String(it.id))} disabled={pending} aria-label={`Remove ${String(it[labelKey] ?? 'entry')}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
          </li>
        ))}
      </ul>
      {open && (
        <form onSubmit={add} className="space-y-3 border-t border-slate-100 p-5" noValidate>
          {fields.map((f) => (
            <Field key={f.name} id={`${table}-${f.name}`} label={f.label} error={errors[f.name]}>
              {f.area ? <Textarea id={`${table}-${f.name}`} name={f.name} rows={3} /> : <Input id={`${table}-${f.name}`} name={f.name} type={f.type ?? 'text'} />}
            </Field>
          ))}
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="primary" disabled={pending}>{pending ? 'Adding…' : 'Add entry'}</Button></div>
        </form>
      )}
    </Card>
  );
}
