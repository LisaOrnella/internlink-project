import { LinkButton } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main id="main" className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-display text-7xl font-extrabold text-teal-500">404</p>
      <h1 className="mt-3 font-display text-2xl font-bold text-navy-900">We couldn&apos;t find that page</h1>
      <p className="mt-2 max-w-md text-slate-600">The page may have moved, or the internship may no longer be available.</p>
      <div className="mt-6 flex gap-3">
        <LinkButton href="/" variant="primary">Back home</LinkButton>
        <LinkButton href="/internships" variant="outline">Browse internships</LinkButton>
      </div>
    </main>
  );
}
