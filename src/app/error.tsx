'use client';
import { useEffect } from 'react';
import { Button, LinkButton } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main id="main" className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="font-display text-2xl font-bold text-navy-900">Something went wrong</h1>
      <p className="mt-2 max-w-md text-slate-600">An unexpected error occurred. You can try again, or head back to the homepage.</p>
      {error.digest && <p className="mt-1 text-xs text-slate-400">Reference: {error.digest}</p>}
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <LinkButton href="/" variant="outline">Home</LinkButton>
      </div>
    </main>
  );
}
