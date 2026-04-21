-- Create the profile_pictures storage bucket and its RLS policies.
--
-- Bucket is public (readable by anyone via public URL) but write access is
-- restricted: each user may only upload/update/delete files inside their own
-- folder (path prefix = their UID).  Only image MIME types are accepted.
--
-- File naming convention used by /api/profile/save:
--   <user_id>/avatar   (always overwrites the same path, no timestamp needed)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile_pictures',
  'profile_pictures',
  true,
  5242880,   -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Users can upload into their own folder
CREATE POLICY "Users can upload their own profile picture"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile_pictures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can overwrite their own files
CREATE POLICY "Users can update their own profile picture"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile_pictures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own files
CREATE POLICY "Users can delete their own profile picture"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile_pictures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
