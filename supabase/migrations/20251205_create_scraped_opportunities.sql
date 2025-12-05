-- Create table for caching scraped EU funding opportunities
-- This stores the enriched data from individual page scrapes

CREATE TABLE IF NOT EXISTS public.scraped_opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    call_id TEXT NOT NULL,
    status TEXT NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE,
    description TEXT,
    budget TEXT,
    eligibility TEXT,
    last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on URL for fast lookups
CREATE INDEX IF NOT EXISTS idx_scraped_opportunities_url ON public.scraped_opportunities(url);

-- Create index on last_scraped for cache invalidation queries
CREATE INDEX IF NOT EXISTS idx_scraped_opportunities_last_scraped ON public.scraped_opportunities(last_scraped);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_scraped_opportunities_status ON public.scraped_opportunities(status);

-- Create index on deadline for filtering
CREATE INDEX IF NOT EXISTS idx_scraped_opportunities_deadline ON public.scraped_opportunities(deadline);

-- Enable Row Level Security
ALTER TABLE public.scraped_opportunities ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read (public data)
CREATE POLICY "Allow public read access" ON public.scraped_opportunities
    FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert/update
CREATE POLICY "Allow authenticated insert/update" ON public.scraped_opportunities
    FOR ALL USING (auth.role() = 'authenticated');

COMMENT ON TABLE public.scraped_opportunities IS 'Cached scraped data from individual EU funding opportunity pages';
