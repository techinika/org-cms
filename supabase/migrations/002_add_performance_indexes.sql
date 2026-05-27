-- Migration: Add performance indexes for opportunities and applications
-- Created at: 2026-05-26

-- Opportunities: filter by company, order by created_at (list page)
CREATE INDEX IF NOT EXISTS idx_opportunities_company_id ON public.opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_company_id_created_at ON public.opportunities(company_id, created_at DESC);

-- Opportunities: lookup by id (detail page)
CREATE INDEX IF NOT EXISTS idx_opportunities_id ON public.opportunities(id);

-- Applications: filter by opportunity with pagination (applications page)
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON public.applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id_created_at ON public.applications(opportunity_id, created_at DESC);

-- Applications: search by name/email/location
CREATE INDEX IF NOT EXISTS idx_applications_name ON public.applications(name);
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications(email);

-- Applications feedback: lookup by application for status filtering
CREATE INDEX IF NOT EXISTS idx_applications_feedback_application_id ON public.applications_feedback(application_id);
CREATE INDEX IF NOT EXISTS idx_applications_feedback_status ON public.applications_feedback(status);

-- Events: filter by organizer, order by start_date (list page)
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id_start_date ON public.events(organizer_id, start_date ASC);

-- Event registrations: filter by event (registrations page)
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);

-- Event tickets: filter by event
CREATE INDEX IF NOT EXISTS idx_event_tickets_event_id ON public.event_tickets(event_id);

-- Event schedule: filter by event
CREATE INDEX IF NOT EXISTS idx_event_schedule_event_id ON public.event_schedule(event_id);

-- featured_startups: lookup by slug
CREATE INDEX IF NOT EXISTS idx_featured_startups_slug ON public.featured_startups(slug);

-- user_company: filter by user or company
CREATE INDEX IF NOT EXISTS idx_user_company_user_id ON public.user_company(user_id);
CREATE INDEX IF NOT EXISTS idx_user_company_company_id ON public.user_company(company_id);
