-- Create funding_schemes table
-- This table stores dynamic proposal templates for different funding programs
-- Each scheme defines custom sections, character limits, and requirements

CREATE TABLE IF NOT EXISTS public.funding_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    template_json JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_funding_schemes_name ON public.funding_schemes(name);
CREATE INDEX IF NOT EXISTS idx_funding_schemes_is_default ON public.funding_schemes(is_default);
CREATE INDEX IF NOT EXISTS idx_funding_schemes_is_active ON public.funding_schemes(is_active);

-- Enable Row Level Security
ALTER TABLE public.funding_schemes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active schemes (public data)
CREATE POLICY "Allow public read access to active schemes" 
    ON public.funding_schemes
    FOR SELECT 
    USING (is_active = true);

-- Allow authenticated users to manage schemes
CREATE POLICY "Allow authenticated users to insert schemes" 
    ON public.funding_schemes
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update schemes" 
    ON public.funding_schemes
    FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete schemes" 
    ON public.funding_schemes
    FOR DELETE 
    USING (auth.role() = 'authenticated');

-- Add comment for documentation
COMMENT ON TABLE public.funding_schemes IS 'Stores dynamic proposal templates for different funding programs (Horizon Europe, Erasmus+, Creative Europe, etc.)';
COMMENT ON COLUMN public.funding_schemes.template_json IS 'JSONB structure containing sections, limits, and metadata for the funding scheme';
