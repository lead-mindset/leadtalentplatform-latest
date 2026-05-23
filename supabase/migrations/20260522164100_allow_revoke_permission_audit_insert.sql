-- LEAD chapter activation: allow scoped membership revocation audit inserts.

BEGIN;

DROP POLICY IF EXISTS "chapter_audit_log_insert_member_revoke" ON public.chapter_audit_log;
CREATE POLICY "chapter_audit_log_insert_member_revoke" ON public.chapter_audit_log
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    actor_user_id = auth.uid()
    AND action = 'chapter.membership.revoked'
    AND entity_type = 'chapter_membership'
    AND public.has_chapter_permission(chapter_id, 'chapter.members.revoke')
  );

COMMIT;
