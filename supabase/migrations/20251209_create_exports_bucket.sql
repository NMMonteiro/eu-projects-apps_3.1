
-- Create a new private bucket 'exports' for generated documents
insert into storage.buckets (id, name, public)
values ('exports', 'exports', false)
on conflict (id) do nothing;

-- Set up security policies for the exports bucket
-- Allow authenticated users to upload files (if needed) or just service role
-- For now, we'll allow authenticated users to read their own files if we were linking them to users
-- But since the specific use case handles signed URLs from the generated file, simple bucket existence is key.

-- Allow public access? No, we use signed URLs.
