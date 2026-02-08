-- Create storage buckets
insert into storage.buckets (id, name, public)
values ('study-materials', 'study-materials', true)
on conflict (id) do nothing;

-- Set up RLS for the 'study-materials' bucket
-- Allow public access to read files (since it's a public bucket, this is default, but explicit for clarity)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'study-materials' );

-- Allow authenticated users to upload files
create policy "Authenticated Users Upload"
on storage.objects for insert
with check (
    bucket_id = 'study-materials' 
    AND auth.role() = 'authenticated'
);

-- Allow users to delete their own files
create policy "Users can delete their own files"
on storage.objects for delete
using (
    bucket_id = 'study-materials'
    AND (auth.uid())::text = owner::text
);
