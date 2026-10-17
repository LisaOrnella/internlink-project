import Link from 'next/link';
import { cn } from '@/lib/utils';

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label="InternLink logo" className="shrink-0">
      <defs>
        <linearGradient id="il-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0b1c42" /><stop offset="1" stopColor="#1c3a75" /></linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#il-g)" />
      <path d="M13 12v16" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M13 20c0-5 4-8 9-8s6 3 6 5-2 4-6 4h-3" fill="none" stroke="#2dbda1" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28" cy="28" r="3" fill="#ffab24" />
    </svg>
  );
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn('inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400', className)} aria-label="InternLink home">
      <LogoMark />
      <span className={cn('font-display text-xl font-bold tracking-tight', light ? 'text-white' : 'text-navy-900')}>
        Intern<span className="text-teal-500">Link</span>
      </span>
    </Link>
  );
}
