-- Create table for storing EU funding opportunities
CREATE TABLE IF NOT EXISTS funding_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    status TEXT,
    deadline DATE,
    budget TEXT,
    funding_entity TEXT,
    topic TEXT,
    source TEXT DEFAULT 'EU Funding Portal',
    ccm_id TEXT,
    search_query TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on call_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_funding_opportunities_call_id ON funding_opportunities(call_id);

-- Create index on search_query for search history
CREATE INDEX IF NOT EXISTS idx_funding_opportunities_search_query ON funding_opportunities(search_query);

-- Create index on deadline for filtering
CREATE INDEX IF NOT EXISTS idx_funding_opportunities_deadline ON funding_opportunities(deadline);

-- Enable RLS
ALTER TABLE funding_opportunities ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (public data)
CREATE POLICY "Allow public read access" ON funding_opportunities
    FOR SELECT USING (true);

-- Allow authenticated users to insert/update
CREATE POLICY "Allow authenticated insert" ON funding_opportunities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated update" ON funding_opportunities
    FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
