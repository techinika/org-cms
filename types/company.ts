// types/company.ts
export interface FeaturedStartup {
  id: string;
  created_at: string;
  updated_at?: string;
  lang: string;
  name: string;
  logo_url: string | null;
  image_ref: string | null;
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

export type UserCompanyRole = "creator" | "manager" | "events_manager" | "opportunities_manager" | "employee";
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
  author?: {
    id: string;
    name: string;
    image_ref?: string;
  } | null;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isAdmin?: boolean;
}

export type EventFormat = "Webinar" | "Conference" | "Workshop" | "Networking" | "Launch" | "Hackathon";
export type EventStatus = "Upcoming" | "Past" | "Featured" | "Happening";

export type EventRegistrationType = "platform" | "external";

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
  faqs: FaqItem[] | null;
  tags: string | null;
  is_featured: boolean;
  views: number;
  registration_type: EventRegistrationType;
  external_link: string | null;
  external_link_clicks: string;
  // Registration logic:
  // - If registration_type is "platform" -> platform handles registration (same page)
  // - If registration_type is "external" -> external platform (opens in new tab, uses external_link)
  // - If event has tickets with price > 0 -> NOT free
  // - If event has tickets but all price = 0 -> Free (ignore is_free)
  // - If no tickets and no is_free field -> assumed free
}

export interface FaqItem {
  question: string;
  answer: string;
}

export type OpportunityType = "Job" | "Tender" | "Grant" | "Internship" | "Other";
export type WorkMode = "Remote" | "On-Site" | "Hybrid" | "In-person";
export type EmploymentType = "Full-Time" | "Part-Time" | "Contract" | "Temporary" | "Volunteering" | "Task" | "Internship";
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
  external_link_clicks: number;
  expires_at: string | null;
  seo_description: string | null;
  lang: string;
  hints: Record<string, unknown> | null;
  work_mode: WorkMode;
  employment_type: EmploymentType;
  country: string | null;
  application_type: string;
}

export type ApplicationProgress = "pending" | "in_review" | "interview_pending" | "technical_exam_pending" | "contract_signing_pending" | "not_proceeding" | "hired" | "quit" | "rejected";
export type ApplicationStatus = "in_review" | "interview_pending" | "hired" | "quit" | "contract_sign_pending" | "starting_job_pending" | "started_internship" | "started_job" | "rejected";

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
  checked_in: boolean | null;
  checked_in_at: string | null;
  answers: Record<string, unknown>;
  created_at: string;
}

export interface Speaker {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  company_id: string | null;
  org_name: string | null;
  image_ref: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventSpeaker {
  id: string;
  event_id: string;
  speaker_id: string;
  role: string | null;
  speaking_order: number | null;
  note: string | null;
  speaker?: Speaker;
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
export const WORK_MODES = ["Remote", "On-Site", "Hybrid", "In-person"] as const;
export const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract", "Temporary", "Volunteering", "Task", "Internship"] as const;
export const APPLICATION_PROGRESS = ["pending", "in_review", "interview_pending", "technical_exam_pending", "contract_signing_pending", "not_proceeding", "hired", "quit", "rejected"] as const;
export const EVENT_FORMATS = ["Webinar", "Conference", "Workshop", "Networking", "Launch", "Hackathon"] as const;

// Helper function to determine if event is free based on tickets
export function isEventFree(tickets: EventTicket[] | null): boolean {
  if (!tickets || tickets.length === 0) return true; // No tickets = free event
  return tickets.every(t => t.price === 0); // All tickets free = free event
}

export interface Asset {
  id: string;
  url: string;
  name: string;
  type: string;
  views: number | null;
  author_id: string | null;
  created_at: string;
  updated_at?: string;
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

export interface Industry {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}