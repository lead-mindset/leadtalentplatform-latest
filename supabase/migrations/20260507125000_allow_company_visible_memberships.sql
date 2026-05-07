BEGIN;

-- Company representatives need approved chapter context for visible talent.
-- Keep this narrow: active company access, recruiter-visible profile, approved membership only.
DROP POLICY IF EXISTS "chapter_membership_select_company_visible" ON public.chapter_membership;

CREATE POLICY "chapter_membership_select_company_visible" ON public.chapter_membership
FOR SELECT
USING (
  status = 'approved'
  AND EXISTS (
    SELECT 1
    FROM public.person_profile pp
    WHERE pp.user_id = chapter_membership.user_id
      AND pp.is_recruiter_visible = true
  )
  AND EXISTS (
    SELECT 1
    FROM public.recruiter_access ra
    WHERE ra.accepted_by_user_id = auth.uid()
      AND ra.is_active = true
      AND ra.revoked_at IS NULL
      AND (
        ra.invite_expires_at IS NULL
        OR ra.invite_expires_at > now()
      )
  )
);

COMMIT;
