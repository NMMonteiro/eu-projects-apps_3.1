-- Add funding_scheme_id column to proposals table
-- This enables proposals to be associated with specific funding scheme templates
-- Nullable for backward compatibility with existing proposals

ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS funding_scheme_id UUID REFERENCES public.funding_schemes(id) ON DELETE SET NULL;

-- Add dynamic_sections JSONB column for storing section content based on funding scheme
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS dynamic_sections JSONB DEFAULT '{}'::jsonb;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_proposals_funding_scheme_id 
    ON public.proposals(funding_scheme_id);

-- Add comments for documentation
COMMENT ON COLUMN public.proposals.funding_scheme_id IS 'Optional reference to funding scheme template used for this proposal';
COMMENT ON COLUMN public.proposals.dynamic_sections IS 'JSONB object storing dynamic section content based on funding scheme template (e.g., {"excellence": "text...", "impact": "text..."})';
