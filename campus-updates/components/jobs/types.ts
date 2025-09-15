export interface Job {
  id: string;
  job_profile: string;
  company: string;
  placement_category_code: number;
  placement_category: string;
  createdAt: number;
  deadline: number | null;
  eligibility_marks: Array<{
    level: string;
    criteria: number;
  }>;
  eligibility_courses: string[];
  allowed_genders: string[];
  job_description: string;
  location: string;
  package: number;
  package_info: string;
  annum_months?: string;
  required_skills: string[];
  hiring_flow: string[];
  placement_type: string | null;
  documents?: Array<{
    name: string;
    identifier: string;
    url: string;
  }>;
}
