-- Allow permissioned chapter operators to read owned events directly.
--
-- The existing event read policy resolves permissions through
-- can_access_event_with_permission(event.id, ...), which works for normal
-- reads but can fail during INSERT ... RETURNING because the helper queries the
-- event table before the inserted row is visible to that nested lookup.
-- This direct chapter policy keeps the same chapter permission model while
-- making event creation/editing mutations return their changed row reliably.

BEGIN;

DROP POLICY IF EXISTS "events_read_permissioned_chapter_direct" ON public.event;
CREATE POLICY "events_read_permissioned_chapter_direct" ON public.event
  FOR SELECT
  USING (
    public.has_chapter_permission(chapter_id, 'chapter.events.manage')
    OR public.has_chapter_permission(chapter_id, 'chapter.events.view_registrations')
    OR public.has_chapter_permission(chapter_id, 'chapter.events.check_in')
    OR public.has_chapter_permission(chapter_id, 'chapter.events.archive')
  );

COMMIT;
