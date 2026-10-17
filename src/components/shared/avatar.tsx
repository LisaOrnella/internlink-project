import Image from 'next/image';
import { cn, initials } from '@/lib/utils';

export function Avatar({ name, src, size = 40, className, square }: { name: string; src?: string | null; size?: number; className?: string; square?: boolean }) {
  const shape = square ? 'rounded-xl' : 'rounded-full';
  if (src) {
    return (
      <span className={cn('relative inline-block shrink-0 overflow-hidden bg-slate-100', shape, className)} style={{ width: size, height: size }}>
        <Image src={src} alt={`${name} logo or photo`} fill sizes={`${size}px`} className="object-cover" />
      </span>
    );
  }
  return (
    <span aria-label={name} className={cn('inline-flex shrink-0 items-center justify-center bg-gradient-to-br from-navy-600 to-teal-500 font-semibold text-white', shape, className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials(name)}
    </span>
  );
}
