import { Logo } from '@/components/shared/logo';
import { SafeImage } from '@/components/shared/safe-image';
import { FALLBACK_IMAGES } from '@/lib/constants';

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main id="main" className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md space-y-6">
          <Logo />
          <div>
            <h1 className="font-display text-2xl font-bold text-navy-900 sm:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
      <div className="relative hidden lg:block">
        <SafeImage src={FALLBACK_IMAGES.graduate} alt="Smiling university graduates celebrating" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-navy-900/30 to-transparent" />
        <p className="absolute bottom-10 left-10 right-10 font-display text-3xl font-bold leading-tight text-white">Your Future Starts With an Internship.</p>
      </div>
    </main>
  );
}
