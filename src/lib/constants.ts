export const CATEGORIES = [
  'Software Development',
  'Information Technology',
  'Business and Finance',
  'Marketing and Communications',
  'Engineering',
  'Design and Creative Arts',
  'Data Science',
  'Human Resources',
] as const;

export const ARRANGEMENTS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
] as const;

export const INTERNSHIP_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'summer', label: 'Summer' },
  { value: 'co_op', label: 'Co-op' },
  { value: 'project_based', label: 'Project-based' },
] as const;

export const EDUCATION_LEVELS = ['Any', 'High school', 'Diploma', 'Undergraduate', 'Postgraduate'] as const;
export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'] as const;

export const APPLICATION_STATUSES = [
  'submitted', 'under_review', 'shortlisted', 'interview', 'accepted', 'rejected', 'withdrawn',
] as const;

export const STATUS_LABEL: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  draft: 'Draft',
  published: 'Published',
  closed: 'Closed',
  archived: 'Archived',
  removed: 'Removed',
};

/** Statuses a company may move an application to (withdrawn is student-only) */
export const COMPANY_SETTABLE = ['under_review', 'shortlisted', 'interview', 'accepted', 'rejected'] as const;

export const DURATIONS = [1, 2, 3, 4, 6, 9, 12] as const;
export const PAGE_SIZE = 9;

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;
export const IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const FALLBACK_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
  team: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
  office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
  graduate: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
  coding: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
  cover: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
};

export const CATEGORY_ICON: Record<string, string> = {
  'Software Development': 'Code2',
  'Information Technology': 'Server',
  'Business and Finance': 'Landmark',
  'Marketing and Communications': 'Megaphone',
  Engineering: 'Wrench',
  'Design and Creative Arts': 'Palette',
  'Data Science': 'BarChart3',
  'Human Resources': 'Users',
};
