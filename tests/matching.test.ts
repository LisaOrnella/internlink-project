import { describe, expect, it } from 'vitest';
import { matchInternship, profileCompletion, rankInternships } from '@/lib/matching';

const job = { title: 'Frontend Developer Intern', category: 'Software Development', location: 'Kigali', arrangement: 'hybrid', skills: ['React', 'TypeScript', 'CSS', 'Git'] };

describe('matchInternship (rule-based, transparent)', () => {
  it('returns null when the student has no data — never invents a score', () => {
    expect(matchInternship({ skills: [] }, job)).toBeNull();
  });
  it('counts matching skills case-insensitively and explains them', () => {
    const r = matchInternship({ skills: ['react', 'GIT', 'Python'] }, job)!;
    expect(r.matchedSkills).toEqual(['React', 'Git']);
    expect(r.reasons[0]).toContain('Matches 2 of 4 required skills');
  });
  it('scores a strong profile higher than a weak one', () => {
    const strong = matchInternship({ skills: ['React', 'TypeScript', 'CSS', 'Git'], fieldOfStudy: 'Software engineering', preferredLocation: 'Kigali', preferredArrangement: 'hybrid' }, job)!;
    const weak = matchInternship({ skills: ['Welding'], fieldOfStudy: 'Mechanical', preferredLocation: 'Huye', preferredArrangement: 'onsite' }, job)!;
    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.score).toBe(100);
  });
  it('gives remote roles a location credit', () => {
    const r = matchInternship({ skills: ['Git'], preferredLocation: 'Musanze' }, { ...job, arrangement: 'remote' })!;
    expect(r.reasons.join(' ')).toContain('Remote');
  });
  it('rescales when the listing declares no skills', () => {
    const r = matchInternship({ skills: ['Git'], preferredLocation: 'Kigali' }, { ...job, skills: [] })!;
    expect(r.score).toBe(100);
  });
  it('ranks best match first and keeps unscored jobs last', () => {
    const ranked = rankInternships({ skills: ['React'] }, [
      { ...job, title: 'A', skills: ['Welding'] }, { ...job, title: 'B', skills: ['React'] },
    ]);
    expect(ranked[0]!.job.title).toBe('B');
  });
});

describe('profileCompletion', () => {
  it('computes percent and lists missing fields', () => {
    const r = profileCompletion({ name: 'A', bio: '', skills: [], phone: '123' });
    expect(r.percent).toBe(50);
    expect(r.missing).toEqual(['bio', 'skills']);
  });
});
