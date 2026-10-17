import { z } from 'zod';
import {
  APPLICATION_STATUSES, CATEGORIES, COMPANY_SETTABLE, IMAGE_MAX_BYTES, IMAGE_TYPES, RESUME_MAX_BYTES, RESUME_TYPES,
} from './constants';

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === '' || /^https?:\/\/[^\s]+\.[^\s]+$/i.test(v), 'Enter a valid URL starting with http:// or https://')
  .optional()
  .or(z.literal(''));

const optionalText = (max = 2000) => z.string().trim().max(max).optional().or(z.literal(''));

export const registerSchema = z
  .object({
    role: z.enum(['student', 'company']),
    fullName: z.string().trim().min(2, 'Enter your full name').max(100),
    companyName: z.string().trim().max(120).optional(),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Za-z]/, 'Include at least one letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })
  .refine((v) => v.role !== 'company' || (v.companyName && v.companyName.length >= 2), {
    path: ['companyName'],
    message: 'Enter your company name',
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

export const resetRequestSchema = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email address') });
export const newPasswordSchema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters').regex(/[A-Za-z]/, 'Include a letter').regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const studentProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(100),
  phone: z.string().trim().max(30).regex(/^[+0-9 ()-]*$/, 'Enter a valid phone number').optional().or(z.literal('')),
  university: optionalText(150),
  degreeProgram: optionalText(150),
  fieldOfStudy: optionalText(150),
  yearOfStudy: z.coerce.number().int().min(1).max(10).optional().or(z.literal('').transform(() => undefined)),
  graduationDate: z.string().optional().or(z.literal('')),
  location: optionalText(120),
  bio: optionalText(1500),
  skills: optionalText(600),
  softSkills: optionalText(400),
  languages: optionalText(200),
  preferredLocation: optionalText(120),
  preferredArrangement: z.enum(['remote', 'hybrid', 'onsite']).optional().or(z.literal('')),
  linkedinUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  isPublic: z.boolean().default(true),
});

export const companyProfileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your company name').max(120),
  industry: optionalText(100),
  description: optionalText(4000),
  website: optionalUrl,
  contactEmail: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().trim().max(30).regex(/^[+0-9 ()-]*$/, 'Enter a valid phone number').optional().or(z.literal('')),
  location: optionalText(120),
  size: optionalText(20),
  mission: optionalText(1500),
  culture: optionalText(1500),
  linkedin: optionalUrl,
  twitter: optionalUrl,
  facebook: optionalUrl,
});

export const internshipSchema = z
  .object({
    title: z.string().trim().min(3, 'Title is too short').max(150),
    category: z.enum(CATEGORIES),
    description: z.string().trim().min(30, 'Describe the internship in at least 30 characters').max(6000),
    responsibilities: optionalText(4000),
    requirements: optionalText(4000),
    benefits: optionalText(3000),
    skills: optionalText(600),
    location: z.string().trim().min(2, 'Enter a location').max(120),
    arrangement: z.enum(['remote', 'hybrid', 'onsite']),
    type: z.enum(['full_time', 'part_time', 'summer', 'co_op', 'project_based']),
    isPaid: z.boolean(),
    stipendMin: z.coerce.number().int().min(0).optional().or(z.literal('').transform(() => undefined)),
    stipendMax: z.coerce.number().int().min(0).optional().or(z.literal('').transform(() => undefined)),
    currency: z.string().trim().min(3).max(3).default('RWF'),
    durationMonths: z.coerce.number().int().min(1).max(24),
    startDate: z.string().optional().or(z.literal('')),
    deadline: z.string().min(1, 'Choose an application deadline'),
    positions: z.coerce.number().int().min(1).max(500),
    educationLevel: optionalText(40),
    applicationInstructions: optionalText(2000),
    intent: z.enum(['draft', 'publish']),
  })
  .refine((v) => !v.isPaid || v.stipendMin !== undefined || v.stipendMax !== undefined, {
    path: ['stipendMin'],
    message: 'Add a stipend amount for paid internships',
  })
  .refine((v) => v.stipendMin === undefined || v.stipendMax === undefined || v.stipendMax >= v.stipendMin, {
    path: ['stipendMax'],
    message: 'Maximum must be at least the minimum',
  })
  .refine((v) => v.intent === 'draft' || new Date(v.deadline + 'T23:59:59Z').getTime() >= Date.now(), {
    path: ['deadline'],
    message: 'The deadline must be today or later to publish',
  });
export type InternshipInput = z.infer<typeof internshipSchema>;

export const applicationSchema = z.object({
  internshipId: z.string().uuid(),
  coverLetter: z.string().trim().min(20, 'Write at least 20 characters').max(5000),
  useProfileResume: z.boolean().default(false),
});

export const statusSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(COMPANY_SETTABLE),
});
export const noteSchema = z.object({ applicationId: z.string().uuid(), body: z.string().trim().min(1, 'Write a note').max(2000) });
export const reportSchema = z.object({
  internshipId: z.string().uuid(),
  reason: z.string().trim().min(10, 'Please give at least 10 characters').max(2000),
});

export const allStatuses = z.enum(APPLICATION_STATUSES);

export function validateFile(file: File | null | undefined, kind: 'resume' | 'image'): string | null {
  if (!file || file.size === 0) return null;
  const types: readonly string[] = kind === 'resume' ? RESUME_TYPES : IMAGE_TYPES;
  const max = kind === 'resume' ? RESUME_MAX_BYTES : IMAGE_MAX_BYTES;
  if (!types.includes(file.type)) {
    return kind === 'resume' ? 'CV must be a PDF, DOC or DOCX file' : 'Image must be JPG, PNG or WebP';
  }
  if (file.size > max) return `File is too large (max ${Math.round(max / 1024 / 1024)} MB)`;
  return null;
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
