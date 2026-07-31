# Org CMS - Company Management System

A modern company management dashboard for managing events, opportunities, and company profiles.

## Features

- **Company Management** - Add, claim, edit, and delete company profiles
- **User Authentication** - Secure login via external auth system
- **Company Profile** - Full editable profile (name, description, logo, location, website, email, industry, country, tags, SEO settings)
- **Breadcrumb Navigation** - Navigation breadcrumbs on all pages for easy access to previous pages
- **Publish/Unpublish** - Control company visibility (draft/published)
- **Events Management** - Create, edit, delete events with full details
- **Opportunities Management** - Create, edit, delete jobs, internships, grants, tenders
- **Applications** - View and filter applications for opportunities
- **Admin Mode** - Admins can view all companies in the system
- **Company Claim System** - Users can request to claim companies with approval workflow
- **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Image Storage**: ImageKit (with assets table for tracking uploads)
- **Icons**: Lucide React

## Project Structure

```
org-cms/
├── app/
│   ├── [slug]/
│   │   ├── page.tsx                     # Company main page with menu cards
│   │   ├── profile/page.tsx            # Edit company profile
│   │   ├── events/
│   │   │   ├── page.tsx               # List company events
│   │   │   ├── new/page.tsx             # Create new event
│   │   │   └── [event-id]/
│   │   │       ├── page.tsx              # Event menu hub
│   │   │       ├── edit/page.tsx        # Edit event details
│   │   │       ├── speakers/page.tsx     # Manage speakers
│   │   │       ├── agenda/page.tsx       # Manage sessions
│   │   │       ├── partners/page.tsx    # Manage partners/sponsors
│   │   │       ├── registrations/page.tsx # View registrations
│   │   │       └── stats/page.tsx       # View statistics
│   │   └── opportunities/
│   │       ├── page.tsx                # List opportunities
│   │       ├── new/page.tsx            # Create new opportunity
│   │       └── [opp-id]/page.tsx      # Opportunity detail with applications
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                     # Homepage (company list)
├── components/
│   ├── pages/
│   │   └── Home.tsx                 # Main dashboard
│   ├── parts/
│   │   ├── Navbar.tsx               # Top navigation bar
│   │   ├── Breadcrumb.tsx           # Breadcrumb navigation
│   │   └── CreateCompanyModal.tsx  # Add/claim company modal
│   ├── ui/
│   │   ├── Toast.tsx                # Toast notifications
│   │   └── ConfirmationModal.tsx   # Confirmation dialogs
│   ├── events/
│   │   └── EventCard.tsx           # Event list item
│   └── opportunities/
│       ├── ApplicationList.tsx      # Paginated application list
│       ├── ApplicationDetailModal.tsx # Application detail view
│       ├── FeedbackModal.tsx          # Email feedback modal
│       └── AIScoreModal.tsx          # AI comparison results
├── lib/
│   ├── auth.ts                      # Server-side auth utilities
│   ├── auth-client.ts              # Client-side auth utilities
│   ├── cloudinary.ts              # (Deprecated - use imagekit.ts)
│   ├── imagekit.ts                 # ImageKit upload utilities
│   ├── supabase.ts                # Supabase client & queries
│   └── supabase-server.ts        # Server-side Supabase client
├── types/
│   └── company.ts                # TypeScript types
├── .env                           # Environment variables
├── package.json
└── tsconfig.json
```
org-cms/
├── app/
│   ├── [slug]/
│   │   ├── page.tsx                     # Company main page with tabs
│   │   ├── events/
│   │   │   ├── new/page.tsx             # Create new event
│   │   │   └── [event-id]/page.tsx      # Event detail & edit
│   │   └── opportunities/
│   │       ├── new/page.tsx             # Create new opportunity
│   │       └── [opp-id]/page.tsx        # Opportunity detail with applications
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                         # Homepage (company list)
├── components/
│   ├── pages/
│   │   └── Home.tsx                     # Main dashboard
│   └── parts/
│       ├── Navbar.tsx                   # Top navigation bar
│       └── CreateCompanyModal.tsx       # Add/claim company modal
├── lib/
│   ├── auth.ts                         # Server-side auth utilities
│   ├── auth-client.ts                  # Client-side auth utilities
│   ├── cloudinary.ts                   # Image upload utilities
│   ├── supabase.ts                     # Supabase client & queries
│   └── supabase-server.ts              # Server-side Supabase client
├── types/
│   └── company.ts                      # TypeScript types
├── .env                                 # Environment variables
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file with:

```env
# Supabase
NEXT_PUBLIC_PROJECT_URL=your_supabase_project_url
NEXT_PUBLIC_API_KEY=your_supabase_anon_key
NEXT_PUBLIC_SERVICE_KEY=your_supabase_service_key

# ImageKit
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint

# Auth
NEXT_PUBLIC_AUTH_URL=https://your-auth-app-url
NEXT_PUBLIC_BASE_URL=http://localhost:3001

# Email (sent via comms worker from no-reply@techinika.com)
NEXT_PUBLIC_COMMS_WORKER_URL=http://localhost:8789
WORKER_API_KEY=
RESEND_FROM="Techinika <no-reply@techinika.com>"
```

### Development

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Database Schema

### featured_startups
- id (uuid, primary key)
- name (text, required)
- logo_url (text)
- image_ref (uuid, references assets.id)
- description (text)
- industry (text)
- location (text)
- website (text)
- email (text)
- country (text)
- slug (varchar)
- claimed (boolean) - Set to true when someone requests to claim the company
- is_featured (boolean)
- is_published (boolean)
- seo_title (text)
- seo_description (text)
- tags (text)
- lang (text)
- created_at, updated_at (timestamps)

### assets
- id (uuid, primary key)
- url (text, required)
- file_name (text)
- file_type (text)
- file_size (numeric)
- width (numeric)
- height (numeric)
- imagekit_file_id (text)
- created_at, updated_at (timestamps)

### user_company
- id (uuid, primary key)
- user_id (uuid, references auth.users & authors)
- company_id (uuid, references featured_startups)
- role (creator | manager | employee)
- status (confirmation_pending | accepted | rejected | active)
- added_by (uuid)
- created_at (timestamp)

### events
- id (uuid, primary key)
- title (text)
- slug (text, unique)
- location (text)
- format (Online | In-Person | Hybrid)
- status (Upcoming | Ongoing | Completed | Cancelled)
- publish_status (draft | published)
- start_date, end_date (timestamps)
- organizer_id (uuid, references featured_startups)
- seo_description, full_description (text)
- tags, external_link (text)
- views, is_featured (numeric/boolean)
- lang (text)

### opportunities
- id (uuid, primary key)
- title (text)
- slug (text, unique)
- type (Job | Tender | Grant | Internship | Other)
- location (text)
- salary, application_link, contact_email (text)
- work_mode (Remote | On-Site | Hybrid)
- employment_type (Full-Time | Part-Time | Contract | Internship)
- status (Open | Closed | Draft)
- company_id (uuid, references featured_startups)
- expires_at (timestamp)
- views, featured (numeric/boolean)

### applications
- id (uuid, primary key)
- opportunity_id (uuid, references opportunities)
- name, email, phone, location (text)
- resume_url, cover_letter (text)
- supporting_docs, portfolio_links (text[])
- created_at (timestamp)

## Key Features

### Adding a Company
1. Click "Add Company" button
2. Search for existing company by name
3. If found, click to claim (creates user_company record)
4. If not found, create new with name, description, logo

### Claiming a Company
- When claiming, a user_company record is created with status "confirmation_pending"
- The featured_startups.claimed field is set to true
- Admin approval required - status changes to "accepted" after admin approval
- If rejected, user sees "Request Rejected" notice
- If pending confirmation, user sees "Awaiting Approval" notice

### Company Claim Status Flow
1. **No claim requested**: User sees "Claim Company" button
2. **Company already claimed** (featured_startups.claimed = true, no user_company): User sees "Already Claimed" notice, cannot claim
3. **Pending confirmation** (user_company.status = "confirmation_pending"): User sees "Awaiting Approval" notice
4. **Accepted/Active** (user_company.status = "accepted" or "active"): User can access the company
5. **Rejected** (user_company.status = "rejected"): User sees "Request Rejected" notice

### Company Management
- Edit company profile at `/[slug]/profile` (name, description, logo, location, website, email, industry, country, tags)
- SEO settings (title, description)
- Publish/Unpublish toggle with confirmation modal
- Delete company with confirmation modal
- Manage company at `/[slug]` - Three menu cards: Profile, Events, Opportunities

### Events
- List events with status badges
- Create new event at `/[slug]/events/new`
- Edit event at `/[slug]/events/[event-id]`
- Delete event from menu

### Opportunities
- List opportunities with type badges
- Create new opportunity at `/[slug]/opportunities/new`
- Edit opportunity at `/[slug]/opportunities/[opp-id]`
- Rich text editor for full description, requirements, and benefits (Tiptap WYSIWYG)
- View applications with filters (All/Pending/In Review/Interview/Tech Exam/Contract/Hired/Rejected)
- Pagination supports up to 1000+ applications
- Individual application modal with full details (name, email, phone, location, cover letter, files)
- File preview links for resume, supporting docs, and proposals (opens in browser)
- Application progress workflow: In Review → Interview Pending → Technical Exam → Contract Signing → Hired
- Rejection flow with customizable email message
- **AI Applicant Comparison**: Click "AI Compare" button to rank applicants by compatibility score (0-100%)
  - Uses Puter.js AI to analyze cover letters against job requirements
  - Shows ranked list with scores and reasoning
- **Email Notifications**: When updating application status, personalized email is sent to applicant via nodemailer
- Delete opportunity from menu

### Application Link
- To use the built-in application form (instead of external link), set application_link to "apply"
- This will make the opportunity accept applications through the CMS form

## Environment Variables

### Email (sent via comms worker)
Transactional email (application status updates) is sent through the comms worker from
`no-reply@techinika.com`. `support@techinika.com` / `editorial@techinika.com` are user-facing
contact addresses only.
```
NEXT_PUBLIC_COMMS_WORKER_URL=http://localhost:8789
WORKER_API_KEY=
RESEND_FROM="Techinika <no-reply@techinika.com>"
```

### Navigation Routes
- Homepage: `/` - List of user's companies with claim status
- Company page: `/[slug]` - Company with three menu cards (Profile, Events, Opportunities)
- Profile page: `/[slug]/profile` - Edit company profile and delete company
- Events page: `/[slug]/events` - List company events, create new event
- Opportunities page: `/[slug]/opportunities` - List company opportunities, create new opportunity
- Event detail: `/[slug]/events/[event-id]`
- Opportunity detail: `/[slug]/opportunities/[opp-id]`
- Create event: `/[slug]/events/new`
- Create opportunity: `/[slug]/opportunities/new`
- Sign out: Redirects to auth app

## Code Conventions

### Dynamic Route Params
In Next.js 16, dynamic route params are passed as Promises. Always unwrap with `use()`:
```tsx
import { use } from "react";

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  // ...
}
```

## License

MIT