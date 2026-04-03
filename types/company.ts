// types/company.ts
export interface FeaturedStartup {
  id: string;
  created_at: string;
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
  reviews_count: number | null;
  avg_rating: number | null;
  roles: string[] | null;
  is_featured: boolean | null;
  slug: string | null;
  claimed?: boolean | null;
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

export const MOCK_COMPANIES: FeaturedStartup[] = [
  {
    id: "1",
    created_at: new Date().toISOString(),
    lang: "en",
    name: "TechFlow Systems",
    logo_url: "https://logo.clearbit.com/stripe.com",
    description: "Infrastructure for the modern internet.",
    learn_more_links: null,
    email: null,
    country: "Rwanda",
    website: "https://techflow.io",
    location: "Kigali, Rwanda",
    industry: "Fintech",
    status: "active",
    tags: null,
    reviews_count: null,
    avg_rating: null,
    roles: null,
    is_featured: true,
    slug: "techflow-systems",
  },
  {
    id: "2",
    created_at: new Date().toISOString(),
    lang: "en",
    name: "GreenGrid Energy",
    logo_url: "https://logo.clearbit.com/tesla.com",
    description: "Renewable energy management solutions.",
    learn_more_links: null,
    email: null,
    country: "Kenya",
    website: "https://greengrid.energy",
    location: "Nairobi, Kenya",
    industry: "Energy",
    status: "active",
    tags: null,
    reviews_count: null,
    avg_rating: null,
    roles: null,
    is_featured: true,
    slug: "greengrid-energy",
  },
  {
    id: "3",
    created_at: new Date().toISOString(),
    lang: "en",
    name: "Nexus Health",
    logo_url: "https://logo.clearbit.com/oscarhealth.com",
    description: "AI-driven patient diagnostics.",
    learn_more_links: null,
    email: null,
    country: "Nigeria",
    website: "https://nexushealth.io",
    location: "Lagos, Nigeria",
    industry: "Healthtech",
    status: "active",
    tags: null,
    reviews_count: null,
    avg_rating: null,
    roles: null,
    is_featured: true,
    slug: "nexus-health",
  },
];
