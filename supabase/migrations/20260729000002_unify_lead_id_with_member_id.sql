-- Unify person_profile.lead_id with chapter_membership.member_id.
--
-- Context: lead_id was originally issued sequentially (LEAD-000001...) while
-- member_id uses a random 6-digit scheme (LEAD-106684...). Both share the same
-- LEAD-XXXXXX format, so the same person could carry two different public IDs.
--
-- This migration:
--   1. Copies the existing random member_id into lead_id for profiles that have
--      a membership, so each user keeps exactly one stable public ID.
--   2. Assigns a fresh random LEAD ID to profiles without a membership (they only
--      carry a sequential lead_id today).
--   3. Drops the now-unused sequential issue_lead_id() function and lead_id_seq.
--
-- New LEAD IDs must stay in the [100001, 999999] range to match
-- lib/utils/member-id.ts (RANDOM_MIN / RANDOM_MAX).

DO $$
DECLARE
  rec RECORD;
  v_candidate text;
  v_collision boolean;
BEGIN
  -- 1) Unify: lead_id := member_id where a membership exists.
  UPDATE public.person_profile pp
  SET lead_id = cm.member_id
  FROM public.chapter_membership cm
  WHERE cm.user_id = pp.user_id
    AND cm.member_id IS NOT NULL
    AND pp.lead_id IS DISTINCT FROM cm.member_id;

  -- 2) Profiles without a membership: re-issue a random LEAD ID (retry on
  --    collision against both lead_id and member_id).
  FOR rec IN
    SELECT pp.user_id
    FROM public.person_profile pp
    WHERE pp.lead_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.chapter_membership cm
        WHERE cm.user_id = pp.user_id AND cm.member_id IS NOT NULL
      )
  LOOP
    LOOP
      v_candidate := 'LEAD-' || lpad(
        (floor(random() * 899999) + 100001)::int::text,
        6,
        '0'
      );

      SELECT EXISTS (
        SELECT 1 FROM public.person_profile WHERE lead_id = v_candidate
        UNION ALL
        SELECT 1 FROM public.chapter_membership WHERE member_id = v_candidate
      ) INTO v_collision;

      EXIT WHEN NOT v_collision;
    END LOOP;

    UPDATE public.person_profile
    SET lead_id = v_candidate
    WHERE user_id = rec.user_id;
  END LOOP;
END;
$$;

-- 3) Drop the sequential issuer now that generation lives in the service layer.
DROP FUNCTION IF EXISTS public.issue_lead_id(uuid);
DROP SEQUENCE IF EXISTS public.lead_id_seq;
