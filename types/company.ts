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

export type EventFormat = "Online" | "In-Person" | "Hybrid";
export type EventStatus = "Upcoming" | "Ongoing" | "Completed" | "Cancelled";

export interface Event {
  id: string;
  created_at: string;
  updated_at?: string;
  title: string;
  slug: string;
  lang: string;
  location: string | null;
  format: EventFormat;
  seo_description: string | null;
  full_description: string | null;
  status: EventStatus;
  publish_status: string;
  start_date: string | null;
  end_date: string | null;
  organizer_id: string | null;
  contact_person_id: string | null;
  faqs: Record<string, unknown> | null;
  tags: string | null;
  is_featured: boolean;
  views: number;
  external_link: string | null;
  external_link_clicks?: string;
}

export type OpportunityType = "Job" | "Tender" | "Grant" | "Internship" | "Other";
export type WorkMode = "Remote" | "On-Site" | "Hybrid";
export type EmploymentType = "Full-Time" | "Part-Time" | "Contract" | "Internship";
export type OpportunityStatus = "Open" | "Closed" | "Draft";

export interface Opportunity {
  id: string;
  created_at: string;
  updated_at?: string;
  title: string;
  slug: string;
  type: OpportunityType;
  organization: string | null;
  company_id: string | null;
  location: string;
  salary: string | null;
  application_link: string | null;
  contact_email: string | null;
  tags: string | null;
  description: string;
  full_description: string;
  requirements: string | null;
  benefits: string | null;
  status: OpportunityStatus;
  featured: boolean;
  views: number;
  expires_at: string | null;
  seo_description: string | null;
  lang: string;
  hints: Record<string, unknown> | null;
  work_mode: WorkMode;
  employment_type: EmploymentType;
  country: string | null;
  application_type: string;
}

export type ApplicationStatus = "pending" | "reviewed" | "accepted" | "rejected";

export interface Application {
  id: string;
  opportunity_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  resume_url: string | null;
  supporting_docs: string[] | null;
  portfolio_links: string[] | null;
  cover_letter: string | null;
  company_name: string | null;
  tender_email: string | null;
  proposal_url: string | null;
  created_at: string | null;
  feedback?: ApplicationFeedback[];
}

export interface ApplicationFeedback {
  id: string;
  application_id: string;
  reviewer_id: string;
  status: ApplicationStatus;
  feedback_message: string | null;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  ticket_id: string | null;
  status: string;
  answers: Record<string, unknown>;
  created_at: string;
}

export interface EventTicket {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  quantity: number | null;
  sales_start_at: string | null;
  sales_end_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface EventSchedule {
  id: string;
  event_id: string;
  day_index: number;
  session_title: string;
  session_description: string | null;
  session_start: string;
  session_end: string | null;
  location: string | null;
  speakers: string[] | null;
  speaker_relation: string | null;
  order_index: number | null;
  created_at: string;
  updated_at?: string;
}

export interface EventCompany {
  id: number;
  event_id: string;
  company_id: string;
  relationship: string;
  note: string | null;
  created_at: string;
}

export interface EventMetaDetails {
  id: string;
  event_id: string;
  is_free: boolean;
  requires_approval: boolean;
  capacity: number | null;
  registration_open: boolean;
  created_at: string;
  updated_at?: string;
}

export const OPPORTUNITY_TYPES = ["Job", "Tender", "Grant", "Internship", "Other"] as const;
export const WORK_MODES = ["Remote", "On-Site", "Hybrid"] as const;
export const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract", "Internship"] as const;
export const EVENT_FORMATS = ["Online", "In-Person", "Hybrid"] as const;

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