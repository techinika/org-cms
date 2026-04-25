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
