-- LEAD chapter activation: allow scoped membership approval operations.
--
-- Chapter presidents and vice presidents are authorized by
-- chapter_permission_grant, not by legacy chapter_membership.position values.
-- This policy lets permissioned chapter operators update only the membership
-- lifecycle states they are allowed to manage.

BEGIN;

DROP POLICY IF EXISTS "chapter_membership_update_permissioned_managers" ON public.chapter_membership;
CREATE POLICY "chapter_membership_update_permissioned_managers" ON public.chapter_membership
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    (
      status = 'pending'
      AND public.has_chapter_permission(chapter_id, 'chapter.members.manage_applications')
    )
    OR (
      status = 'approved'
      AND public.has_chapter_permission(chapter_id, 'chapter.members.revoke')
    )
  )
  WITH CHECK (
    (
      status IN ('approved', 'rejected')
      AND public.has_chapter_permission(chapter_id, 'chapter.members.manage_applications')
    )
    OR (
      status = 'inactive'
      AND public.has_chapter_permission(chapter_id, 'chapter.members.revoke')
    )
  );

COMMIT;

SELECT 'permissioned chapter membership update RLS policy created' AS status
WHERE EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'chapter_membership'
    AND policyname = 'chapter_membership_update_permissioned_managers'
);
