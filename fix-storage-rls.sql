-- CORRECTED RLS policies for funding-scheme-logos bucket
-- The issue: We need to allow the 'anon' role (used by the anon key), not just 'authenticated'

-- Drop all existing policies for this bucket
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload funding scheme logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to funding scheme logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete funding scheme logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update funding scheme logos" ON storage.objects;

-- Policy 1: Allow anon and authenticated users to upload
CREATE POLICY "Allow uploads to funding scheme logos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'funding-scheme-logos');

-- Policy 2: Allow everyone to read (public bucket)
CREATE POLICY "Allow public reads of funding scheme logos"
ON storage.objects
FOR SELECT
TO anon, authenticated, public
USING (bucket_id = 'funding-scheme-logos');

-- Policy 3: Allow anon and authenticated users to delete
CREATE POLICY "Allow deletes from funding scheme logos"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'funding-scheme-logos');

-- Policy 4: Allow anon and authenticated users to update
CREATE POLICY "Allow updates to funding scheme logos"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'funding-scheme-logos')
WITH CHECK (bucket_id = 'funding-scheme-logos');
