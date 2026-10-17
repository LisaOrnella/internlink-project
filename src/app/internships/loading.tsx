import { Skeleton } from '@/components/ui/misc';

export default function Loading() {
  return (
    <div className="container-page grid gap-5 py-10 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-60" />)}
    </div>
  );
}
