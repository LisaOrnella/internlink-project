import { ARRANGEMENTS, INTERNSHIP_TYPES } from './constants';

export function formatDate(d: string | Date | null | undefined) {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}

export function timeAgo(d: string | Date, now: Date = new Date()) {
  const date = typeof d === 'string' ? new Date(d) : d;
  const s = Math.round((now.getTime() - date.getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

export function formatMoney(amount: number | null | undefined, currency = 'RWF') {
  if (amount == null) return '';
  return `${new Intl.NumberFormat('en-US').format(amount)} ${currency}`;
}

export function formatStipend(i: { is_paid: boolean; stipend_min: number | null; stipend_max: number | null; currency: string }) {
  if (!i.is_paid) return 'Unpaid';
  const { stipend_min: lo, stipend_max: hi, currency } = i;
  if (lo != null && hi != null && lo !== hi) return `${formatMoney(lo, currency)} – ${formatMoney(hi, currency)} / month`;
  const v = hi ?? lo;
  return v != null ? `${formatMoney(v, currency)} / month` : 'Paid';
}

export const arrangementLabel = (v: string) => ARRANGEMENTS.find((a) => a.value === v)?.label ?? v;
export const typeLabel = (v: string) => INTERNSHIP_TYPES.find((a) => a.value === v)?.label ?? v;

/** Whole calendar days from today to the deadline (UTC dates). 0 = today, negative = already closed. */
export function daysUntil(date: string | null | undefined, now: Date = new Date()) {
  if (!date) return null;
  const deadline = Date.parse(date.slice(0, 10) + 'T00:00:00Z');
  if (Number.isNaN(deadline)) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((deadline - today) / 86_400_000);
}

export function deadlineText(date: string | null | undefined, now: Date = new Date()) {
  const d = daysUntil(date, now);
  if (d == null) return 'No deadline';
  if (d < 0) return 'Closed';
  if (d === 0) return 'Closes today';
  if (d === 1) return '1 day left';
  return `${d} days left`;
}

export function bulletLines(text: string | null | undefined): string[] {
  if (!text) return [];
  return text.split(/\r?\n/).map((l) => l.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean);
}
