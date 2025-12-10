-- Create storage bucket for funding scheme logos
-- This bucket stores logo images for funding schemes (PNG, JPG, SVG, WebP)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'funding-scheme-logos',
    'funding-scheme-logos',
    true,  -- Public bucket (logos need to be publicly accessible)
    2097152,  -- 2MB file size limit (sufficient for logos)
    ARRAY[
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/svg+xml',
        'image/webp'
    ]
)
ON CONFLICT (id) DO NOTHING;

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

COMMENT ON TABLE storage.buckets IS 'Storage bucket for funding scheme logo images (PNG, JPG, SVG, WebP)';
