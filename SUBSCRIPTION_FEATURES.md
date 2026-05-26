# Subscription Features Documentation

## Overview

The Org-CMS platform implements a subscription-based tier system for managing access to opportunities features. This system allows companies to choose different levels of access based on their needs and budget.

## Subscription Tiers

### Free Tier
- **Cost**: $0/month
- **Opportunities**: Cannot create new opportunities
- **Applications Dashboard**: No access
- **AI Features**: No access
- **Email Notifications**: No access
- **Existing Opportunities**: Can view but not manage

### Basic Tier
- **Cost**: $49.99 one-time (for 5 listings) or $19.99/month
- **Opportunities**: Limited to purchased number of listings
- **Applications Dashboard**: Full access
- **AI Features**: AI applicant comparison available
- **Email Notifications**: Application status update emails
- **Listing Management**: Tracks listings used vs. purchased

### Advanced Tier
- **Cost**: $19.99/month
- **Opportunities**: Unlimited listings
- **Applications Dashboard**: Full access
- **AI Features**: AI applicant comparison available
- **Email Notifications**: Application status update emails
- **Support**: Priority support
- **Additional Features**: All platform features

## How It Works

### Tier Determination
A company's tier is stored in the `featured_startups` table in the `opportunity_tier` column, which can be:
- `"free"`
- `"basic"`
- `"advanced"`

### Listing Management (Basic Tier Only)
For companies on the basic tier:
- `opportunity_listings_purchased`: Number of listings purchased
- `opportunity_listings_used`: Number of listings currently used
- When creating a new opportunity, the system increments `opportunity_listings_used`
- Companies cannot create new opportunities when `opportunity_listings_used >= opportunity_listings_purchased`

### Subscription Dates
- `subscription_started_at`: When the current subscription period began
- `subscription_expires_at`: When the current subscription period ends
- Only applicable for advanced tier subscriptions (basic tier listings do not expire)

## Access Control Implementation

The system implements access control at multiple levels:

### 1. Opportunities List Page (`app/[slug]/opportunities/page.tsx`)
- Checks company tier on load
- Redirects free/basic tier users to upgrade prompt if they don't have access
- Shows tier badge and upgrade prompt in the opportunities card

### 2. Opportunity Applications Page (`app/[slug]/opportunities/[opp-id]/applications/page.tsx`)
- Verifies company has basic or advanced tier
- Redirects insufficient tier users to opportunities list (where they'll see upgrade prompt)

### 3. Opportunity Detail Page (`app/[slug]/opportunities/[opp-id]/page.tsx`)
- Checks access before showing opportunity details
- Shows upgrade prompt for insufficient tier

### 4. Opportunity Edit Page (`app/[slug]/opportunities/[opp-id]/edit/page.tsx`)
- Prevents editing for insufficient tier
- Shows upgrade prompt

### 5. New Opportunity Page (`app/[slug]/opportunities/new/page.tsx`)
- Blocks creation for insufficient tier
- Shows upgrade prompt
- Increments listings used for basic tier upon successful creation

### 6. Opportunity Detail Actions (View Applications, Edit)
- Links are hidden or redirect based on tier access

## Email Notification System

The platform sends automated emails for subscription events:

### 1. Subscription Welcome Email
- Sent when upgrading to basic or advanced tier
- Confirms subscription activation
- Lists available features
- Provides link to opportunities dashboard

### 2. Subscription Renewal Reminder
- Sent 7, 3, and 1 days before expiration
- Warns of upcoming expiration
- Provides link to renew subscription

### 3. Subscription Expiration Notice
- Sent immediately after expiration
- Informs of lost access
- Provides link to renew subscription

## API Endpoints

### Subscription Check (`/api/subscription-check`)
- GET endpoint for checking subscription statuses
- Intended to be called periodically (e.g., daily cron job)
- Sends notifications based on expiration timelines
- Returns success/failure status

### Email Service (`/app/api/send-email`)
- POST endpoint for sending application-related emails
- Used by the applications dashboard when updating applicant status
- Requires SMTP configuration in environment variables

## Database Schema

### featured_startups Table Additions
```sql
opportunity_tier TEXT, -- 'free', 'basic', or 'advanced'
opportunity_listings_purchased INTEGER, -- For basic tier
opportunity_listings_used INTEGER, -- For basic tier
subscription_started_at TIMESTAMP WITH TIME ZONE,
subscription_expires_at TIMESTAMP WITH TIME ZONE
```

### event_invoices Table
```sql
id UUID PRIMARY KEY,
registration_id UUID REFERENCES event_registrations(id),
amount DECIMAL,
currency VARCHAR(3),
status VARCHAR(20), -- 'pending', 'paid', 'cancelled', 'refunded'
payment_link TEXT,
created_at TIMESTAMP WITH TIME ZONE
```

## Frontend Components

### PricingModal (`components/opportunities/PricingModal.tsx`)
- Presents upgrade options:
  - Basic tier: 5 listings for $49.99 (one-time)
  - Advanced tier: Unlimited listings for $19.99/month
- Handles subscription updates via Supabase
- Shows processing state and success/error messages

### Usage Analytics
- Integrated into company profile page (`app/[slug]/profile/page.tsx`)
- Shows current tier, listings usage, subscription status
- Provides upgrade CTA for ineligible tiers

## Environment Variables Required

For email functionality:
- `SMTP_HOST`: SMTP server hostname
- `SMTP_PORT`: SMTP server port (default: 587)
- `SMTP_SECURE`: Whether to use SSL/TLS (`true`/`false`)
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `SMTP_FROM`: From email address

## Implementation Notes

1. **Payment Processing**: Currently simulated - actual payment gateway integration would be needed for production
2. **Performance**: All database queries are optimized with proper indexing
3. **Security**: Row-level security should be implemented in Supabase for production
4. **Extensibility**: The tier system is designed to easily add new tiers or features
5. **Fallbacks**: Graceful degradation when subscription data is missing or incomplete

## Testing

Unit tests are available in `lib/__tests__/subscription.test.ts` covering:
- Opportunity creation permissions
- Applications dashboard access
- Listing calculations and increments
- Tier-based access control logic

## Future Enhancements

1. **Actual Payment Integration**: Connect to Stripe or other payment provider
2. **Usage Analytics Dashboard**: More detailed metrics on opportunity performance
3. **Tier Downgrading**: Allow companies to downgrade their subscription
4. **Prorated Billing**: For mid-cycle subscription changes
5. **Usage-based Notifications**: Alert when approaching listing limits
6. **Team-based Access Control**: Different permissions for team members within a company