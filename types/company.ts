// types/company.ts
export interface FeaturedStartup {
  id: string;
  created_at: string;
  updated_at?: string;
  lang: string;
  name: string;
  logo_url: string | null;
  description: string;
  learn_more_links: Record<string, unknown> | null;
  email: string | null;
  country: string | null;
  website: string | null;
  location: string | null;
  industry: string | null;
  status: string | null;
  tags: string | null;
  seo_title: string | null;
  seo_description: string | null;
  reviews_count: number | null;
  avg_rating: number | null;
  roles: string[] | null;
  is_featured: boolean | null;
  slug: string | null;
  claimed?: boolean | null;
  is_published?: boolean | null;
}

export type UserCompanyRole = "creator" | "manager" | "employee";
export type UserCompanyStatus = string;

export interface UserCompany {
  id: string;
  user_id: string | null;
  company_id: string | null;
  role: UserCompanyRole | null;
  note: string | null;
  created_at: string | null;
  status: UserCompanyStatus;
  added_by: string | null;
  company?: FeaturedStartup;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isAdmin?: boolean;
}

export interface Event {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  organizer_id: string | null;
  status: string | null;
  image_url: string | null;
}

export interface Opportunity {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  type: string | null;
  location: string | null;
  company_id: string | null;
  status: string | null;
  application_link: string | null;
  deadline: string | null;
}

export const INDUSTRIES = [
  "Agriculture",
  "Artificial Intelligence",
  "Automotive",
  "Banking",
  "Biotechnology",
  "Blockchain",
  "Clean Energy",
  "Cloud Computing",
  "Consumer Goods",
  "Cybersecurity",
  "Data Science",
  "E-commerce",
  "Education",
  "Fintech",
  "Food & Beverage",
  "Gaming",
  "Healthcare",
  "Human Resources",
  "Insurance",
  "Internet of Things",
  "Logistics",
  "Manufacturing",
  "Media & Entertainment",
  "Mining",
  "Pharmaceuticals",
  "Real Estate",
  "Retail",
  "SaaS",
  "Sports",
  "Telecommunications",
  "Tourism",
  "Transportation",
  "Other",
];
