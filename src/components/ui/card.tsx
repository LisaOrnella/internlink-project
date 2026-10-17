import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-slate-200/70 bg-white shadow-card', className)} {...p} />;
}
export function CardHeader({ title, action, className }: { title: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4', className)}>
      <h2 className="font-display text-base font-semibold text-navy-900">{title}</h2>
      {action}
    </div>
  );
}
