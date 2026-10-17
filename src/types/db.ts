export type Role = 'student' | 'company' | 'admin';
export type AppStatus = 'submitted' | 'under_review' | 'shortlisted' | 'interview' | 'accepted' | 'rejected' | 'withdrawn';
export type InternshipStatus = 'draft' | 'published' | 'closed' | 'archived' | 'removed';

export type Profile = {
  id: string; role: Role; status: 'active' | 'suspended'; full_name: string; email: string; avatar_url: string | null; created_at: string;
};
export type StudentProfile = {
  user_id: string; university: string | null; degree_program: string | null; field_of_study: string | null;
  year_of_study: number | null; graduation_date: string | null; location: string | null; bio: string | null;
  soft_skills: string[]; languages: string[]; preferred_location: string | null; preferred_arrangement: string | null;
  linkedin_url: string | null; portfolio_url: string | null; resume_path: string | null; is_public: boolean;
};
export type CompanyProfile = {
  id: string; owner_id: string; name: string; logo_url: string | null; cover_url: string | null; industry: string | null;
  description: string | null; website: string | null; contact_email: string | null; phone: string | null; location: string | null;
  size: string | null; social_links: Record<string, string>; mission: string | null; culture: string | null; is_verified: boolean;
};
export type Internship = {
  id: string; company_id: string; title: string; category: string; description: string; responsibilities: string | null;
  requirements: string | null; benefits: string | null; location: string; arrangement: 'remote' | 'hybrid' | 'onsite';
  type: string; is_paid: boolean; stipend_min: number | null; stipend_max: number | null; currency: string;
  duration_months: number | null; start_date: string | null; deadline: string | null; positions: number;
  education_level: string | null; application_instructions: string | null; status: InternshipStatus; is_sample: boolean;
  published_at: string | null; created_at: string;
  company_profiles?: Pick<CompanyProfile, 'id' | 'name' | 'logo_url' | 'is_verified' | 'location'> | null;
  internship_skills?: { skills: { name: string } | null }[];
};
export type Application = {
  id: string; internship_id: string; student_id: string; cv_path: string | null; cover_letter: string; status: AppStatus;
  created_at: string; updated_at: string;
  internships?: Pick<Internship, 'id' | 'title' | 'deadline' | 'location' | 'status'> & { company_profiles: Pick<CompanyProfile, 'id' | 'name' | 'logo_url'> | null } | null;
  profiles?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'> | null;
};
export type NotificationRow = {
  id: string; user_id: string; type: string; title: string; body: string | null; link: string | null; is_read: boolean; created_at: string;
};
export type ActionResult = { ok: boolean; message?: string; errors?: Record<string, string>; redirect?: string };
