import { LinkButton } from '@/components/ui/button';

export const metadata = { title: 'How It Works' };
const steps = [
  { t: 'Students', items: ['Create a free account and choose "student".', 'Complete your profile: studies, skills, projects and a CV.', 'Search and filter internships; save the ones you like.', 'Apply with a cover letter and your CV. Track every status change.'] },
  { t: 'Companies', items: ['Create a free account and choose "company".', 'Complete your company profile with logo, description and links.', 'Post an internship — save as a draft or publish immediately.', 'Review applicants, add private notes, and move candidates to Shortlisted, Interview or Accepted.'] },
];
export default function HowItWorks() {
  return (
    <main id="main"><section className="gradient-hero py-16"><div className="container-page"><h1 className="font-display text-4xl font-bold text-navy-900">How InternLink works</h1><p className="mt-2 max-w-2xl text-lg text-slate-600">Two simple journeys, one shared goal: great first experiences.</p></div></section>
      <section className="section"><div className="container-page grid gap-8 md:grid-cols-2">{steps.map((s) => (
        <div key={s.t} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-card"><h2 className="font-display text-2xl font-bold text-navy-900">{s.t}</h2>
          <ol className="mt-4 space-y-4">{s.items.map((it, n) => <li key={it} className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500 font-bold text-white">{n + 1}</span><span className="pt-0.5 text-slate-700">{it}</span></li>)}</ol></div>))}</div>
        <div className="container-page mt-10 flex flex-wrap justify-center gap-3"><LinkButton href="/register?role=student" variant="accent" size="lg">Join as a student</LinkButton><LinkButton href="/register?role=company" variant="primary" size="lg">Join as a company</LinkButton></div></section></main>
  );
}
