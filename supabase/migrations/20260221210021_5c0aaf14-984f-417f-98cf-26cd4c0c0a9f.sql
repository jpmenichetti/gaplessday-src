
-- Make the bucket private
UPDATE storage.buckets SET public = false WHERE id = 'todo-images';

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view todo images" ON storage.objects;

-- Create ownership-based SELECT policy
CREATE POLICY "Users can view own todo images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'todo-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Drop and recreate DELETE policy with ownership check
DROP POLICY IF EXISTS "Users can delete own todo images" ON storage.objects;
CREATE POLICY "Users can delete own todo images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'todo-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Drop and recreate INSERT/UPDATE policies with ownership check
DROP POLICY IF EXISTS "Users can upload todo images" ON storage.objects;
CREATE POLICY "Users can upload todo images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'todo-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own todo images" ON storage.objects;
CREATE POLICY "Users can update own todo images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'todo-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
