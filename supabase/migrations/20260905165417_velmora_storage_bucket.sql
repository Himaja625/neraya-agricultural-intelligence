/*
# Create crop-images storage bucket

1. Storage
- Create a public storage bucket named "crop-images" for farmer crop photos
- Set public so images can be displayed in the app
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('crop-images', 'crop-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to crop-images
DROP POLICY IF EXISTS "Authenticated users can upload crop images" ON storage.objects;
CREATE POLICY "Authenticated users can upload crop images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'crop-images');

-- Allow public read of crop images
DROP POLICY IF EXISTS "Public can read crop images" ON storage.objects;
CREATE POLICY "Public can read crop images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'crop-images');

-- Allow authenticated users to update own crop images
DROP POLICY IF EXISTS "Users can update own crop images" ON storage.objects;
CREATE POLICY "Users can update own crop images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'crop-images' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'crop-images' AND auth.uid() = owner);

-- Allow authenticated users to delete own crop images
DROP POLICY IF EXISTS "Users can delete own crop images" ON storage.objects;
CREATE POLICY "Users can delete own crop images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'crop-images' AND auth.uid() = owner);
