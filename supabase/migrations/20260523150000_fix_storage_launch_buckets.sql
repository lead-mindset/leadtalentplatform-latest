-- LEAD production readiness: make launch storage buckets explicit and align
-- Storage RLS with chapter-scoped permissions.

BEGIN;

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES
  (
    'event-covers',
    'event-covers',
    true,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
  ),
  (
    'resumes',
    'resumes',
    false,
    10485760,
    ARRAY['application/pdf']::text[]
  )
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

CREATE OR REPLACE FUNCTION public.can_upload_event_cover()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.chapter_membership cm
      WHERE cm.user_id = auth.uid()
        AND cm.status = 'approved'
        AND public.has_chapter_permission(cm.chapter_id, 'chapter.events.manage')
    );
$$;

COMMENT ON FUNCTION public.can_upload_event_cover() IS
  'Returns true when the signed-in user can manage events for at least one approved chapter.';

CREATE OR REPLACE FUNCTION public.can_access_resume_object(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT
    public.is_admin()
    OR (auth.uid() IS NOT NULL AND (storage.foldername(object_name))[1] = auth.uid()::text)
    OR EXISTS (
      SELECT 1
      FROM public.resume r
      JOIN public.person_profile pp
        ON pp.user_id = r.student_id
       AND pp.is_recruiter_visible = true
      JOIN public.chapter_membership cm
        ON cm.user_id = r.student_id
       AND cm.status = 'approved'
      JOIN public.recruiter_access ra
        ON ra.accepted_by_user_id = auth.uid()
       AND ra.is_active = true
       AND ra.revoked_at IS NULL
      WHERE r.file_url LIKE ('%/storage/v1/object/public/resumes/' || object_name)
    );
$$;

COMMENT ON FUNCTION public.can_access_resume_object(text) IS
  'Allows resume object reads for the owner, admins, or active recruiters when the resume belongs to visible approved talent.';

DROP POLICY IF EXISTS "Admins manage all event covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can read event covers" ON storage.objects;
DROP POLICY IF EXISTS "Editors delete own event covers" ON storage.objects;
DROP POLICY IF EXISTS "Editors update own event covers" ON storage.objects;
DROP POLICY IF EXISTS "Editors upload event covers" ON storage.objects;

CREATE POLICY "Public can read event covers"
  ON storage.objects
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (bucket_id = 'event-covers');

CREATE POLICY "Permissioned users can upload own event covers"
  ON storage.objects
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'event-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.can_upload_event_cover()
  );

CREATE POLICY "Permissioned users can update own event covers"
  ON storage.objects
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'event-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.can_upload_event_cover()
  )
  WITH CHECK (
    bucket_id = 'event-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.can_upload_event_cover()
  );

CREATE POLICY "Permissioned users can delete own event covers"
  ON storage.objects
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'event-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.can_upload_event_cover()
  );

DROP POLICY IF EXISTS "Allow authenticated uploads to resumes" ON storage.objects;
DROP POLICY IF EXISTS "Allow update resumes" ON storage.objects;
DROP POLICY IF EXISTS "Students upload own resume (alt)" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own resume" ON storage.objects;
DROP POLICY IF EXISTS "Users can update resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload resumes" ON storage.objects;

CREATE POLICY "Users can upload own resume"
  ON storage.objects
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read accessible resumes"
  ON storage.objects
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND public.can_access_resume_object(name)
  );

CREATE POLICY "Users can update own resume"
  ON storage.objects
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own resume"
  ON storage.objects
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

GRANT EXECUTE ON FUNCTION public.can_upload_event_cover() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_upload_event_cover() TO service_role;
GRANT EXECUTE ON FUNCTION public.can_access_resume_object(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_resume_object(text) TO service_role;

COMMIT;
