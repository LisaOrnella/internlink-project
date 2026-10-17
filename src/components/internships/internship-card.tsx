import Link from 'next/link';
import { Calendar, Clock, MapPin, Wallet, BadgeCheck, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/shared/avatar';
import { arrangementLabel, deadlineText, formatDate, formatStipend, timeAgo, typeLabel } from '@/lib/format';
import { skillNames } from '@/lib/queries';
import type { Internship } from '@/types/db';
import type { MatchResult } from '@/lib/matching';
import { SaveButton } from './save-button';

export function InternshipCard({ internship: i, match, saved }: { internship: Internship; match?: MatchResult; saved?: boolean | null }) {
  const company = i.company_profiles;
  const skills = skillNames(i).slice(0, 3);
  return (
    <Card className="group relative flex h-full flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start gap-3">
        <Avatar name={company?.name ?? 'Company'} src={company?.logo_url} size={48} square />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug text-navy-900">
            <Link href={`/internships/${i.id}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">{i.title}</Link>
          </h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-slate-600">
            {company?.name}{company?.is_verified && <BadgeCheck size={14} className="text-teal-600" aria-label="Verified company" />}
          </p>
        </div>
        {saved !== undefined && saved !== null && <div className="relative z-10"><SaveButton internshipId={i.id} initialSaved={saved} compact /></div>}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Badge tone="navy">{arrangementLabel(i.arrangement)}</Badge>
        <Badge>{typeLabel(i.type)}</Badge>
        <Badge tone={i.is_paid ? 'teal' : 'slate'}>{i.is_paid ? 'Paid' : 'Unpaid'}</Badge>
        {i.is_sample && <Badge tone="sun">Sample listing</Badge>}
      </div>

      <dl className="mt-4 space-y-1.5 text-sm text-slate-600">
        <div className="flex items-center gap-2"><MapPin size={15} className="text-slate-400" /><dt className="sr-only">Location</dt><dd>{i.location}</dd></div>
        <div className="flex items-center gap-2"><Wallet size={15} className="text-slate-400" /><dt className="sr-only">Compensation</dt><dd>{formatStipend(i)}</dd></div>
        <div className="flex items-center gap-2"><Calendar size={15} className="text-slate-400" /><dt className="sr-only">Deadline</dt><dd>Apply by {formatDate(i.deadline)} · <span className="font-medium text-navy-700">{deadlineText(i.deadline)}</span></dd></div>
      </dl>

      {match && match.reasons.length > 0 && (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1.5 text-xs text-teal-800">
          <Sparkles size={14} className="mt-0.5 shrink-0" /><span><strong>{match.score}% match</strong> · {match.reasons[0]}</span>
        </p>
      )}

      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-slate-500">
        <div className="flex flex-wrap gap-1">{skills.map((s) => <span key={s} className="rounded-md bg-slate-100 px-1.5 py-0.5">{s}</span>)}</div>
        <span className="flex shrink-0 items-center gap-1"><Clock size={12} />{i.published_at ? timeAgo(i.published_at) : 'New'}</span>
      </div>
    </Card>
  );
}
