-- Create storage bucket for funding scheme template documents (PDF/DOCX)
-- This bucket stores uploaded application guideline documents before AI parsing

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'funding-templates',
    'funding-templates',
    false,  -- Private bucket (only authenticated users)
    10485760,  -- 10MB file size limit
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']  -- PDF, DOCX, DOC
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload funding templates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'funding-templates');

-- Allow authenticated users to read their uploaded files
CREATE POLICY "Authenticated users can read funding templates"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'funding-templates');

-- Allow authenticated users to delete their uploaded files
CREATE POLICY "Authenticated users can delete funding templates"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'funding-templates');

-- Update existing files
CREATE POLICY "Authenticated users can update funding templates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'funding-templates')
WITH CHECK (bucket_id = 'funding-templates');

COMMENT ON TABLE storage.buckets IS 'Storage bucket for uploaded funding scheme guideline documents (PDF/DOCX)';
