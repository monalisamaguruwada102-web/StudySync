-- Create storage buckets
insert into storage.buckets (id, name, public)
values ('study-materials', 'study-materials', true)
on conflict (id) do nothing;

-- Set up RLS for the 'study-materials' bucket
-- Allow public access to read files
BEGIN;
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'study-materials' );
COMMIT;

-- Allow authenticated users to upload files
BEGIN;
  DROP POLICY IF EXISTS "Authenticated Users Upload" ON storage.objects;
  CREATE POLICY "Authenticated Users Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
      bucket_id = 'study-materials' 
      AND auth.role() = 'authenticated'
  );
COMMIT;

-- Allow users to delete their own files
BEGIN;
  DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
  CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (
      bucket_id = 'study-materials'
      AND (auth.uid())::text = owner::text
  );
COMMIT;
