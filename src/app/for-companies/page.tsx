import { ClipboardList, Filter, ShieldCheck, Users } from 'lucide-react';
import { LinkButton } from '@/components/ui/button';

export const metadata = { title: 'For Companies' };
const feats = [
  { i: ClipboardList, t: 'Post in minutes', d: 'A guided form covers description, requirements, skills, stipend, deadline and positions. Save drafts until you are ready.' },
  { i: Users, t: 'Manage applicants', d: 'See every applicant with CV and cover letter, and move them through Under Review, Shortlisted, Interview, Accepted or Rejected.' },
  { i: Filter, t: 'Search & filter', d: 'Find applicants by name, status or internship so your pipeline stays organised.' },
  { i: ShieldCheck, t: 'Private & secure', d: 'CVs are stored privately and only the company that received an application can open it. Your internal notes are never visible to students.' },
];
export default function ForCompanies() {
  return (
    <main id="main"><section className="gradient-navy py-16 text-white"><div className="container-page"><h1 className="font-display text-4xl font-bold">Hire your next intern</h1><p className="mt-2 max-w-2xl text-lg text-slate-300">Reach motivated university students and manage the whole process from one dashboard.</p><LinkButton href="/register?role=company" variant="sun" size="lg" className="mt-6">Post an internship</LinkButton></div></section>
      <section className="section"><div className="container-page grid gap-6 sm:grid-cols-2">{feats.map(({ i: Icon, t, d }) => (
        <div key={t} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600"><Icon size={22} /></span><h2 className="mt-3 font-display text-lg font-semibold text-navy-900">{t}</h2><p className="mt-1 text-slate-600">{d}</p></div>))}</div></section></main>
  );
}
