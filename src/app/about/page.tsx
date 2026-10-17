import { SafeImage } from '@/components/shared/safe-image';
import { FALLBACK_IMAGES } from '@/lib/constants';
import { LinkButton } from '@/components/ui/button';

export const metadata = { title: 'About' };
export default function About() {
  return (
    <main id="main"><section className="gradient-hero py-16"><div className="container-page grid items-center gap-10 lg:grid-cols-2">
      <div><h1 className="font-display text-4xl font-bold text-navy-900">Your Future Starts With an Internship.</h1>
        <p className="mt-4 text-lg text-slate-600">InternLink exists to make it easy for students to discover internship opportunities, develop professional skills and connect with companies — and to give companies a simple way to publish internships and manage applications.</p>
        <p className="mt-3 text-slate-600">We are starting in Rwanda and building so that the platform can grow to other markets: locations, currencies and categories are all configurable.</p>
        <LinkButton href="/register" variant="accent" size="lg" className="mt-6">Join InternLink</LinkButton></div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-lift"><SafeImage src={FALLBACK_IMAGES.team} alt="Colleagues working together around a table" className="object-cover" /></div></div></section></main>
  );
}
