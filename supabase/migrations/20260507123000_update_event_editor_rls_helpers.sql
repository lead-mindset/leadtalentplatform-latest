-- Align event editor RLS helpers with the canonical chapter_membership model.
-- The legacy implementation read student_profile, which hides event applications
-- from chapter editors after the account model migration.

CREATE OR REPLACE FUNCTION public.get_my_chapter_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  chapter_id text;
BEGIN
  SELECT cm.chapter_id INTO chapter_id
  FROM public.chapter_membership cm
  WHERE cm.user_id = auth.uid()
    AND cm.status = 'approved'
    AND cm.position IN ('president', 'vice_president', 'secretary', 'treasurer', 'editor')
  LIMIT 1;

  RETURN chapter_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_event_editor(event_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  my_chapter text;
BEGIN
  my_chapter := public.get_my_chapter_id();
  IF my_chapter IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.event e
    WHERE e.id = event_uuid
      AND (
        e.chapter_id = my_chapter
        OR EXISTS (
          SELECT 1
          FROM public.event_chapter ec
          WHERE ec.event_id = event_uuid
            AND ec.chapter_id = my_chapter
        )
      )
  );
END;
$$;
