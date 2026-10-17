/**
 * Transparent, rule-based matching. NOT machine learning.
 * Score is computed only from data the student and the listing actually contain.
 * Max 100 points:
 *   skills overlap   60  (share of the listing's required skills the student lists)
 *   field of study   15  (study field/degree text mentions the category or a title word)
 *   location         10  (preferred location or home location matches, or listing is remote)
 *   arrangement      10  (matches the student's preferred arrangement)
 *   category         5   (category word appears in field of study)
 * If the listing declares no skills, the skills portion is not scored and the total is rescaled.
 */
export type MatchStudent = {
  skills: string[];
  fieldOfStudy?: string | null;
  degreeProgram?: string | null;
  location?: string | null;
  preferredLocation?: string | null;
  preferredArrangement?: string | null;
};
export type MatchInternship = {
  title: string;
  category: string;
  location: string;
  arrangement: string;
  skills: string[];
};
export type MatchResult = { score: number; reasons: string[]; matchedSkills: string[] } | null;

const norm = (s: string) => s.toLowerCase().trim();
const words = (s: string) => norm(s).split(/[^a-z0-9+#.]+/).filter((w) => w.length > 2);

export function matchInternship(student: MatchStudent, job: MatchInternship): MatchResult {
  const have = new Set(student.skills.map(norm));
  const needed = job.skills.map(norm);
  const matchedSkills = job.skills.filter((s) => have.has(norm(s)));

  const hasSignal =
    student.skills.length > 0 || !!student.fieldOfStudy || !!student.degreeProgram ||
    !!student.preferredLocation || !!student.location || !!student.preferredArrangement;
  if (!hasSignal) return null; // nothing to compare — don't invent a score

  let earned = 0;
  let max = 0;
  const reasons: string[] = [];

  if (needed.length > 0) {
    max += 60;
    earned += Math.round((matchedSkills.length / needed.length) * 60);
    if (matchedSkills.length > 0) {
      reasons.push(`Matches ${matchedSkills.length} of ${needed.length} required skill${needed.length > 1 ? 's' : ''}: ${matchedSkills.join(', ')}`);
    }
  }

  const study = norm([student.fieldOfStudy, student.degreeProgram].filter(Boolean).join(' '));
  if (study) {
    max += 15;
    const jobWords = new Set([...words(job.category), ...words(job.title)].filter((w) => !['and', 'the', 'intern'].includes(w)));
    const hit = words(study).some((w) => jobWords.has(w));
    if (hit) {
      earned += 15;
      reasons.push('Related to your field of study');
    }
    max += 5;
    if (norm(job.category).split(' ').some((w) => w.length > 3 && study.includes(w))) earned += 5;
  }

  const loc = norm(job.location);
  const prefs = [student.preferredLocation, student.location].filter(Boolean).map((l) => norm(l!));
  if (prefs.length > 0 || job.arrangement === 'remote') {
    max += 10;
    if (job.arrangement === 'remote') {
      earned += 10;
      reasons.push('Remote — work from anywhere');
    } else if (prefs.some((p) => loc.includes(p) || p.includes(loc))) {
      earned += 10;
      reasons.push(`In your preferred location (${job.location})`);
    }
  }

  if (student.preferredArrangement) {
    max += 10;
    if (student.preferredArrangement === job.arrangement) {
      earned += 10;
      reasons.push('Matches your preferred work arrangement');
    }
  }

  if (max === 0) return null;
  return { score: Math.round((earned / max) * 100), reasons, matchedSkills };
}

export function rankInternships<T extends MatchInternship>(student: MatchStudent, jobs: T[]) {
  return jobs
    .map((job) => ({ job, match: matchInternship(student, job) }))
    .sort((a, b) => (b.match?.score ?? -1) - (a.match?.score ?? -1));
}

export function profileCompletion(fields: Record<string, unknown>): { percent: number; missing: string[] } {
  const keys = Object.keys(fields);
  const filled = keys.filter((k) => {
    const v = fields[k];
    return Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && String(v).trim() !== '';
  });
  return {
    percent: keys.length ? Math.round((filled.length / keys.length) * 100) : 0,
    missing: keys.filter((k) => !filled.includes(k)),
  };
}
