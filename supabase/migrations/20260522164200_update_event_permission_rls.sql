-- LEAD chapter activation: align event RLS with chapter permission grants.

BEGIN;

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
    AND public.has_chapter_permission(cm.chapter_id, 'chapter.dashboard.access')
  LIMIT 1;

  RETURN chapter_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_event_with_permission(
  check_event_id uuid,
  check_permission_key text
)
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
      FROM public.event e
      JOIN public.chapter_membership cm
        ON cm.user_id = auth.uid()
       AND cm.status = 'approved'
       AND (
         e.chapter_id = cm.chapter_id
         OR EXISTS (
           SELECT 1
           FROM public.event_chapter ec
           WHERE ec.event_id = e.id
             AND ec.chapter_id = cm.chapter_id
         )
       )
      WHERE e.id = check_event_id
        AND public.has_chapter_permission(cm.chapter_id, check_permission_key)
    );
$$;

COMMENT ON FUNCTION public.can_access_event_with_permission(uuid, text) IS
  'Returns true for admins or approved chapter members whose chapter owns/collaborates on the event and has the requested active grant.';

CREATE OR REPLACE FUNCTION public.is_event_editor(event_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT public.can_access_event_with_permission(event_uuid, 'chapter.events.manage');
$$;

DROP POLICY IF EXISTS "events_insert_own_chapter" ON public.event;
CREATE POLICY "events_insert_own_chapter" ON public.event
  FOR INSERT
  WITH CHECK (public.has_chapter_permission(chapter_id, 'chapter.events.manage'));

DROP POLICY IF EXISTS "events_read_own_chapter" ON public.event;
CREATE POLICY "events_read_own_chapter" ON public.event
  FOR SELECT
  USING (
    public.can_access_event_with_permission(id, 'chapter.events.manage')
    OR public.can_access_event_with_permission(id, 'chapter.events.view_registrations')
    OR public.can_access_event_with_permission(id, 'chapter.events.check_in')
    OR public.can_access_event_with_permission(id, 'chapter.events.archive')
  );

DROP POLICY IF EXISTS "events_update_own_or_collaborative" ON public.event;
CREATE POLICY "events_update_own_or_collaborative" ON public.event
  FOR UPDATE
  USING (public.can_access_event_with_permission(id, 'chapter.events.manage'))
  WITH CHECK (public.can_access_event_with_permission(id, 'chapter.events.manage'));

DROP POLICY IF EXISTS "events_delete_own_or_collaborative" ON public.event;
CREATE POLICY "events_delete_own_or_collaborative" ON public.event
  FOR DELETE
  USING (public.can_access_event_with_permission(id, 'chapter.events.archive'));

DROP POLICY IF EXISTS "event_chapter_insert_collab_event" ON public.event_chapter;
DROP POLICY IF EXISTS "event_chapter_insert_own_event" ON public.event_chapter;
DROP POLICY IF EXISTS "event_chapter_insert_manage_event" ON public.event_chapter;
CREATE POLICY "event_chapter_insert_manage_event" ON public.event_chapter
  FOR INSERT
  WITH CHECK (public.can_access_event_with_permission(event_id, 'chapter.events.manage'));

DROP POLICY IF EXISTS "event_chapter_delete_own" ON public.event_chapter;
CREATE POLICY "event_chapter_delete_own" ON public.event_chapter
  FOR DELETE
  USING (public.can_access_event_with_permission(event_id, 'chapter.events.manage'));

DROP POLICY IF EXISTS "event_registration_read_editor" ON public.event_registration;
CREATE POLICY "event_registration_read_editor" ON public.event_registration
  FOR SELECT
  USING (
    public.can_access_event_with_permission(event_id, 'chapter.events.view_registrations')
    OR public.can_access_event_with_permission(event_id, 'chapter.events.check_in')
    OR public.can_access_event_with_permission(event_id, 'chapter.events.manage')
  );

DROP POLICY IF EXISTS "event_registration_update_editor" ON public.event_registration;
CREATE POLICY "event_registration_update_editor" ON public.event_registration
  FOR UPDATE
  USING (
    public.can_access_event_with_permission(event_id, 'chapter.events.check_in')
    OR public.can_access_event_with_permission(event_id, 'chapter.events.manage')
  )
  WITH CHECK (
    public.can_access_event_with_permission(event_id, 'chapter.events.check_in')
    OR public.can_access_event_with_permission(event_id, 'chapter.events.manage')
  );

DROP POLICY IF EXISTS "Editors can read event answers" ON public.event_application_answer;
CREATE POLICY "Editors can read event answers"
  ON public.event_application_answer
  FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.event_registration er
      WHERE er.id = event_application_answer.registration_id
        AND (
          public.can_access_event_with_permission(er.event_id, 'chapter.events.view_registrations')
          OR public.can_access_event_with_permission(er.event_id, 'chapter.events.manage')
        )
    )
  );

DROP POLICY IF EXISTS "chapter_audit_log_insert_event_deleted" ON public.chapter_audit_log;
CREATE POLICY "chapter_audit_log_insert_event_deleted" ON public.chapter_audit_log
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    actor_user_id = auth.uid()
    AND action = 'chapter.event.deleted'
    AND entity_type = 'event'
    AND public.has_chapter_permission(chapter_id, 'chapter.events.archive')
  );

GRANT EXECUTE ON FUNCTION public.can_access_event_with_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_event_with_permission(uuid, text) TO service_role;

COMMIT;
