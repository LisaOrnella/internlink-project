import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const variants = {
  primary: 'bg-navy-800 text-white hover:bg-navy-700 focus-visible:ring-navy-400 shadow-sm',
  accent: 'bg-teal-500 text-white hover:bg-teal-600 focus-visible:ring-teal-300 shadow-sm',
  sun: 'bg-sun-400 text-navy-900 hover:bg-sun-300 focus-visible:ring-sun-200 shadow-sm',
  outline: 'border border-slate-300 bg-white text-navy-800 hover:bg-slate-50 focus-visible:ring-navy-300',
  ghost: 'text-navy-700 hover:bg-navy-50 focus-visible:ring-navy-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300',
} as const;
const sizes = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' } as const;

export function buttonClass(variant: keyof typeof variants = 'primary', size: keyof typeof sizes = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[.98]',
    variants[variant], sizes[size], className,
  );
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants; size?: keyof typeof sizes };
export const Button = React.forwardRef<HTMLButtonElement, Props>(function Button({ variant, size, className, ...props }, ref) {
  return <button ref={ref} className={buttonClass(variant, size, className)} {...props} />;
});

export function LinkButton({ href, variant, size, className, children, ...rest }: {
  href: string; variant?: keyof typeof variants; size?: keyof typeof sizes; className?: string; children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, 'href' | 'className'>) {
  return <Link href={href} className={buttonClass(variant, size, className)} {...rest}>{children}</Link>;
}
