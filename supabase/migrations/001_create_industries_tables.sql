-- Migration: Create industries and company_industries tables
-- Created at: 2026-05-18

-- Industries table
CREATE TABLE IF NOT EXISTS public.industries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT industries_pkey PRIMARY KEY (id),
  CONSTRAINT industries_name_unique UNIQUE (name),
  CONSTRAINT industries_slug_unique UNIQUE (slug)
) TABLESPACE pg_default;

-- Company industries junction table
CREATE TABLE IF NOT EXISTS public.company_industries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  industry_id uuid NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT company_industries_pkey PRIMARY KEY (id),
  CONSTRAINT company_industries_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.featured_startups(id) ON DELETE CASCADE,
  CONSTRAINT company_industries_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES public.industries(id) ON DELETE CASCADE,
  CONSTRAINT company_industries_unique UNIQUE (company_id, industry_id)
) TABLESPACE pg_default;

-- Insert default industries
INSERT INTO public.industries (name, slug, description) VALUES
  ('Agriculture', 'agriculture', 'Farming, agribusiness, and agricultural technology'),
  ('Artificial Intelligence', 'artificial-intelligence', 'AI, machine learning, and automation'),
  ('Automotive', 'automotive', 'Vehicle manufacturing and automotive tech'),
  ('Banking', 'banking', 'Financial services and banking'),
  ('Biotechnology', 'biotechnology', 'Biotech and life sciences'),
  ('Blockchain', 'blockchain', 'Cryptocurrency and blockchain technology'),
  ('Clean Energy', 'clean-energy', 'Renewable energy and sustainability'),
  ('Cloud Computing', 'cloud-computing', 'Cloud services and infrastructure'),
  ('Consumer Goods', 'consumer-goods', 'Retail and consumer products'),
  ('Cybersecurity', 'cybersecurity', 'Security and privacy solutions'),
  ('Data Science', 'data-science', 'Data analytics and science'),
  ('E-commerce', 'e-commerce', 'Online retail and marketplaces'),
  ('Education', 'education', 'EdTech and learning platforms'),
  ('Fintech', 'fintech', 'Financial technology'),
  ('Food & Beverage', 'food-beverage', 'Food industry and beverages'),
  ('Gaming', 'gaming', 'Video games and entertainment'),
  ('Healthcare', 'healthcare', 'Health services and medical tech'),
  ('Human Resources', 'human-resources', 'HR tech and recruitment'),
  ('Insurance', 'insurance', 'Insurance services'),
  ('Internet of Things', 'internet-of-things', 'IoT and connected devices'),
  ('Logistics', 'logistics', 'Supply chain and logistics'),
  ('Manufacturing', 'manufacturing', 'Industrial manufacturing'),
  ('Media & Entertainment', 'media-entertainment', 'Media and entertainment'),
  ('Mining', 'mining', 'Mining and resources'),
  ('Pharmaceuticals', 'pharmaceuticals', 'Pharma and drug development'),
  ('Real Estate', 'real-estate', 'Property and real estate'),
  ('Retail', 'retail', 'Retail and shopping'),
  ('SaaS', 'saas', 'Software as a service'),
  ('Sports', 'sports', 'Sports and athletics'),
  ('Telecommunications', 'telecommunications', 'Telecom and networks'),
  ('Tourism', 'tourism', 'Travel and tourism'),
  ('Transportation', 'transportation', 'Transport and mobility'),
  ('Other', 'other', 'Other industries')
ON CONFLICT (name) DO NOTHING;