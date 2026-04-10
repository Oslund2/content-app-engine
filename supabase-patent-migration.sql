-- Patent Filing Preparation Tables
-- Run this in the Supabase SQL Editor for the content-app-engine project

CREATE TABLE IF NOT EXISTS patent_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  title TEXT NOT NULL DEFAULT 'Untitled Patent Application',
  status TEXT NOT NULL DEFAULT 'draft',
  filing_type TEXT NOT NULL DEFAULT 'provisional',
  inventor_name TEXT,
  inventor_citizenship TEXT DEFAULT 'US',
  specification TEXT,
  abstract TEXT,
  field_of_invention TEXT,
  background_art TEXT,
  summary_invention TEXT,
  detailed_description TEXT,
  invention_description TEXT,
  technical_field TEXT,
  prior_art_search_status TEXT NOT NULL DEFAULT 'pending',
  prior_art_search_completed_at TIMESTAMPTZ,
  novelty_score NUMERIC,
  novelty_analysis_id UUID,
  differentiation_analysis TEXT,
  claims_generation_status TEXT NOT NULL DEFAULT 'pending',
  drawings_generation_status TEXT NOT NULL DEFAULT 'pending',
  specification_generation_status TEXT NOT NULL DEFAULT 'pending',
  full_application_status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  inventors JSONB DEFAULT '[]',
  entity_status TEXT DEFAULT 'micro_entity',
  correspondence_address JSONB,
  attorney_info JSONB,
  cpc_classification JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patent_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES patent_applications(id) ON DELETE CASCADE,
  claim_number INTEGER NOT NULL,
  claim_type TEXT NOT NULL DEFAULT 'independent',
  claim_text TEXT NOT NULL,
  parent_claim_id UUID,
  status TEXT NOT NULL DEFAULT 'draft',
  category TEXT NOT NULL DEFAULT 'method',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patent_drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES patent_applications(id) ON DELETE CASCADE,
  figure_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  svg_content TEXT,
  image_url TEXT,
  drawing_type TEXT NOT NULL DEFAULT 'block_diagram',
  callouts JSONB DEFAULT '[]',
  blocks JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patent_prior_art_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES patent_applications(id) ON DELETE CASCADE,
  patent_number TEXT,
  title TEXT,
  abstract TEXT,
  relevance_score NUMERIC,
  similarity_score NUMERIC,
  similarity_explanation TEXT,
  is_blocking BOOLEAN DEFAULT false,
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patent_novelty_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES patent_applications(id) ON DELETE CASCADE,
  overall_score NUMERIC,
  approval_probability NUMERIC,
  approval_confidence NUMERIC,
  strength_rating TEXT,
  analysis_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_patent_apps_session ON patent_applications(session_id);
CREATE INDEX IF NOT EXISTS idx_patent_claims_app ON patent_claims(application_id);
CREATE INDEX IF NOT EXISTS idx_patent_drawings_app ON patent_drawings(application_id);
CREATE INDEX IF NOT EXISTS idx_patent_prior_art_app ON patent_prior_art_results(application_id);
CREATE INDEX IF NOT EXISTS idx_patent_novelty_app ON patent_novelty_analyses(application_id);
