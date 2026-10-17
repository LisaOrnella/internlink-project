import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buttonClass } from '@/components/ui/button';

export function Pagination({ page, pages, basePath, params }: { page: number; pages: number; basePath: string; params: Record<string, string | undefined> }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v && k !== 'page') sp.set(k, v); });
    sp.set('page', String(p));
    return `${basePath}?${sp.toString()}`;
  };
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
      {page > 1 ? <Link href={href(page - 1)} className={buttonClass('outline', 'sm')}><ChevronLeft size={16} />Previous</Link> : <span className={buttonClass('outline', 'sm', 'pointer-events-none opacity-40')}><ChevronLeft size={16} />Previous</span>}
      <span className="text-sm text-slate-600">Page {page} of {pages}</span>
      {page < pages ? <Link href={href(page + 1)} className={buttonClass('outline', 'sm')}>Next<ChevronRight size={16} /></Link> : <span className={buttonClass('outline', 'sm', 'pointer-events-none opacity-40')}>Next<ChevronRight size={16} /></span>}
    </nav>
  );
}
