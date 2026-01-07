-- Create partners table
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    legal_name_national TEXT,
    acronym TEXT,
    organisation_id TEXT, -- OID or PIC
    pic TEXT,
    vat_number TEXT,
    business_id TEXT,
    organization_type TEXT, -- SME, University, Research, NGO, Public, etc.
    is_public_body BOOLEAN DEFAULT false,
    is_non_profit BOOLEAN DEFAULT false,
    country TEXT,
    legal_address TEXT,
    city TEXT,
    postcode TEXT,
    region TEXT,
    contact_email TEXT,
    website TEXT,
    description TEXT,
    department TEXT,
    keywords TEXT[],
    logo_url TEXT,
    pdf_url TEXT,
    
    -- Legal Representative
    legal_rep_name TEXT,
    legal_rep_position TEXT,
    legal_rep_email TEXT,
    legal_rep_phone TEXT,
    
    -- Contact Person
    contact_person_name TEXT,
    contact_person_position TEXT,
    contact_person_email TEXT,
    contact_person_phone TEXT,
    contact_person_role TEXT,
    
    -- Expertise & Experience
    experience TEXT,
    staff_skills TEXT,
    relevant_projects TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Create policies (Public for now as it's a demo/tool, but in prod would be tied to user/org)
CREATE POLICY "Allow public read access" ON public.partners FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.partners FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.partners FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.partners FOR DELETE USING (true);

-- Create a trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();
