import { describe, expect, it } from 'vitest';
import { bulletLines, deadlineText, formatStipend, timeAgo } from '@/lib/format';
import { splitList, slugify } from '@/lib/utils';

describe('format helpers', () => {
  it('formats stipends', () => {
    expect(formatStipend({ is_paid: false, stipend_min: null, stipend_max: null, currency: 'RWF' })).toBe('Unpaid');
    expect(formatStipend({ is_paid: true, stipend_min: 100000, stipend_max: 150000, currency: 'RWF' })).toBe('100,000 RWF – 150,000 RWF / month');
    expect(formatStipend({ is_paid: true, stipend_min: null, stipend_max: null, currency: 'RWF' })).toBe('Paid');
  });
  it('describes deadlines', () => {
    const now = new Date('2026-01-10T10:00:00Z');
    expect(deadlineText('2026-01-09', now)).toBe('Closed');
    expect(deadlineText('2026-01-10', now)).toBe('Closes today');
    expect(deadlineText('2026-01-11', now)).toBe('1 day left');
    expect(deadlineText('2026-01-20', now)).toBe('10 days left');
    expect(deadlineText(null, now)).toBe('No deadline');
  });
  it('shows relative times', () => {
    const now = new Date('2026-01-10T10:00:00Z');
    expect(timeAgo('2026-01-10T09:59:40Z', now)).toBe('just now');
    expect(timeAgo('2026-01-10T07:00:00Z', now)).toBe('3h ago');
  });
  it('parses bullet text and lists', () => {
    expect(bulletLines('- one\n* two\n\n• three')).toEqual(['one', 'two', 'three']);
    expect(splitList('React, SQL ,react;Git\nSQL')).toEqual(['React', 'SQL', 'react', 'Git']);
    expect(slugify('Business & Finance')).toBe('business-and-finance');
  });
});
