-- Enable permissive RLS for funding_schemes to resolve 42501/401 errors
-- This allows both anon and authenticated users to insert/update/delete
-- Needed because the previous policy was restricted to 'authenticated' only

DO $$ 
BEGIN
    -- Drop existing restrictive policies if they conflict (though adding permissive ones usually works via OR)
    -- We'll just add permissive ones to be safe and ensure access.
    -- If policies already exist with these names, we drop them first to allow replacement.
    
    DROP POLICY IF EXISTS "Enable insert for all" ON public.funding_schemes;
    DROP POLICY IF EXISTS "Enable update for all" ON public.funding_schemes;
    DROP POLICY IF EXISTS "Enable delete for all" ON public.funding_schemes;
    DROP POLICY IF EXISTS "Enable select for all" ON public.funding_schemes;
END $$;

CREATE POLICY "Enable insert for all" 
ON public.funding_schemes 
FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Enable update for all" 
ON public.funding_schemes 
FOR UPDATE 
TO public 
USING (true);

CREATE POLICY "Enable delete for all" 
ON public.funding_schemes 
FOR DELETE 
TO public 
USING (true);

CREATE POLICY "Enable select for all" 
ON public.funding_schemes 
FOR SELECT 
TO public 
USING (true);
