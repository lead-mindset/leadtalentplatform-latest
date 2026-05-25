-- LEAD chapter activation: permission-aware roster and grant read policies.
-- These policies allow member-role e-board users to exercise granted permissions
-- without relying on legacy public.user.role='editor'.

BEGIN;

DROP POLICY IF EXISTS "chapter_permission_grant_select_own_approved_member" ON public.chapter_permission_grant;
CREATE POLICY "chapter_permission_grant_select_own_approved_member" ON public.chapter_permission_grant
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.chapter_membership cm
      WHERE cm.user_id = auth.uid()
        AND cm.chapter_id = chapter_permission_grant.chapter_id
        AND cm.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "chapter_membership_select_permissioned_viewers" ON public.chapter_membership;
CREATE POLICY "chapter_membership_select_permissioned_viewers" ON public.chapter_membership
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    (
      status = 'approved'
      AND public.has_chapter_permission(chapter_id, 'chapter.members.view_approved')
    )
    OR (
      status = 'alumni'
      AND public.has_chapter_permission(chapter_id, 'chapter.members.view_alumni')
    )
    OR (
      status = 'pending'
      AND public.has_chapter_permission(chapter_id, 'chapter.members.view_applicants')
    )
    OR (
      status = 'rejected'
      AND public.has_chapter_permission(chapter_id, 'chapter.members.view_rejected')
    )
    OR (
      status = 'inactive'
      AND public.has_chapter_permission(chapter_id, 'chapter.members.view_inactive')
    )
  );

COMMIT;

SELECT 'permissioned chapter roster RLS policies created' AS status
WHERE EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'chapter_membership'
    AND policyname = 'chapter_membership_select_permissioned_viewers'
)
AND EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'chapter_permission_grant'
    AND policyname = 'chapter_permission_grant_select_own_approved_member'
);
