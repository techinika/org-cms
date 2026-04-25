<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CMS functionality summary

## Company Claim System
- Users can view companies they are members of on the homepage (`/`)
- When a user requests to claim a company, `user_company` record is created with `status = "confirmation_pending"`
- Company `claimed` field is set to `true` on `featured_startups` table
- User access depends on claim status:
  - No claim: "Claim Company" button shown
  - Company claimed but no user_company record: "Already Claimed" notice (user cannot claim)
  - Status = "confirmation_pending": "Awaiting Approval" notice
  - Status = "accepted" or "active": User can access company
  - Status = "rejected": "Request Rejected" notice

## Company Pages Structure (`/[slug]`)
- Main company page shows three cards: Company Profile, Company Events, Company Opportunities
- Each card links to separate pages

## Separate Pages
- `/[slug]/profile` - Edit company profile form, delete company
- `/[slug]/events` - List company events, create new event
- `/[slug]/opportunities` - List company opportunities, create new opportunity

## Opportunity Applications
- Applications support 1000+ entries with server-side pagination
- Filter by status: All, Pending, In Review, Interview, Technical Exam, Contract Signing, Hired, Rejected
- Search by name, email, location
- Click application to open detailed modal with:
  - Full applicant info (name, email, phone, location)
  - Cover letter
  - File links (resume, supporting docs, proposal) - opens in browser
  - Portfolio links
- Application progress workflow buttons:
  - In Review, Interview Pending, Technical Exam, Contract Signing, Hire, Reject
- Clicking progress button opens modal with:
  - Status selector
  - Pre-filled email template based on progress stage
  - Personalized message field (editable)
  - "Update & Send Email" button
- **AI Applicant Comparison** (uses Puter.js):
  - Click "AI Compare" button to analyze all applicants
  - AI scores each applicant 0-100% based on job requirements
  - Ranked list with reasoning shown in modal
- **Email Notifications**: Uses nodemailer to send personalized emails to applicants when status is updated
  - API endpoint: `/api/send-email`

## External Link Click Tracking
- Opportunities with `application_link` value other than "apply" track external link clicks
- Display click count on opportunity list and detail pages
- `external_link_clicks` field on opportunities table
- Clicking the link increments the count

## UI Components

### Toast Notifications (`components/ui/Toast.tsx`)
- Success, error, and info toast types
- Auto-dismiss after 4 seconds
- Close button to dismiss manually
- Import and use with `useToast()` hook inside `ToastProvider`

### Confirmation Modal (`components/ui/ConfirmationModal.tsx`)
- Variants: `danger`, `warning`, `info`
- Keyboard support (Escape to close)
- Body scroll lock when open
- Props: `isOpen`, `title`, `message`, `confirmLabel`, `cancelLabel`, `onConfirm`, `onCancel`, `variant`

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

### Toast Notifications
Wrap app with `ToastProvider` in `app/layout.tsx`:
```tsx
import { ToastProvider } from "@/components/ui/Toast";
// ...
<ToastProvider>{children}</ToastProvider>
```

Use in components:
```tsx
import { useToast } from "@/components/ui/Toast";

function MyComponent() {
  const { showToast } = useToast();
  // showToast("Success message", "success");
  // showToast("Error message", "error");
  // showToast("Info message", "info");
}
```

### Confirmation Modals
For delete operations, use state to track confirmation:
```tsx
const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; item: Item | null }>({ open: false, item: null });

// On delete button click, set state instead of directly deleting
<button onClick={() => setConfirmDelete({ open: true, item })}>Delete</button>

<ConfirmationModal
  isOpen={confirmDelete.open}
  title="Delete Item"
  message={`Are you sure you want to delete "${confirmDelete.item?.name}"?`}
  onConfirm={() => handleDelete(confirmDelete.item.id)}
  onCancel={() => setConfirmDelete({ open: false, item: null })}
/>
```

### Updated At Timestamps
All update operations automatically set `updated_at` to current timestamp via supabase.ts functions.

## Component Organization
```
components/
  events/
    EventCard.tsx        - Event list item and empty state
  opportunities/
    ApplicationList.tsx  - Paginated application list with filters
    ApplicationDetailModal.tsx - Application detail view modal
    FeedbackModal.tsx   - Email feedback modal
    AIScoreModal.tsx    - AI comparison results modal
    shared.ts           - Shared utilities (progress labels, colors, email templates)
  parts/
    Navbar.tsx          - Navigation bar
    Breadcrumb.tsx     - Breadcrumb navigation
    RichTextEditor.tsx  - Tiptap editor
    CreateCompanyModal.tsx - Company creation modal
  pages/
    Home.tsx            - Main dashboard
  ui/
    Toast.tsx           - Toast notifications (provider + hook)
    ConfirmationModal.tsx - Confirmation dialogs
```

## Database
- `opportunities.external_link_clicks` - Tracks external link clicks
- All tables have `updated_at` field updated on modifications

## Environment Variables
Add SMTP config for email:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`