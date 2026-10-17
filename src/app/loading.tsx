import { Skeleton } from '@/components/ui/misc';

export default function Loading() {
  return (
    <div className="container-page space-y-4 py-10" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-10 w-1/3" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
      </div>
    </div>
  );
}
