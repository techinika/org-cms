-- Migration: Add opportunity subscription tiers and event invoices
-- Created at: 2026-05-26

-- =====================
-- Part 1: log_changes trigger function (referenced by event triggers)
-- =====================
CREATE OR REPLACE FUNCTION public.log_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NEW;
END;
$$;

-- =====================
-- Part 2: Event invoices table
-- =====================
DO $$ BEGIN
  CREATE TYPE public.event_invoice_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.event_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL,
  status public.event_invoice_status NOT NULL DEFAULT 'pending'::event_invoice_status,
  payment_link text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  constraint event_invoices_pkey PRIMARY KEY (id),
  constraint event_invoices_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES event_registrations (id) ON DELETE CASCADE
) TABLESPACE pg_default;

DROP TRIGGER IF EXISTS log_event_invoices_changes ON public.event_invoices;
CREATE TRIGGER log_event_invoices_changes
  AFTER INSERT OR DELETE OR UPDATE ON event_invoices
  FOR EACH ROW EXECUTE FUNCTION log_changes();

-- =====================
-- Part 3: Opportunity subscription columns on featured_startups
-- =====================
ALTER TABLE public.featured_startups
  ADD COLUMN IF NOT EXISTS opportunity_tier TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS opportunity_listings_purchased INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opportunity_listings_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;
