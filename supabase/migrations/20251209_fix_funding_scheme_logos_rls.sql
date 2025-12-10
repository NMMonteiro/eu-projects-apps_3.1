-- Fix RLS policies for funding-scheme-logos bucket
-- This allows authenticated users to upload, read, update, and delete logo files

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload funding scheme logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to funding scheme logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete funding scheme logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update funding scheme logos" ON storage.objects;

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload funding scheme logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'funding-scheme-logos');

-- Allow public read access to logos (needed for display)
CREATE POLICY "Public read access to funding scheme logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'funding-scheme-logos');

-- Allow authenticated users to delete logos
CREATE POLICY "Authenticated users can delete funding scheme logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'funding-scheme-logos');

-- Allow authenticated users to update logos
CREATE POLICY "Authenticated users can update funding scheme logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'funding-scheme-logos')
WITH CHECK (bucket_id = 'funding-scheme-logos');
