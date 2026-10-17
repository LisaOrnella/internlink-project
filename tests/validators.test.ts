import { describe, expect, it } from 'vitest';
import { applicationSchema, internshipSchema, loginSchema, registerSchema, validateFile } from '@/lib/validators';

const base = { role: 'student', fullName: 'Alice N', email: 'ALICE@Example.com', password: 'abcdef12', confirmPassword: 'abcdef12' };

describe('registerSchema', () => {
  it('accepts a valid student and lowercases the email', () => {
    const r = registerSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('alice@example.com');
  });
  it('rejects admin as a public role', () => {
    expect(registerSchema.safeParse({ ...base, role: 'admin' }).success).toBe(false);
  });
  it('rejects weak or mismatched passwords', () => {
    expect(registerSchema.safeParse({ ...base, password: 'short', confirmPassword: 'short' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: 'onlyletters', confirmPassword: 'onlyletters' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, confirmPassword: 'different1' }).success).toBe(false);
  });
  it('requires a company name for companies', () => {
    expect(registerSchema.safeParse({ ...base, role: 'company' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, role: 'company', companyName: 'Acme Ltd' }).success).toBe(true);
  });
});

describe('loginSchema', () => {
  it('requires email and password', () => {
    expect(loginSchema.safeParse({ email: 'nope', password: '' }).success).toBe(false);
  });
});

const job = { title: 'Dev Intern', category: 'Software Development', description: 'x'.repeat(40), location: 'Kigali', arrangement: 'onsite', type: 'full_time', isPaid: false, durationMonths: 3, deadline: '2999-01-01', positions: 1, intent: 'publish', currency: 'RWF' };
describe('internshipSchema', () => {
  it('accepts a valid listing', () => { expect(internshipSchema.safeParse(job).success).toBe(true); });
  it('requires a stipend for paid internships', () => { expect(internshipSchema.safeParse({ ...job, isPaid: true }).success).toBe(false); });
  it('rejects max below min', () => { expect(internshipSchema.safeParse({ ...job, isPaid: true, stipendMin: 200, stipendMax: 100 }).success).toBe(false); });
  it('rejects unknown categories and past deadlines when publishing', () => {
    expect(internshipSchema.safeParse({ ...job, category: 'Underwater Basket Weaving' }).success).toBe(false);
    expect(internshipSchema.safeParse({ ...job, deadline: '2000-01-01' }).success).toBe(false);
    expect(internshipSchema.safeParse({ ...job, deadline: '2000-01-01', intent: 'draft' }).success).toBe(true);
  });
});

describe('applicationSchema + file validation', () => {
  it('needs a real uuid and a cover letter of 20+ chars', () => {
    expect(applicationSchema.safeParse({ internshipId: 'abc', coverLetter: 'long enough cover letter here' }).success).toBe(false);
    expect(applicationSchema.safeParse({ internshipId: '6f1d2c3e-0000-4000-8000-000000000000', coverLetter: 'short' }).success).toBe(false);
  });
  it('validates CV type and size', () => {
    const pdf = new File(['x'], 'cv.pdf', { type: 'application/pdf' });
    const exe = new File(['x'], 'cv.exe', { type: 'application/x-msdownload' });
    const big = new File([new Uint8Array(6 * 1024 * 1024)], 'cv.pdf', { type: 'application/pdf' });
    expect(validateFile(pdf, 'resume')).toBeNull();
    expect(validateFile(exe, 'resume')).toContain('PDF');
    expect(validateFile(big, 'resume')).toContain('too large');
    expect(validateFile(null, 'resume')).toBeNull();
  });
});
