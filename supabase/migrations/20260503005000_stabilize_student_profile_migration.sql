-- LEAD-010: Stabilize legacy student_profile migration into layered account model.
--
-- This migration is intentionally corrective and idempotent. Earlier copy
-- migrations moved data into person_profile/chapter_membership/lead_identity,
-- but some mappings were lossy:
-- - student_profile.major was copied into person_profile.university.
-- - chapter_membership used nullable member_id as the conflict key.
-- - identity creation ran before membership positions were normalized.
--
-- Field decisions:
-- - student_profile.major maps to person_profile.major_or_interest only.
-- - person_profile.university is not backfilled from student_profile because
--   legacy student_profile has no reliable university source.
-- - consent_date and is_filled have no direct target and remain historical
--   legacy fields until student_profile is removed in a later cleanup.
-- - member_id is preserved, but (user_id, chapter_id) is the target identity.

BEGIN;

-- ============================================
-- PRE-MIGRATION AUDITS
-- ============================================

DO $$
DECLARE
  missing_auth_users integer;
  invalid_chapters integer;
  duplicate_memberships integer;
  duplicate_member_ids integer;
  duplicate_approved_memberships integer;
  approved_target_conflicts integer;
BEGIN
  SELECT COUNT(*)
  INTO missing_auth_users
  FROM public.student_profile sp
  LEFT JOIN auth.users au ON au.id = sp.user_id
  WHERE au.id IS NULL;

  IF missing_auth_users > 0 THEN
    RAISE EXCEPTION 'LEAD-010 blocked: % student_profile rows have no matching auth.users row', missing_auth_users;
  END IF;

  SELECT COUNT(*)
  INTO invalid_chapters
  FROM public.student_profile sp
  LEFT JOIN public.chapter c ON c.id = sp.chapter_id
  WHERE sp.chapter_id IS NOT NULL
    AND c.id IS NULL;

  IF invalid_chapters > 0 THEN
    RAISE EXCEPTION 'LEAD-010 blocked: % student_profile rows reference missing chapters', invalid_chapters;
  END IF;

  SELECT COUNT(*)
  INTO duplicate_memberships
  FROM (
    SELECT sp.user_id, sp.chapter_id
    FROM public.student_profile sp
    WHERE sp.chapter_id IS NOT NULL
    GROUP BY sp.user_id, sp.chapter_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_memberships > 0 THEN
    RAISE EXCEPTION 'LEAD-010 blocked: % duplicate student_profile user/chapter pairs found', duplicate_memberships;
  END IF;

  SELECT COUNT(*)
  INTO duplicate_member_ids
  FROM (
    SELECT sp.member_id
    FROM public.student_profile sp
    WHERE sp.member_id IS NOT NULL
    GROUP BY sp.member_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_member_ids > 0 THEN
    RAISE EXCEPTION 'LEAD-010 blocked: % duplicate non-null student_profile.member_id values found', duplicate_member_ids;
  END IF;

  SELECT COUNT(*)
  INTO duplicate_approved_memberships
  FROM (
    SELECT sp.user_id
    FROM public.student_profile sp
    WHERE sp.approval_status = 'approved'::public.approval_status
    GROUP BY sp.user_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_approved_memberships > 0 THEN
    RAISE EXCEPTION 'LEAD-010 blocked: % users have multiple approved legacy student_profile rows', duplicate_approved_memberships;
  END IF;

  SELECT COUNT(*)
  INTO approved_target_conflicts
  FROM public.student_profile sp
  JOIN public.chapter_membership cm
    ON cm.user_id = sp.user_id
   AND cm.status = 'approved'::public.membership_status
   AND cm.chapter_id <> sp.chapter_id
  WHERE sp.approval_status = 'approved'::public.approval_status;

  IF approved_target_conflicts > 0 THEN
    RAISE EXCEPTION 'LEAD-010 blocked: % approved legacy memberships conflict with existing approved target memberships', approved_target_conflicts;
  END IF;
END $$;

-- ============================================
-- CORRECT PERSON PROFILE DATA
-- ============================================

INSERT INTO public.person_profile (
  id,
  user_id,
  university,
  major_or_interest,
  graduation_year,
  linkedin_url,
  skills,
  gender,
  is_recruiter_visible,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  sp.user_id,
  NULL,
  sp.major,
  sp.graduation_year,
  sp.linkedin_url,
  sp.skills,
  sp.gender,
  COALESCE(sp.is_recruiter_visible, false)
    OR COALESCE(sp.consent_recruiter_visibility, false),
  COALESCE(sp.created_at, NOW()),
  NOW()
FROM public.student_profile sp
ON CONFLICT (user_id) DO UPDATE
SET
  university = CASE
    WHEN public.person_profile.university = EXCLUDED.major_or_interest THEN NULL
    ELSE public.person_profile.university
  END,
  major_or_interest = EXCLUDED.major_or_interest,
  graduation_year = EXCLUDED.graduation_year,
  linkedin_url = EXCLUDED.linkedin_url,
  skills = EXCLUDED.skills,
  gender = EXCLUDED.gender,
  is_recruiter_visible = EXCLUDED.is_recruiter_visible,
  updated_at = NOW();

-- Correct rows written by the earlier major-as-university migration.
UPDATE public.person_profile pp
SET
  university = NULL,
  updated_at = NOW()
FROM public.student_profile sp
WHERE pp.user_id = sp.user_id
  AND pp.university = sp.major;

-- ============================================
-- CORRECT CHAPTER MEMBERSHIP DATA
-- ============================================

INSERT INTO public.chapter_membership (
  id,
  user_id,
  chapter_id,
  status,
  position,
  approved_by_id,
  member_id,
  joined_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  sp.user_id,
  sp.chapter_id,
  CASE sp.approval_status
    WHEN 'pending'::public.approval_status THEN 'pending'::public.membership_status
    WHEN 'approved'::public.approval_status THEN 'approved'::public.membership_status
    WHEN 'rejected'::public.approval_status THEN 'rejected'::public.membership_status
    ELSE 'inactive'::public.membership_status
  END,
  'member',
  CASE WHEN approver.id IS NOT NULL THEN sp.approved_by_id ELSE NULL END,
  sp.member_id,
  COALESCE(sp.created_at, NOW()),
  COALESCE(sp.created_at, NOW()),
  NOW()
FROM public.student_profile sp
LEFT JOIN auth.users approver ON approver.id = sp.approved_by_id
WHERE sp.chapter_id IS NOT NULL
ON CONFLICT (user_id, chapter_id) DO UPDATE
SET
  status = EXCLUDED.status,
  position = COALESCE(public.chapter_membership.position, EXCLUDED.position, 'member'),
  approved_by_id = EXCLUDED.approved_by_id,
  member_id = EXCLUDED.member_id,
  joined_at = COALESCE(public.chapter_membership.joined_at, EXCLUDED.joined_at),
  updated_at = NOW();

-- ============================================
-- CORRECT LEAD IDENTITY DATA
-- ============================================

INSERT INTO public.lead_identity (
  id,
  user_id,
  identity_type,
  chapter_id,
  is_primary,
  issued_by_id,
  issued_at,
  status,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  cm.user_id,
  CASE
    WHEN cm.position IN ('president', 'vice_president', 'secretary', 'treasurer', 'events_lead', 'marketing_lead', 'editor')
      THEN 'chapter_editor'::public.identity_type
    WHEN cm.status = 'alumni'::public.membership_status
      THEN 'alumni'::public.identity_type
    ELSE 'chapter_member'::public.identity_type
  END,
  cm.chapter_id,
  true,
  cm.approved_by_id,
  COALESCE(cm.joined_at, NOW()),
  'active'::public.identity_status,
  NOW(),
  NOW()
FROM public.chapter_membership cm
WHERE cm.status IN ('approved'::public.membership_status, 'alumni'::public.membership_status)
ON CONFLICT (user_id) DO UPDATE
SET
  identity_type = CASE
    WHEN public.lead_identity.identity_type IN ('founder'::public.identity_type, 'staff'::public.identity_type)
      THEN public.lead_identity.identity_type
    ELSE EXCLUDED.identity_type
  END,
  chapter_id = CASE
    WHEN public.lead_identity.identity_type IN ('founder'::public.identity_type, 'staff'::public.identity_type)
      THEN public.lead_identity.chapter_id
    ELSE EXCLUDED.chapter_id
  END,
  issued_by_id = COALESCE(public.lead_identity.issued_by_id, EXCLUDED.issued_by_id),
  issued_at = LEAST(public.lead_identity.issued_at, EXCLUDED.issued_at),
  status = 'active'::public.identity_status,
  updated_at = NOW();

-- ============================================
-- POST-MIGRATION VALIDATION
-- ============================================

DO $$
DECLARE
  missing_person_profiles integer;
  profile_mismatches integer;
  false_university_mappings integer;
  missing_memberships integer;
  membership_mismatches integer;
  missing_identities integer;
BEGIN
  SELECT COUNT(*)
  INTO missing_person_profiles
  FROM public.student_profile sp
  LEFT JOIN public.person_profile pp ON pp.user_id = sp.user_id
  WHERE pp.user_id IS NULL;

  IF missing_person_profiles > 0 THEN
    RAISE EXCEPTION 'LEAD-010 validation failed: % student_profile rows missing person_profile targets', missing_person_profiles;
  END IF;

  SELECT COUNT(*)
  INTO profile_mismatches
  FROM public.student_profile sp
  JOIN public.person_profile pp ON pp.user_id = sp.user_id
  WHERE pp.major_or_interest IS DISTINCT FROM sp.major
    OR pp.graduation_year IS DISTINCT FROM sp.graduation_year
    OR pp.linkedin_url IS DISTINCT FROM sp.linkedin_url
    OR pp.skills IS DISTINCT FROM sp.skills
    OR pp.gender IS DISTINCT FROM sp.gender
    OR COALESCE(pp.is_recruiter_visible, false) IS DISTINCT FROM (
      COALESCE(sp.is_recruiter_visible, false)
        OR COALESCE(sp.consent_recruiter_visibility, false)
    );

  IF profile_mismatches > 0 THEN
    RAISE EXCEPTION 'LEAD-010 validation failed: % person_profile rows do not match legacy reusable fields', profile_mismatches;
  END IF;

  SELECT COUNT(*)
  INTO false_university_mappings
  FROM public.student_profile sp
  JOIN public.person_profile pp ON pp.user_id = sp.user_id
  WHERE pp.university = sp.major;

  IF false_university_mappings > 0 THEN
    RAISE EXCEPTION 'LEAD-010 validation failed: % person_profile rows still copy major into university', false_university_mappings;
  END IF;

  SELECT COUNT(*)
  INTO missing_memberships
  FROM public.student_profile sp
  LEFT JOIN public.chapter_membership cm
    ON cm.user_id = sp.user_id
   AND cm.chapter_id = sp.chapter_id
  WHERE sp.chapter_id IS NOT NULL
    AND cm.id IS NULL;

  IF missing_memberships > 0 THEN
    RAISE EXCEPTION 'LEAD-010 validation failed: % legacy chapter rows missing chapter_membership targets', missing_memberships;
  END IF;

  SELECT COUNT(*)
  INTO membership_mismatches
  FROM public.student_profile sp
  JOIN public.chapter_membership cm
    ON cm.user_id = sp.user_id
   AND cm.chapter_id = sp.chapter_id
  WHERE sp.chapter_id IS NOT NULL
    AND (
      cm.status IS DISTINCT FROM CASE sp.approval_status
        WHEN 'pending'::public.approval_status THEN 'pending'::public.membership_status
        WHEN 'approved'::public.approval_status THEN 'approved'::public.membership_status
        WHEN 'rejected'::public.approval_status THEN 'rejected'::public.membership_status
        ELSE 'inactive'::public.membership_status
      END
      OR cm.member_id IS DISTINCT FROM sp.member_id
      OR cm.approved_by_id IS DISTINCT FROM (
        CASE
          WHEN EXISTS (SELECT 1 FROM auth.users approver WHERE approver.id = sp.approved_by_id)
            THEN sp.approved_by_id
          ELSE NULL
        END
      )
    );

  IF membership_mismatches > 0 THEN
    RAISE EXCEPTION 'LEAD-010 validation failed: % chapter_membership rows do not preserve legacy membership fields', membership_mismatches;
  END IF;

  SELECT COUNT(*)
  INTO missing_identities
  FROM public.chapter_membership cm
  LEFT JOIN public.lead_identity li
    ON li.user_id = cm.user_id
   AND li.status = 'active'::public.identity_status
  WHERE cm.status IN ('approved'::public.membership_status, 'alumni'::public.membership_status)
    AND li.user_id IS NULL;

  IF missing_identities > 0 THEN
    RAISE EXCEPTION 'LEAD-010 validation failed: % approved/alumni memberships missing active lead_identity rows', missing_identities;
  END IF;
END $$;

COMMIT;

-- ============================================
-- MANUAL VALIDATION QUERIES
-- ============================================

-- Source to target row coverage.
-- SELECT COUNT(*) AS legacy_profiles FROM public.student_profile;
-- SELECT COUNT(*) AS migrated_profiles
-- FROM public.student_profile sp
-- JOIN public.person_profile pp ON pp.user_id = sp.user_id;

-- Membership preservation.
-- SELECT sp.user_id, sp.chapter_id, sp.approval_status, cm.status, sp.member_id, cm.member_id
-- FROM public.student_profile sp
-- JOIN public.chapter_membership cm
--   ON cm.user_id = sp.user_id
--  AND cm.chapter_id = sp.chapter_id
-- ORDER BY sp.created_at DESC
-- LIMIT 20;

-- Confirm the old false university mapping is gone.
-- SELECT pp.user_id, pp.university, pp.major_or_interest
-- FROM public.person_profile pp
-- JOIN public.student_profile sp ON sp.user_id = pp.user_id
-- WHERE pp.university = sp.major;
