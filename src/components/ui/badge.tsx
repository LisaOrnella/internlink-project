import { cn } from '@/lib/utils';
import { STATUS_LABEL } from '@/lib/constants';

const tone: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700',
  teal: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  sun: 'bg-sun-100 text-sun-600 ring-1 ring-sun-200',
  navy: 'bg-navy-50 text-navy-700 ring-1 ring-navy-100',
  red: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
};

export function Badge({ children, tone: t = 'slate', className }: { children: React.ReactNode; tone?: keyof typeof tone; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', tone[t], className)}>{children}</span>;
}

const statusTone: Record<string, keyof typeof tone> = {
  submitted: 'navy', under_review: 'sun', shortlisted: 'teal', interview: 'teal', accepted: 'green', rejected: 'red', withdrawn: 'slate',
  draft: 'slate', published: 'green', closed: 'sun', archived: 'slate', removed: 'red', open: 'sun', dismissed: 'slate', actioned: 'green',
  active: 'green', suspended: 'red',
};
export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone[status] ?? 'slate'}>{STATUS_LABEL[status] ?? status}</Badge>;
}
