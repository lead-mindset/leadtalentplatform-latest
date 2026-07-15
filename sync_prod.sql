-- === Migration: 20260502062800_add_recruiter_visible_to_person_profile.sql ===
-- Migration: 012_add_recruiter_visible_to_person_profile.sql
-- Purpose: Add explicit opt-in for recruiter visibility
-- Pre-validation: SELECT COUNT(*) FROM person_profile;
-- Post-validation: Row counts match between old and new column

BEGIN;

-- ============================================
-- ADD COLUMN: is_recruiter_visible
-- ============================================

ALTER TABLE person_profile
ADD COLUMN IF NOT EXISTS is_recruiter_visible boolean DEFAULT false;

-- Index for recruiter queries
CREATE INDEX IF NOT EXISTS idx_person_profile_recruiter_visible
ON person_profile(is_recruiter_visible)
WHERE is_recruiter_visible = true;

-- ============================================
-- MIGRATE DATA: Copy from student_profile
-- ============================================

UPDATE person_profile pp
SET is_recruiter_visible = sp.is_recruiter_visible
FROM student_profile sp
WHERE pp.user_id = sp.user_id
AND sp.is_recruiter_visible = true;

-- ============================================
-- POST-VALIDATION
-- ============================================

DO $$
DECLARE visible_count_old INTEGER;
DECLARE visible_count_new INTEGER;
BEGIN
    SELECT COUNT(*) INTO visible_count_old
    FROM student_profile
    WHERE is_recruiter_visible = true;

    SELECT COUNT(*) INTO visible_count_new
    FROM person_profile
    WHERE is_recruiter_visible = true;

    IF visible_count_new != visible_count_old THEN
        RAISE EXCEPTION 'Data mismatch: old=% new=%', visible_count_old, visible_count_new;
    END IF;

    RAISE NOTICE 'Migration verified: % users opted into recruiter visibility', visible_count_new;
END $$;

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT is_recruiter_visible, COUNT(*) as users
FROM person_profile
GROUP BY is_recruiter_visible;


-- === Migration: 20260503000000_define_rls_new_account_model.sql ===
-- LEAD-003: Define RLS and Access Matrix for New Account Model
-- Resolves recursion, admin lockout, and tight recruiter scope.

-- ==============================================================================
-- 1. Helper Functions (SECURITY DEFINER to prevent recursion & infinite loops)
-- ==============================================================================

-- Check if user is admin via JWT (fastest, no DB lookup)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'role'), '') = 'admin';
$$;

-- Check if user is recruiter via JWT
CREATE OR REPLACE FUNCTION public.is_recruiter()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'role'), '') = 'recruiter';
$$;

-- Check if user is chapter editor (Security Definer to bypass RLS recursion on chapter_membership)
CREATE OR REPLACE FUNCTION public.is_chapter_editor(check_chapter_id text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chapter_membership cm
    WHERE cm.user_id = auth.uid()
      AND cm.chapter_id = check_chapter_id
      AND cm.position IN ('president', 'vice_president', 'secretary', 'treasurer', 'editor')
      AND cm.status = 'approved'
  );
$$;

-- ==============================================================================
-- 2. ENABLE RLS
-- ==============================================================================

ALTER TABLE public.person_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_application_question ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_application_answer ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. POLICIES
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table: person_profile
-- ------------------------------------------------------------------------------
-- Admin: ALL
CREATE POLICY "person_profile_admin_all" ON public.person_profile
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- User: SELECT/UPDATE own
CREATE POLICY "person_profile_select_own" ON public.person_profile
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "person_profile_update_own" ON public.person_profile
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Editor: SELECT own (already covered by select_own)
-- Recruiter: SELECT only if user is an active recruiter and student is visible
CREATE POLICY "person_profile_select_recruiter" ON public.person_profile
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    is_recruiter_visible = true
    AND EXISTS (
      SELECT 1 FROM public.recruiter_access ra
      WHERE ra.accepted_by_user_id = auth.uid()
      AND ra.is_active = true
      AND ra.revoked_at IS NULL
    )
  );

-- ------------------------------------------------------------------------------
-- Table: chapter_membership
-- ------------------------------------------------------------------------------
-- Admin: ALL
CREATE POLICY "chapter_membership_admin_all" ON public.chapter_membership
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Editor: SELECT members of their own chapter
CREATE POLICY "chapter_membership_select_editor" ON public.chapter_membership
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_chapter_editor(chapter_id));

-- Editor: UPDATE members of their own chapter
CREATE POLICY "chapter_membership_update_editor" ON public.chapter_membership
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.is_chapter_editor(chapter_id))
  WITH CHECK (public.is_chapter_editor(chapter_id));

-- User: SELECT/INSERT/UPDATE own
CREATE POLICY "chapter_membership_select_own" ON public.chapter_membership
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "chapter_membership_insert_own" ON public.chapter_membership
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "chapter_membership_update_own" ON public.chapter_membership
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- Table: lead_identity
-- ------------------------------------------------------------------------------
-- Admin: ALL
CREATE POLICY "lead_identity_admin_all" ON public.lead_identity
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- User/Editor/Recruiter: SELECT own
CREATE POLICY "lead_identity_select_own" ON public.lead_identity
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (user_id = auth.uid());
-- No insert/update (managed by backend triggers/functions)

-- ------------------------------------------------------------------------------
-- Table: newsletter_subscription
-- ------------------------------------------------------------------------------
-- Admin: ALL
CREATE POLICY "newsletter_subscription_admin_all" ON public.newsletter_subscription
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- User: ALL own
CREATE POLICY "newsletter_subscription_all_own" ON public.newsletter_subscription
  AS PERMISSIVE FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Editor: SELECT subscribers scoped to their chapter
CREATE POLICY "newsletter_subscription_select_editor" ON public.newsletter_subscription
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_chapter_editor(chapter_id));

-- ------------------------------------------------------------------------------
-- Table: event_application_question
-- ------------------------------------------------------------------------------
-- Note: Requires a helper to find the chapter_id for an event.

CREATE OR REPLACE FUNCTION public.get_event_chapter_id(check_event_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT chapter_id FROM public.event WHERE id = check_event_id;
$$;

-- Admin: ALL
CREATE POLICY "event_application_question_admin_all" ON public.event_application_question
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Editor: ALL within chapter
CREATE POLICY "event_application_question_editor_all" ON public.event_application_question
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_chapter_editor(public.get_event_chapter_id(event_id)))
  WITH CHECK (public.is_chapter_editor(public.get_event_chapter_id(event_id)));

-- User: SELECT only
CREATE POLICY "event_application_question_select_all" ON public.event_application_question
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (true); -- Questions are public/visible to applicants

-- ------------------------------------------------------------------------------
-- Table: event_application_answer
-- ------------------------------------------------------------------------------
-- Admin: ALL
CREATE POLICY "event_application_answer_admin_all" ON public.event_application_answer
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Editor: SELECT/UPDATE within chapter
-- Need helper to link answer -> question -> event -> chapter
CREATE OR REPLACE FUNCTION public.get_question_chapter_id(check_question_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT e.chapter_id 
  FROM public.event_application_question q
  JOIN public.event e ON q.event_id = e.id
  WHERE q.id = check_question_id;
$$;

CREATE POLICY "event_application_answer_select_editor" ON public.event_application_answer
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_chapter_editor(public.get_question_chapter_id(question_id)));

CREATE POLICY "event_application_answer_update_editor" ON public.event_application_answer
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.is_chapter_editor(public.get_question_chapter_id(question_id)))
  WITH CHECK (public.is_chapter_editor(public.get_question_chapter_id(question_id)));

-- User: SELECT/INSERT/UPDATE own
CREATE POLICY "event_application_answer_select_own" ON public.event_application_answer
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.event_registration er
    WHERE er.id = registration_id AND er.user_id = auth.uid()
  ));

CREATE POLICY "event_application_answer_insert_own" ON public.event_application_answer
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.event_registration er
    WHERE er.id = registration_id AND er.user_id = auth.uid()
  ));

CREATE POLICY "event_application_answer_update_own" ON public.event_application_answer
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.event_registration er
    WHERE er.id = registration_id AND er.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.event_registration er
    WHERE er.id = registration_id AND er.user_id = auth.uid()
  ));


-- === Migration: 20260503001000_fix_legacy_user_references.sql ===
-- LEAD-004: Repair legacy auth helpers to match the actual public."user" table.
-- The base schema creates public."user", but older functions reference public."User".

BEGIN;

CREATE OR REPLACE FUNCTION public.call_welcome_email_function()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  service_role_key text;
BEGIN
  service_role_key := current_setting('app.service_role_key', true);

  IF service_role_key IS NULL OR service_role_key = '' THEN
    RETURN NEW;
  END IF;

  PERFORM extensions.http_post(
    'https://sboibxszratyaswwursb.supabase.co/functions/v1/welcome-email',
    json_build_object(
      'userId', NEW.id,
      'email', NEW.email,
      'name', COALESCE(NEW.name, 'there')
    ),
    headers := json_build_object('Authorization', 'Bearer ' || service_role_key)
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public."user" u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT u.role::text
  FROM public."user" u
  WHERE u.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT COALESCE(
    (
      SELECT u.role::text
      FROM public."user" u
      WHERE u.id = user_id
    ),
    'member'
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  INSERT INTO public."user" (
    id,
    email,
    name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    'member',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    updated_at = now();

  RETURN NEW;
END;
$$;

COMMIT;


-- === Migration: 20260503002000_chapter_membership_foundation.sql ===
-- LEAD-006: Chapter membership foundation
-- Adds explicit alumni status and database invariants for chapter applications.

ALTER TYPE public.membership_status ADD VALUE IF NOT EXISTS 'alumni';

UPDATE public.chapter_membership
SET
  position = 'member',
  updated_at = NOW()
WHERE position IS NULL;

ALTER TABLE public.chapter_membership
  ADD CONSTRAINT chapter_membership_position_check
  CHECK (
    position IS NULL
    OR position IN (
      'member',
      'president',
      'vice_president',
      'secretary',
      'treasurer',
      'events_lead',
      'marketing_lead',
      'editor'
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_membership_user_chapter_unique
  ON public.chapter_membership(user_id, chapter_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_membership_one_approved_per_user
  ON public.chapter_membership(user_id)
  WHERE status = 'approved';


-- === Migration: 20260503003000_newsletter_subscription_foundation.sql ===
-- Migration: LEAD-008 Newsletter Subscription Foundation
-- Purpose: Enforce one logical global/chapter newsletter preference row per user.
-- Status: Forward-only

BEGIN;

-- Keep the table compatible with future campaign planning by preserving
-- inactive/unsubscribed rows instead of deleting preference history.
DELETE FROM public.newsletter_subscription ns
USING public.newsletter_subscription newer
WHERE ns.id <> newer.id
  AND ns.user_id = newer.user_id
  AND ns.scope = 'global'
  AND newer.scope = 'global'
  AND newer.created_at >= ns.created_at;

DELETE FROM public.newsletter_subscription ns
USING public.newsletter_subscription newer
WHERE ns.id <> newer.id
  AND ns.user_id = newer.user_id
  AND ns.scope = 'chapter'
  AND newer.scope = 'chapter'
  AND ns.chapter_id = newer.chapter_id
  AND newer.created_at >= ns.created_at;

ALTER TABLE public.newsletter_subscription
  DROP CONSTRAINT IF EXISTS newsletter_subscription_scope_chapter_check;

ALTER TABLE public.newsletter_subscription
  ADD CONSTRAINT newsletter_subscription_scope_chapter_check
  CHECK (
    (scope = 'global' AND chapter_id IS NULL)
    OR
    (scope = 'chapter' AND chapter_id IS NOT NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscription_one_global_per_user
  ON public.newsletter_subscription(user_id)
  WHERE scope = 'global';

CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscription_one_chapter_per_user
  ON public.newsletter_subscription(user_id, chapter_id)
  WHERE scope = 'chapter';

CREATE INDEX IF NOT EXISTS idx_newsletter_subscription_active_chapter_campaigns
  ON public.newsletter_subscription(chapter_id, status)
  WHERE scope = 'chapter';

COMMIT;


-- === Migration: 20260503004000_event_application_foundation.sql ===
-- Migration: LEAD-009 Event Application Foundation
-- Purpose: Support native event application questions and structured answers.
-- Status: Forward-only

BEGIN;

-- Native application questions can now be the primary application path.
-- Keep application_form_url as optional legacy/external-form metadata.
ALTER TABLE public.event
  DROP CONSTRAINT IF EXISTS event_application_url_required;

ALTER TABLE public.event_application_question
  DROP CONSTRAINT IF EXISTS event_application_question_sort_order_nonnegative;

ALTER TABLE public.event_application_question
  ADD CONSTRAINT event_application_question_sort_order_nonnegative
  CHECK (sort_order >= 0);

ALTER TABLE public.event_application_answer
  ADD COLUMN IF NOT EXISTS answer_json jsonb;

COMMENT ON COLUMN public.event_application_answer.answer_json IS
  'Structured answer payload for multi-value application question types such as checkbox.';

COMMIT;


-- === Migration: 20260503005000_stabilize_student_profile_migration.sql ===
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


-- === Migration: 20260503006000_lead_identity_multi_identity_primary.sql ===
-- LEAD-017: Allow multiple LEAD identities per user with one active primary.
--
-- Earlier identity work modeled lead_identity as one row per user. The product
-- model now allows a user to hold multiple active identities, while display
-- surfaces should resolve exactly one primary active identity.

BEGIN;

-- Drop the legacy one-identity-per-user uniqueness, regardless of generated name.
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname
  INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'lead_identity'
    AND con.contype = 'u'
    AND (
      SELECT array_agg(att.attname ORDER BY cols.ordinality)
      FROM unnest(con.conkey) WITH ORDINALITY AS cols(attnum, ordinality)
      JOIN pg_attribute att
        ON att.attrelid = rel.oid
       AND att.attnum = cols.attnum
    )::text[] = ARRAY['user_id'];

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.lead_identity DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- Remove duplicate active rows for the exact identity target before adding the index.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, identity_type, COALESCE(chapter_id, '__global__')
      ORDER BY is_primary DESC, issued_at ASC, created_at ASC, id ASC
    ) AS row_number
  FROM public.lead_identity
  WHERE status = 'active'::public.identity_status
)
UPDATE public.lead_identity li
SET
  status = 'revoked'::public.identity_status,
  revoked_at = COALESCE(li.revoked_at, NOW()),
  is_primary = false,
  updated_at = NOW()
FROM ranked
WHERE ranked.id = li.id
  AND ranked.row_number > 1;

-- Normalize any existing multiple primary rows to one deterministic primary per user.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY
        CASE identity_type
          WHEN 'founder'::public.identity_type THEN 1
          WHEN 'staff'::public.identity_type THEN 2
          WHEN 'chapter_editor'::public.identity_type THEN 3
          WHEN 'chapter_member'::public.identity_type THEN 4
          WHEN 'alumni'::public.identity_type THEN 5
          ELSE 99
        END,
        issued_at DESC,
        created_at DESC,
        id ASC
    ) AS row_number
  FROM public.lead_identity
  WHERE status = 'active'::public.identity_status
    AND is_primary = true
)
UPDATE public.lead_identity li
SET
  is_primary = ranked.row_number = 1,
  updated_at = NOW()
FROM ranked
WHERE ranked.id = li.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_identity_one_active_target
  ON public.lead_identity (user_id, identity_type, COALESCE(chapter_id, '__global__'))
  WHERE status = 'active'::public.identity_status;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_identity_one_active_primary
  ON public.lead_identity (user_id)
  WHERE status = 'active'::public.identity_status
    AND is_primary = true;

COMMIT;


-- === Migration: 20260507120000_drop_recursive_chapter_membership_policies.sql ===
-- Drop legacy chapter_membership policies that query chapter_membership from
-- inside chapter_membership RLS and can trigger infinite recursion.

DROP POLICY IF EXISTS "Editors can manage chapter memberships" ON public.chapter_membership;
DROP POLICY IF EXISTS "Users can read own memberships" ON public.chapter_membership;
DROP POLICY IF EXISTS "Users can insert own membership" ON public.chapter_membership;
DROP POLICY IF EXISTS "Service role full access to memberships" ON public.chapter_membership;


-- === Migration: 20260507123000_update_event_editor_rls_helpers.sql ===
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


-- === Migration: 20260507124000_update_application_approval_rpc.sql ===
-- Align application approval RPC with the canonical event_registration table.
-- The legacy implementation updated public."EventRegistration", which no longer
-- backs the live event application review flow.

CREATE OR REPLACE FUNCTION public.bulk_approve_applications(
  p_event_id uuid,
  p_application_ids uuid[],
  p_approved_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_current_count integer;
  v_capacity integer;
  v_updated_count integer;
  v_capacity_warning boolean := false;
  v_capacity_status text := 'ok';
BEGIN
  SELECT COUNT(*) INTO v_current_count
  FROM public.event_registration
  WHERE event_id = p_event_id
    AND status = 'registered';

  SELECT capacity INTO v_capacity
  FROM public.event
  WHERE id = p_event_id;

  IF v_capacity IS NOT NULL
    AND (v_current_count + COALESCE(array_length(p_application_ids, 1), 0)) >= v_capacity THEN
    v_capacity_warning := true;
    v_capacity_status :=
      CASE
        WHEN (v_current_count + COALESCE(array_length(p_application_ids, 1), 0)) > v_capacity
          THEN 'over_capacity'
        ELSE 'at_capacity'
      END;
  END IF;

  UPDATE public.event_registration
  SET
    status = 'registered',
    qr_token = COALESCE(qr_token, gen_random_uuid())
  WHERE id = ANY(p_application_ids)
    AND event_id = p_event_id
    AND status = 'pending_review';

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'capacity_warning', v_capacity_warning,
    'capacity_status', v_capacity_status,
    'updated_count', v_updated_count,
    'approved_by', p_approved_by
  );
END;
$$;


-- === Migration: 20260507125000_allow_company_visible_memberships.sql ===
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


-- === Migration: 20260507180000_fix_admin_rls_app_role.sql ===
-- LEAD QA stabilization: admin RLS must use the canonical app role.
--
-- Supabase JWT role is usually "authenticated"; platform authorization lives in
-- public.user.role. Keep this helper independent from profile tables to avoid
-- admin lockouts while still honoring the canonical account model.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."user" u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;


-- === Migration: 20260508173000_ensure_event_covers_bucket.sql ===
BEGIN;

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'event-covers',
  'event-covers',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

COMMIT;


-- === Migration: 20260508180000_fix_event_application_question_editor_rls.sql ===
BEGIN;

DROP POLICY IF EXISTS "Editors can manage event questions" ON public.event_application_question;

CREATE POLICY "Editors can manage event questions"
  ON public.event_application_question
  FOR ALL
  USING (public.is_admin() OR public.is_event_editor(event_id))
  WITH CHECK (public.is_admin() OR public.is_event_editor(event_id));

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
        AND public.is_event_editor(er.event_id)
    )
  );

COMMIT;


-- === Migration: 20260511120000_add_pathway_feature_flags.sql ===
BEGIN;

CREATE TABLE IF NOT EXISTS public.pathway_feature_flag (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id text NULL REFERENCES public.chapter(id) ON DELETE CASCADE,
  enable_check_in boolean NOT NULL DEFAULT false,
  enable_recommendation_card boolean NOT NULL DEFAULT false,
  enable_growth_reflection boolean NOT NULL DEFAULT false,
  enable_chapter_insights boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by_id uuid NULL REFERENCES public."user"(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS pathway_feature_flag_global_unique
  ON public.pathway_feature_flag ((chapter_id IS NULL))
  WHERE chapter_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS pathway_feature_flag_chapter_unique
  ON public.pathway_feature_flag (chapter_id)
  WHERE chapter_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS pathway_feature_flag_chapter_lookup
  ON public.pathway_feature_flag (chapter_id);

ALTER TABLE public.pathway_feature_flag ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pathway_feature_flag_admin_all" ON public.pathway_feature_flag;
DROP POLICY IF EXISTS "pathway_feature_flag_service_read" ON public.pathway_feature_flag;

CREATE POLICY "pathway_feature_flag_admin_all"
  ON public.pathway_feature_flag
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "pathway_feature_flag_service_read"
  ON public.pathway_feature_flag
  AS PERMISSIVE FOR SELECT TO service_role
  USING (true);

COMMIT;


-- === Migration: 20260511121000_add_pathway_check_ins.sql ===
create table if not exists public.pathway_check_in (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public."user"(id) on delete cascade,
  chapter_id text null references public.chapter(id) on delete set null,
  status text not null default 'not_started',
  looking_for text null,
  current_blocker text null,
  study_interest text null,
  confidence_level integer null,
  monthly_time_commitment text null,
  submitted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pathway_check_in_status_check
    check (status in ('not_started', 'in_progress', 'completed')),
  constraint pathway_check_in_confidence_level_check
    check (confidence_level is null or confidence_level between 1 and 5),
  constraint pathway_check_in_monthly_time_commitment_check
    check (
      monthly_time_commitment is null
      or monthly_time_commitment in ('one_hour', 'two_to_four_hours', 'five_plus_hours')
    )
);

create unique index if not exists pathway_check_in_user_unique
  on public.pathway_check_in (user_id);

alter table public.pathway_check_in enable row level security;

drop policy if exists "pathway_check_in_admin_all" on public.pathway_check_in;
create policy "pathway_check_in_admin_all"
  on public.pathway_check_in
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "pathway_check_in_student_select_own" on public.pathway_check_in;
create policy "pathway_check_in_student_select_own"
  on public.pathway_check_in
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "pathway_check_in_student_insert_own" on public.pathway_check_in;
create policy "pathway_check_in_student_insert_own"
  on public.pathway_check_in
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "pathway_check_in_student_update_own" on public.pathway_check_in;
create policy "pathway_check_in_student_update_own"
  on public.pathway_check_in
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "pathway_check_in_service_read" on public.pathway_check_in;
create policy "pathway_check_in_service_read"
  on public.pathway_check_in
  for select
  to service_role
  using (true);


-- === Migration: 20260511122000_add_pathway_growth_outputs.sql ===
alter table public.pathway_check_in
  add column if not exists growth_stage text null,
  add column if not exists primary_focus text null;

alter table public.pathway_check_in
  drop constraint if exists pathway_check_in_growth_stage_check,
  add constraint pathway_check_in_growth_stage_check
    check (
      growth_stage is null
      or growth_stage in ('explorer', 'builder', 'leader', 'candidate', 'emerging_professional')
    );

alter table public.pathway_check_in
  drop constraint if exists pathway_check_in_primary_focus_check,
  add constraint pathway_check_in_primary_focus_check
    check (
      primary_focus is null
      or primary_focus in (
        'career_exploration',
        'technical_experience',
        'opportunity_readiness',
        'community_mentorship',
        'leadership'
      )
    );


-- === Migration: 20260511123000_add_pathway_recommendations.sql ===
create table if not exists public.pathway_recommendation (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid not null references public.pathway_check_in(id) on delete cascade,
  user_id uuid not null references public."user"(id) on delete cascade,
  category text not null,
  status text not null default 'active',
  title text not null,
  body text not null,
  reason text not null,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pathway_recommendation_category_check
    check (category in ('learn', 'connect', 'prove')),
  constraint pathway_recommendation_status_check
    check (status in ('active', 'started', 'completed', 'dismissed'))
);

create unique index if not exists pathway_recommendation_check_in_category_unique
  on public.pathway_recommendation (check_in_id, category);

alter table public.pathway_recommendation enable row level security;

drop policy if exists "pathway_recommendation_admin_all" on public.pathway_recommendation;
create policy "pathway_recommendation_admin_all"
  on public.pathway_recommendation
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "pathway_recommendation_student_select_own" on public.pathway_recommendation;
create policy "pathway_recommendation_student_select_own"
  on public.pathway_recommendation
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "pathway_recommendation_student_update_own" on public.pathway_recommendation;
create policy "pathway_recommendation_student_update_own"
  on public.pathway_recommendation
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "pathway_recommendation_service_read" on public.pathway_recommendation;
create policy "pathway_recommendation_service_read"
  on public.pathway_recommendation
  for select
  to service_role
  using (true);


-- === Migration: 20260511124000_add_growth_reflections.sql ===
create table if not exists public.growth_reflection (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public."user"(id) on delete cascade,
  recommendation_id uuid null references public.pathway_recommendation(id) on delete set null,
  status text not null default 'draft',
  visibility text not null default 'private',
  participated_in text not null,
  learned text not null,
  skill_or_mindset text not null,
  goal_connection text not null,
  next_move text not null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint growth_reflection_status_check
    check (status in ('draft', 'completed', 'transformed')),
  constraint growth_reflection_visibility_check
    check (visibility in ('private', 'student_selected_for_profile', 'recruiter_visible', 'archived'))
);

alter table public.growth_reflection enable row level security;

drop policy if exists "growth_reflection_admin_all" on public.growth_reflection;
create policy "growth_reflection_admin_all"
  on public.growth_reflection
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "growth_reflection_student_select_own" on public.growth_reflection;
create policy "growth_reflection_student_select_own"
  on public.growth_reflection
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "growth_reflection_student_insert_own" on public.growth_reflection;
create policy "growth_reflection_student_insert_own"
  on public.growth_reflection
  for insert
  to authenticated
  with check (user_id = auth.uid() and visibility = 'private');

drop policy if exists "growth_reflection_student_update_own_private" on public.growth_reflection;
create policy "growth_reflection_student_update_own_private"
  on public.growth_reflection
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- === Migration: 20260511125000_link_growth_reflections_to_events.sql ===
alter table public.growth_reflection
  add column if not exists event_id uuid null references public.event(id) on delete set null;


-- === Migration: 20260522160000_add_chapter_preapproval.sql ===
-- LEAD chapter activation: preapproved member and e-board emails.
-- Real chapter email lists must be loaded operationally, not committed here.

BEGIN;

CREATE TABLE IF NOT EXISTS public.chapter_preapproval (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  normalized_email text NOT NULL,
  chapter_id text NOT NULL REFERENCES public.chapter(id) ON DELETE CASCADE,
  preapproval_type text NOT NULL,
  role_level text,
  functional_area text,
  display_title text,
  raw_title text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '6 months'),
  consumed_at timestamptz,
  consumed_by_user_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  revoked_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  created_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'manual_admin',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chapter_preapproval_email_not_empty
    CHECK (length(btrim(email)) > 0),
  CONSTRAINT chapter_preapproval_normalized_email_not_empty
    CHECK (length(btrim(normalized_email)) > 0),
  CONSTRAINT chapter_preapproval_normalized_email_matches_email
    CHECK (normalized_email = lower(btrim(email))),
  CONSTRAINT chapter_preapproval_type_check
    CHECK (preapproval_type IN ('member', 'eboard')),
  CONSTRAINT chapter_preapproval_source_not_empty
    CHECK (length(btrim(source)) > 0),
  CONSTRAINT chapter_preapproval_role_fields_by_type
    CHECK (
      (
        preapproval_type = 'member'
        AND role_level IS NULL
        AND functional_area IS NULL
        AND display_title IS NULL
      )
      OR
      (
        preapproval_type = 'eboard'
        AND role_level IS NOT NULL
        AND length(btrim(role_level)) > 0
        AND functional_area IS NOT NULL
        AND length(btrim(functional_area)) > 0
        AND display_title IS NOT NULL
        AND length(btrim(display_title)) > 0
      )
    ),
  CONSTRAINT chapter_preapproval_expires_after_created
    CHECK (expires_at > created_at),
  CONSTRAINT chapter_preapproval_consumed_requires_user
    CHECK (
      (consumed_at IS NULL AND consumed_by_user_id IS NULL)
      OR (consumed_at IS NOT NULL AND consumed_by_user_id IS NOT NULL)
    ),
  CONSTRAINT chapter_preapproval_revoked_requires_user
    CHECK (
      (revoked_at IS NULL AND revoked_by_id IS NULL)
      OR (revoked_at IS NOT NULL AND revoked_by_id IS NOT NULL)
    )
);

COMMENT ON TABLE public.chapter_preapproval IS
  'Email-bound preapproval records for verified chapter member and e-board activation.';

COMMENT ON COLUMN public.chapter_preapproval.normalized_email IS
  'Lowercase trimmed email used for exact claim matching.';

COMMENT ON COLUMN public.chapter_preapproval.preapproval_type IS
  'member auto-approves membership; eboard also creates role assignment and permission grants in service code.';

CREATE INDEX IF NOT EXISTS idx_chapter_preapproval_normalized_email_active
  ON public.chapter_preapproval(normalized_email)
  WHERE consumed_at IS NULL
    AND revoked_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_preapproval_active_email_chapter
  ON public.chapter_preapproval(normalized_email, chapter_id)
  WHERE consumed_at IS NULL
    AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chapter_preapproval_chapter_type
  ON public.chapter_preapproval(chapter_id, preapproval_type);

CREATE INDEX IF NOT EXISTS idx_chapter_preapproval_expires_at
  ON public.chapter_preapproval(expires_at);

ALTER TABLE public.chapter_preapproval ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chapter_preapproval_admin_all" ON public.chapter_preapproval;
CREATE POLICY "chapter_preapproval_admin_all" ON public.chapter_preapproval
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON TABLE public.chapter_preapproval FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chapter_preapproval TO authenticated;
GRANT ALL ON TABLE public.chapter_preapproval TO service_role;

COMMIT;

SELECT 'chapter_preapproval created' AS status
WHERE EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'chapter_preapproval'
);

SELECT 'chapter_preapproval indexes created' AS status
WHERE EXISTS (
  SELECT 1
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'chapter_preapproval'
    AND indexname = 'idx_chapter_preapproval_active_email_chapter'
);



-- === Migration: 20260522161000_add_chapter_role_assignment_permission_grant.sql ===
-- LEAD chapter activation: official chapter responsibilities and scoped permissions.
-- This migration adds schema only. Permission helper/RLS expansion follows separately.

BEGIN;

CREATE TABLE IF NOT EXISTS public.chapter_role_assignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  chapter_id text NOT NULL REFERENCES public.chapter(id) ON DELETE CASCADE,
  role_level text NOT NULL,
  functional_area text NOT NULL,
  display_title text NOT NULL,
  raw_title text,
  is_primary boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active',
  assigned_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'manual',
  source_preapproval_id uuid REFERENCES public.chapter_preapproval(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chapter_role_assignment_role_level_check
    CHECK (
      role_level IN (
        'president',
        'vice_president',
        'chief_of_staff',
        'director',
        'coordinator',
        'member'
      )
    ),
  CONSTRAINT chapter_role_assignment_functional_area_check
    CHECK (
      functional_area IN (
        'general_leadership',
        'strategy_operations',
        'marketing_communications',
        'events_experience',
        'finance_legal',
        'chapter_development',
        'academic_excellence',
        'professional_development',
        'leadership',
        'women_in_stem',
        'research',
        'projects',
        'partnerships_external_relations',
        'people_talent',
        'other'
      )
    ),
  CONSTRAINT chapter_role_assignment_display_title_not_empty
    CHECK (length(btrim(display_title)) > 0),
  CONSTRAINT chapter_role_assignment_status_check
    CHECK (status IN ('active', 'inactive')),
  CONSTRAINT chapter_role_assignment_source_check
    CHECK (source IN ('manual', 'manual_admin', 'preapproval', 'migration')),
  CONSTRAINT chapter_role_assignment_source_not_empty
    CHECK (length(btrim(source)) > 0),
  CONSTRAINT chapter_role_assignment_lifecycle_check
    CHECK (
      (status = 'active' AND ends_at IS NULL)
      OR
      (status = 'inactive' AND ends_at IS NOT NULL AND ends_at > starts_at)
    )
);

COMMENT ON TABLE public.chapter_role_assignment IS
  'Official chapter responsibility/title assignments for approved chapter members.';

COMMENT ON COLUMN public.chapter_role_assignment.role_level IS
  'Normalized seniority such as president, vice_president, chief_of_staff, director, coordinator, or member.';

COMMENT ON COLUMN public.chapter_role_assignment.functional_area IS
  'Normalized responsibility area used for reporting and permission templates.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_role_assignment_one_active_primary
  ON public.chapter_role_assignment(user_id, chapter_id)
  WHERE is_primary = true
    AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_chapter_role_assignment_chapter_status
  ON public.chapter_role_assignment(chapter_id, status);

CREATE INDEX IF NOT EXISTS idx_chapter_role_assignment_user_chapter
  ON public.chapter_role_assignment(user_id, chapter_id);

CREATE INDEX IF NOT EXISTS idx_chapter_role_assignment_source_preapproval
  ON public.chapter_role_assignment(source_preapproval_id);

CREATE TABLE IF NOT EXISTS public.chapter_permission_grant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  chapter_id text NOT NULL REFERENCES public.chapter(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  source text NOT NULL,
  source_role_assignment_id uuid REFERENCES public.chapter_role_assignment(id) ON DELETE SET NULL,
  granted_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  revoke_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chapter_permission_grant_permission_key_check
    CHECK (
      permission_key IN (
        'chapter.dashboard.access',
        'chapter.members.view_approved',
        'chapter.members.view_alumni',
        'chapter.members.view_member_contact',
        'chapter.members.view_applicants',
        'chapter.members.view_rejected',
        'chapter.members.view_inactive',
        'chapter.members.manage_applications',
        'chapter.members.revoke',
        'chapter.roles.assign_eboard',
        'chapter.events.manage',
        'chapter.events.view_registrations',
        'chapter.events.check_in',
        'chapter.events.archive',
        'chapter.funding.view',
        'chapter.funding.submit',
        'chapter.funding.review',
        'chapter.pulse.view',
        'chapter.pulse.manage_action_plan',
        'chapter.impact_metrics.view',
        'chapter.impact_metrics.edit'
      )
    ),
  CONSTRAINT chapter_permission_grant_source_check
    CHECK (source IN ('role_template', 'manual_admin', 'preapproval', 'migration')),
  CONSTRAINT chapter_permission_grant_source_not_empty
    CHECK (length(btrim(source)) > 0),
  CONSTRAINT chapter_permission_grant_revoke_check
    CHECK (
      (
        revoked_at IS NULL
        AND revoked_by_id IS NULL
        AND revoke_reason IS NULL
      )
      OR
      (
        revoked_at IS NOT NULL
        AND revoked_by_id IS NOT NULL
        AND revoke_reason IS NOT NULL
        AND length(btrim(revoke_reason)) > 0
      )
    )
);

COMMENT ON TABLE public.chapter_permission_grant IS
  'Chapter-scoped product capabilities for official chapter operators.';

COMMENT ON COLUMN public.chapter_permission_grant.permission_key IS
  'Action key such as chapter.dashboard.access or chapter.events.check_in.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_permission_active_unique
  ON public.chapter_permission_grant(user_id, chapter_id, permission_key)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chapter_permission_user_chapter
  ON public.chapter_permission_grant(user_id, chapter_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chapter_permission_chapter_key
  ON public.chapter_permission_grant(chapter_id, permission_key)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chapter_permission_source_assignment
  ON public.chapter_permission_grant(source_role_assignment_id);

ALTER TABLE public.chapter_role_assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_permission_grant ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chapter_role_assignment_admin_all" ON public.chapter_role_assignment;
CREATE POLICY "chapter_role_assignment_admin_all" ON public.chapter_role_assignment
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "chapter_permission_grant_admin_all" ON public.chapter_permission_grant;
CREATE POLICY "chapter_permission_grant_admin_all" ON public.chapter_permission_grant
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON TABLE public.chapter_role_assignment FROM anon;
REVOKE ALL ON TABLE public.chapter_permission_grant FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chapter_role_assignment TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chapter_permission_grant TO authenticated;
GRANT ALL ON TABLE public.chapter_role_assignment TO service_role;
GRANT ALL ON TABLE public.chapter_permission_grant TO service_role;

COMMIT;

SELECT 'chapter role and permission tables created' AS status
WHERE EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'chapter_role_assignment'
)
AND EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'chapter_permission_grant'
);

SELECT 'chapter permission unique index created' AS status
WHERE EXISTS (
  SELECT 1
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'chapter_permission_grant'
    AND indexname = 'idx_chapter_permission_active_unique'
);



-- === Migration: 20260522162000_add_chapter_audit_log_permission_helper.sql ===
-- LEAD chapter activation: audit log and canonical chapter permission helper.

BEGIN;

CREATE TABLE IF NOT EXISTS public.chapter_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  actor_user_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  chapter_id text REFERENCES public.chapter(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chapter_audit_log_action_not_empty
    CHECK (length(btrim(action)) > 0),
  CONSTRAINT chapter_audit_log_entity_type_not_empty
    CHECK (length(btrim(entity_type)) > 0),
  CONSTRAINT chapter_audit_log_metadata_object
    CHECK (jsonb_typeof(metadata) = 'object')
);

COMMENT ON TABLE public.chapter_audit_log IS
  'Audit history for sensitive chapter preapproval, role, permission, membership, and event operations.';

COMMENT ON COLUMN public.chapter_audit_log.metadata IS
  'Structured operation context. Must be a JSON object.';

CREATE INDEX IF NOT EXISTS idx_chapter_audit_log_chapter_created
  ON public.chapter_audit_log(chapter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chapter_audit_log_action_created
  ON public.chapter_audit_log(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chapter_audit_log_actor_created
  ON public.chapter_audit_log(actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chapter_audit_log_target_created
  ON public.chapter_audit_log(target_user_id, created_at DESC);

ALTER TABLE public.chapter_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chapter_audit_log_admin_all" ON public.chapter_audit_log;
CREATE POLICY "chapter_audit_log_admin_all" ON public.chapter_audit_log
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.has_chapter_permission(
  check_chapter_id text,
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
      FROM public.chapter_permission_grant cpg
      JOIN public.chapter_membership cm
        ON cm.user_id = cpg.user_id
       AND cm.chapter_id = cpg.chapter_id
       AND cm.status = 'approved'
      JOIN public."user" u
        ON u.id = cpg.user_id
      WHERE cpg.user_id = auth.uid()
        AND cpg.chapter_id = check_chapter_id
        AND cpg.permission_key = check_permission_key
        AND cpg.revoked_at IS NULL
        AND u.role <> 'recruiter'
    );
$$;

COMMENT ON FUNCTION public.has_chapter_permission(text, text) IS
  'Returns true for admins or approved non-recruiter chapter members with an active unrevoked permission grant.';

GRANT EXECUTE ON FUNCTION public.has_chapter_permission(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_chapter_permission(text, text) TO service_role;

REVOKE ALL ON TABLE public.chapter_audit_log FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chapter_audit_log TO authenticated;
GRANT ALL ON TABLE public.chapter_audit_log TO service_role;

COMMIT;

SELECT 'chapter audit log and permission helper created' AS status
WHERE EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'chapter_audit_log'
)
AND EXISTS (
  SELECT 1
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'has_chapter_permission'
);



-- === Migration: 20260522163000_backfill_legacy_editor_permissions.sql ===
-- Backfill legacy global editors into explicit chapter-scoped role assignments and grants.
-- Legacy editors map to chief_of_staff so they retain applicant/event operations without
-- receiving newer member-revoke or e-board-assignment powers.

WITH legacy_editors AS (
  SELECT
    u.id AS user_id,
    cm.chapter_id,
    cm.approved_by_id
  FROM public."user" u
  JOIN public.chapter_membership cm
    ON cm.user_id = u.id
   AND cm.status = 'approved'
  WHERE u.role = 'editor'
),
inserted_assignments AS (
  INSERT INTO public.chapter_role_assignment (
    user_id,
    chapter_id,
    role_level,
    functional_area,
    display_title,
    raw_title,
    is_primary,
    status,
    assigned_by_id,
    source,
    source_preapproval_id
  )
  SELECT
    le.user_id,
    le.chapter_id,
    'chief_of_staff',
    'strategy_operations',
    'Legacy Chapter Editor',
    'legacy_editor',
    true,
    'active',
    le.approved_by_id,
    'migration',
    NULL::uuid
  FROM legacy_editors le
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.chapter_role_assignment existing
    WHERE existing.user_id = le.user_id
      AND existing.chapter_id = le.chapter_id
      AND existing.status = 'active'
  )
  RETURNING id, user_id, chapter_id
),
legacy_assignments AS (
  SELECT
    ia.id,
    ia.user_id,
    ia.chapter_id
  FROM inserted_assignments ia
  UNION
  SELECT
    cra.id,
    le.user_id,
    le.chapter_id
  FROM legacy_editors le
  JOIN public.chapter_role_assignment cra
    ON cra.user_id = le.user_id
   AND cra.chapter_id = le.chapter_id
   AND cra.status = 'active'
),
permission_keys(permission_key) AS (
  VALUES
    ('chapter.dashboard.access'),
    ('chapter.members.view_approved'),
    ('chapter.members.view_alumni'),
    ('chapter.members.view_member_contact'),
    ('chapter.members.view_applicants'),
    ('chapter.members.view_rejected'),
    ('chapter.members.view_inactive'),
    ('chapter.members.manage_applications'),
    ('chapter.events.manage'),
    ('chapter.events.view_registrations'),
    ('chapter.events.check_in'),
    ('chapter.events.archive')
)
INSERT INTO public.chapter_permission_grant (
  user_id,
  chapter_id,
  permission_key,
  source,
  source_role_assignment_id,
  granted_by_id
)
SELECT DISTINCT
  la.user_id,
  la.chapter_id,
  pk.permission_key,
  'migration',
  la.id,
  NULL::uuid
FROM legacy_assignments la
CROSS JOIN permission_keys pk
WHERE NOT EXISTS (
  SELECT 1
  FROM public.chapter_permission_grant existing
  WHERE existing.user_id = la.user_id
    AND existing.chapter_id = la.chapter_id
    AND existing.permission_key = pk.permission_key
    AND existing.revoked_at IS NULL
);

SELECT 'legacy editor permission backfill complete' AS status;


-- === Migration: 20260522164000_add_inactive_membership_status.sql ===
-- LEAD chapter activation: represent revoked active memberships explicitly.

BEGIN;

ALTER TYPE public.membership_status ADD VALUE IF NOT EXISTS 'inactive';

COMMIT;


-- === Migration: 20260522164100_allow_revoke_permission_audit_insert.sql ===
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


-- === Migration: 20260522164200_update_event_permission_rls.sql ===
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


-- === Migration: 20260522164300_add_role_assignment_operator_rls.sql ===
-- LEAD chapter activation: allow scoped e-board role assignment operations.

BEGIN;

DROP POLICY IF EXISTS "chapter_role_assignment_select_chapter_operators" ON public.chapter_role_assignment;
CREATE POLICY "chapter_role_assignment_select_chapter_operators" ON public.chapter_role_assignment
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.has_chapter_permission(chapter_id, 'chapter.members.view_approved')
    OR public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard')
  );

DROP POLICY IF EXISTS "chapter_role_assignment_insert_regular_eboard" ON public.chapter_role_assignment;
CREATE POLICY "chapter_role_assignment_insert_regular_eboard" ON public.chapter_role_assignment
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    assigned_by_id = auth.uid()
    AND source = 'manual'
    AND status = 'active'
    AND role_level IN ('chief_of_staff', 'director', 'coordinator')
    AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard')
  );

DROP POLICY IF EXISTS "chapter_role_assignment_update_regular_eboard" ON public.chapter_role_assignment;
CREATE POLICY "chapter_role_assignment_update_regular_eboard" ON public.chapter_role_assignment
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    role_level IN ('chief_of_staff', 'director', 'coordinator')
    AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard')
  )
  WITH CHECK (
    role_level IN ('chief_of_staff', 'director', 'coordinator')
    AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard')
  );

DROP POLICY IF EXISTS "chapter_permission_grant_select_role_assigner" ON public.chapter_permission_grant;
CREATE POLICY "chapter_permission_grant_select_role_assigner" ON public.chapter_permission_grant
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard'));

DROP POLICY IF EXISTS "chapter_permission_grant_insert_role_template_assigner" ON public.chapter_permission_grant;
CREATE POLICY "chapter_permission_grant_insert_role_template_assigner" ON public.chapter_permission_grant
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    source = 'role_template'
    AND granted_by_id = auth.uid()
    AND revoked_at IS NULL
    AND revoked_by_id IS NULL
    AND revoke_reason IS NULL
    AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard')
    AND EXISTS (
      SELECT 1
      FROM public.chapter_role_assignment cra
      WHERE cra.id = source_role_assignment_id
        AND cra.user_id = chapter_permission_grant.user_id
        AND cra.chapter_id = chapter_permission_grant.chapter_id
        AND cra.assigned_by_id = auth.uid()
        AND cra.status = 'active'
        AND cra.role_level IN ('chief_of_staff', 'director', 'coordinator')
    )
  );

DROP POLICY IF EXISTS "chapter_permission_grant_update_role_template_assigner" ON public.chapter_permission_grant;
CREATE POLICY "chapter_permission_grant_update_role_template_assigner" ON public.chapter_permission_grant
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    source = 'role_template'
    AND revoked_at IS NULL
    AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard')
    AND EXISTS (
      SELECT 1
      FROM public.chapter_role_assignment cra
      WHERE cra.id = source_role_assignment_id
        AND cra.user_id = chapter_permission_grant.user_id
        AND cra.chapter_id = chapter_permission_grant.chapter_id
        AND cra.role_level IN ('chief_of_staff', 'director', 'coordinator')
    )
  )
  WITH CHECK (
    source = 'role_template'
    AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard')
    AND EXISTS (
      SELECT 1
      FROM public.chapter_role_assignment cra
      WHERE cra.id = source_role_assignment_id
        AND cra.user_id = chapter_permission_grant.user_id
        AND cra.chapter_id = chapter_permission_grant.chapter_id
        AND cra.role_level IN ('chief_of_staff', 'director', 'coordinator')
    )
  );

DROP POLICY IF EXISTS "chapter_audit_log_insert_role_assignment" ON public.chapter_audit_log;
CREATE POLICY "chapter_audit_log_insert_role_assignment" ON public.chapter_audit_log
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    actor_user_id = auth.uid()
    AND action IN ('chapter.role.assigned', 'chapter.role.deactivated')
    AND entity_type = 'chapter_role_assignment'
    AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard')
  );

COMMIT;


-- === Migration: 20260522164400_add_permissioned_member_roster_rls.sql ===
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


-- === Migration: 20260523140500_add_permissioned_membership_update_rls.sql ===
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


-- === Migration: 20260523142000_add_ulima_chapter.sql ===
-- Add LEAD ULIMA as an official chapter for launch preapprovals.

BEGIN;

INSERT INTO public.chapter (
  id,
  name,
  university,
  city,
  region,
  created_at,
  updated_at,
  instagram_url,
  latitude,
  longitude,
  location_point
) VALUES (
  'leadulima',
  'LEAD ULIMA',
  'Universidad de Lima',
  'Lima',
  'Lima',
  current_date,
  now(),
  'https://instagram.com/lead.at.ulima',
  -12.0844624,
  -76.9713278,
  public.ST_SetSRID(public.ST_MakePoint(-76.9713278, -12.0844624), 4326)
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  university = EXCLUDED.university,
  city = EXCLUDED.city,
  region = EXCLUDED.region,
  instagram_url = EXCLUDED.instagram_url,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  location_point = EXCLUDED.location_point,
  updated_at = now();

COMMIT;

SELECT 'LEAD ULIMA chapter available' AS status
WHERE EXISTS (
  SELECT 1
  FROM public.chapter
  WHERE id = 'leadulima'
);


-- === Migration: 20260523150000_fix_storage_launch_buckets.sql ===
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


-- === Migration: 20260523161000_add_public_event_listing_view.sql ===
CREATE OR REPLACE VIEW public.published_event_listing AS
SELECT
  e.id,
  e.title,
  e.description,
  e.cover_image,
  e.start_at,
  e.end_at,
  e.location,
  e.meeting_url,
  e.event_type,
  e.capacity,
  e.is_published,
  e.access_model,
  e.application_form_url,
  e.chapter_id,
  e.created_by_id,
  e.created_at,
  e.updated_at,
  e.location_name,
  e.location_address,
  e.location_city,
  e.location_region,
  e.location_latitude,
  e.location_longitude,
  c.name AS chapter_name,
  c.university AS chapter_university,
  c.city AS chapter_city,
  c.region AS chapter_region,
  COUNT(er.id)::integer AS registrations_count
FROM public.event e
LEFT JOIN public.chapter c ON c.id = e.chapter_id
LEFT JOIN public.event_registration er
  ON er.event_id = e.id
  AND er.status = 'registered'
WHERE e.is_published = true
GROUP BY
  e.id,
  c.id;

ALTER VIEW public.published_event_listing OWNER TO postgres;

GRANT SELECT ON TABLE public.published_event_listing TO anon;
GRANT SELECT ON TABLE public.published_event_listing TO authenticated;
GRANT SELECT ON TABLE public.published_event_listing TO service_role;


-- === Migration: 20260524050000_allow_permissioned_event_returning.sql ===
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


-- === Migration: 20260525120000_add_lead_funding_foundation.sql ===
-- LEAD Funding: request-based funding workflow foundation.
--
-- This migration creates the data model, RLS boundaries, and private storage
-- bucket needed for chapter-scoped funding requests. Payments/transfers remain
-- offline in v1.

BEGIN;

CREATE TABLE IF NOT EXISTS public.funding_request (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id text NOT NULL REFERENCES public.chapter(id) ON DELETE CASCADE,
  requester_user_id uuid NOT NULL REFERENCES public."user"(id),
  event_id uuid REFERENCES public.event(id) ON DELETE SET NULL,
  title text NOT NULL,
  purpose text NOT NULL,
  expected_audience text NOT NULL,
  expected_attendee_count integer,
  requested_amount numeric(12,2) NOT NULL,
  approved_amount numeric(12,2),
  actual_spend_amount numeric(12,2),
  currency text NOT NULL DEFAULT 'PEN',
  status text NOT NULL DEFAULT 'draft',
  okr_keys text[] NOT NULL DEFAULT '{}'::text[],
  pillar_keys text[] NOT NULL DEFAULT '{}'::text[],
  partner_name text,
  partner_details text,
  supporting_notes text,
  event_date date NOT NULL,
  is_late_request boolean NOT NULL DEFAULT false,
  submitted_at timestamptz,
  reviewed_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  admin_decision_note text,
  internal_funding_source text,
  internal_funding_source_note text,
  accountability_due_at date,
  accountability_submitted_at timestamptz,
  accountability_note text,
  result_summary text,
  closed_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  closed_at timestamptz,
  closure_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT funding_request_title_not_empty
    CHECK (length(btrim(title)) > 0),
  CONSTRAINT funding_request_purpose_not_empty
    CHECK (length(btrim(purpose)) > 0),
  CONSTRAINT funding_request_expected_audience_not_empty
    CHECK (length(btrim(expected_audience)) > 0),
  CONSTRAINT funding_request_expected_attendee_count_nonnegative
    CHECK (expected_attendee_count IS NULL OR expected_attendee_count >= 0),
  CONSTRAINT funding_request_requested_amount_positive
    CHECK (requested_amount > 0),
  CONSTRAINT funding_request_approved_amount_nonnegative
    CHECK (approved_amount IS NULL OR approved_amount >= 0),
  CONSTRAINT funding_request_actual_spend_amount_nonnegative
    CHECK (actual_spend_amount IS NULL OR actual_spend_amount >= 0),
  CONSTRAINT funding_request_approved_not_above_requested
    CHECK (approved_amount IS NULL OR approved_amount <= requested_amount),
  CONSTRAINT funding_request_currency_check
    CHECK (currency IN ('PEN', 'USD')),
  CONSTRAINT funding_request_status_check
    CHECK (
      status IN (
        'draft',
        'submitted',
        'changes_requested',
        'approved',
        'rejected',
        'receipts_due',
        'closed'
      )
    ),
  CONSTRAINT funding_request_internal_source_check
    CHECK (
      internal_funding_source IS NULL
      OR internal_funding_source IN (
        'lead_peru_chapter_budget',
        'lead_wide_event_budget',
        'sponsor_partner',
        'hola_benevity',
        'other'
      )
    ),
  CONSTRAINT funding_request_okr_keys_valid
    CHECK (
      okr_keys <@ ARRAY[
        'inspire',
        'unite',
        'empower',
        'elevate'
      ]::text[]
    ),
  CONSTRAINT funding_request_pillar_keys_valid
    CHECK (
      pillar_keys <@ ARRAY[
        'lead_academia',
        'academic_excellence',
        'womens_excellence',
        'professional_development',
        'leadership_development',
        'community_outreach',
        'chapter_development'
      ]::text[]
    ),
  CONSTRAINT funding_request_requires_okr
    CHECK (array_length(okr_keys, 1) IS NOT NULL),
  CONSTRAINT funding_request_requires_pillar
    CHECK (array_length(pillar_keys, 1) IS NOT NULL),
  CONSTRAINT funding_request_review_consistency
    CHECK (
      (
        reviewed_by_id IS NULL
        AND reviewed_at IS NULL
      )
      OR
      (
        reviewed_by_id IS NOT NULL
        AND reviewed_at IS NOT NULL
      )
    ),
  CONSTRAINT funding_request_closure_consistency
    CHECK (
      (
        closed_by_id IS NULL
        AND closed_at IS NULL
      )
      OR
      (
        closed_by_id IS NOT NULL
        AND closed_at IS NOT NULL
      )
    )
);

COMMENT ON TABLE public.funding_request IS
  'Chapter-scoped LEAD Funding requests for event or initiative support. Payments stay offline.';

COMMENT ON COLUMN public.funding_request.internal_funding_source IS
  'Admin-only tag for internal source assignment. Chapters do not choose this in v1.';

COMMENT ON COLUMN public.funding_request.is_late_request IS
  'True when the request is submitted less than 14 days before the event or initiative date.';

CREATE INDEX IF NOT EXISTS idx_funding_request_chapter_status_date
  ON public.funding_request(chapter_id, status, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_funding_request_requester
  ON public.funding_request(requester_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_funding_request_reviewer
  ON public.funding_request(reviewed_by_id, reviewed_at DESC)
  WHERE reviewed_by_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_funding_request_event
  ON public.funding_request(event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_funding_request_okr_keys
  ON public.funding_request USING gin(okr_keys);

CREATE INDEX IF NOT EXISTS idx_funding_request_pillar_keys
  ON public.funding_request USING gin(pillar_keys);

CREATE TABLE IF NOT EXISTS public.funding_request_budget_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_request_id uuid NOT NULL REFERENCES public.funding_request(id) ON DELETE CASCADE,
  label text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  amount numeric(12,2) NOT NULL,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT funding_request_budget_item_label_not_empty
    CHECK (length(btrim(label)) > 0),
  CONSTRAINT funding_request_budget_item_amount_positive
    CHECK (amount > 0),
  CONSTRAINT funding_request_budget_item_category_check
    CHECK (
      category IN (
        'food_refreshments',
        'event_materials',
        'minimal_decorations',
        'learning_materials',
        'recognition_items',
        'software_platforms',
        'speaker_support',
        'transportation_exception',
        'other'
      )
    )
);

COMMENT ON TABLE public.funding_request_budget_item IS
  'Itemized budget rows for a LEAD Funding request.';

CREATE INDEX IF NOT EXISTS idx_funding_request_budget_item_request
  ON public.funding_request_budget_item(funding_request_id, sort_order);

CREATE TABLE IF NOT EXISTS public.funding_request_file (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_request_id uuid NOT NULL REFERENCES public.funding_request(id) ON DELETE CASCADE,
  chapter_id text NOT NULL REFERENCES public.chapter(id) ON DELETE CASCADE,
  uploaded_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  file_type text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'funding-files',
  storage_path text,
  external_url text,
  original_name text,
  mime_type text,
  file_size_bytes integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT funding_request_file_type_check
    CHECK (file_type IN ('supporting_material', 'receipt', 'evidence')),
  CONSTRAINT funding_request_file_bucket_check
    CHECK (storage_bucket = 'funding-files'),
  CONSTRAINT funding_request_file_location_check
    CHECK (
      storage_path IS NOT NULL
      OR external_url IS NOT NULL
    ),
  CONSTRAINT funding_request_file_size_nonnegative
    CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0)
);

COMMENT ON TABLE public.funding_request_file IS
  'Private file or link metadata for LEAD Funding supporting materials, receipts, and evidence.';

CREATE INDEX IF NOT EXISTS idx_funding_request_file_request_type
  ON public.funding_request_file(funding_request_id, file_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_funding_request_file_chapter
  ON public.funding_request_file(chapter_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_funding_request_file_storage_path_unique
  ON public.funding_request_file(storage_bucket, storage_path)
  WHERE storage_path IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.funding_request_status_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_request_id uuid NOT NULL REFERENCES public.funding_request(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  from_status text,
  to_status text NOT NULL,
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT funding_request_status_event_from_status_check
    CHECK (
      from_status IS NULL
      OR from_status IN (
        'draft',
        'submitted',
        'changes_requested',
        'approved',
        'rejected',
        'receipts_due',
        'closed'
      )
    ),
  CONSTRAINT funding_request_status_event_to_status_check
    CHECK (
      to_status IN (
        'draft',
        'submitted',
        'changes_requested',
        'approved',
        'rejected',
        'receipts_due',
        'closed'
      )
    ),
  CONSTRAINT funding_request_status_event_metadata_object
    CHECK (jsonb_typeof(metadata) = 'object')
);

COMMENT ON TABLE public.funding_request_status_event IS
  'Status timeline for LEAD Funding request decisions and accountability events.';

CREATE INDEX IF NOT EXISTS idx_funding_request_status_event_request_created
  ON public.funding_request_status_event(funding_request_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.can_access_funding_request(
  check_request_id uuid,
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
      FROM public.funding_request fr
      WHERE fr.id = check_request_id
        AND public.has_chapter_permission(fr.chapter_id, check_permission_key)
    );
$$;

COMMENT ON FUNCTION public.can_access_funding_request(uuid, text) IS
  'Returns true for admins or chapter operators with the requested funding permission for the request chapter.';

CREATE OR REPLACE FUNCTION public.can_access_funding_file_object(
  object_name text,
  check_permission_key text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'storage', 'pg_temp'
AS $$
DECLARE
  request_id uuid;
BEGIN
  IF object_name IS NULL OR array_length(storage.foldername(object_name), 1) < 1 THEN
    RETURN false;
  END IF;

  BEGIN
    request_id := (storage.foldername(object_name))[1]::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN false;
  END;

  RETURN public.can_access_funding_request(request_id, check_permission_key);
END;
$$;

COMMENT ON FUNCTION public.can_access_funding_file_object(text, text) IS
  'Checks funding-files objects whose first path segment is the funding request id.';

ALTER TABLE public.funding_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_request_budget_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_request_file ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_request_status_event ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "funding_request_admin_all" ON public.funding_request;
CREATE POLICY "funding_request_admin_all" ON public.funding_request
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "funding_request_chapter_select" ON public.funding_request;
CREATE POLICY "funding_request_chapter_select" ON public.funding_request
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_chapter_permission(chapter_id, 'chapter.funding.view'));

DROP POLICY IF EXISTS "funding_request_chapter_insert" ON public.funding_request;
CREATE POLICY "funding_request_chapter_insert" ON public.funding_request
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    requester_user_id = auth.uid()
    AND public.has_chapter_permission(chapter_id, 'chapter.funding.submit')
  );

DROP POLICY IF EXISTS "funding_request_chapter_update" ON public.funding_request;
CREATE POLICY "funding_request_chapter_update" ON public.funding_request
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.has_chapter_permission(chapter_id, 'chapter.funding.submit'))
  WITH CHECK (public.has_chapter_permission(chapter_id, 'chapter.funding.submit'));

DROP POLICY IF EXISTS "funding_budget_item_admin_all" ON public.funding_request_budget_item;
CREATE POLICY "funding_budget_item_admin_all" ON public.funding_request_budget_item
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "funding_budget_item_chapter_select" ON public.funding_request_budget_item;
CREATE POLICY "funding_budget_item_chapter_select" ON public.funding_request_budget_item
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.can_access_funding_request(funding_request_id, 'chapter.funding.view'));

DROP POLICY IF EXISTS "funding_budget_item_chapter_insert" ON public.funding_request_budget_item;
CREATE POLICY "funding_budget_item_chapter_insert" ON public.funding_request_budget_item
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'));

DROP POLICY IF EXISTS "funding_budget_item_chapter_update" ON public.funding_request_budget_item;
CREATE POLICY "funding_budget_item_chapter_update" ON public.funding_request_budget_item
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'))
  WITH CHECK (public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'));

DROP POLICY IF EXISTS "funding_budget_item_chapter_delete" ON public.funding_request_budget_item;
CREATE POLICY "funding_budget_item_chapter_delete" ON public.funding_request_budget_item
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'));

DROP POLICY IF EXISTS "funding_file_admin_all" ON public.funding_request_file;
CREATE POLICY "funding_file_admin_all" ON public.funding_request_file
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "funding_file_chapter_select" ON public.funding_request_file;
CREATE POLICY "funding_file_chapter_select" ON public.funding_request_file
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.can_access_funding_request(funding_request_id, 'chapter.funding.view')
    AND EXISTS (
      SELECT 1
      FROM public.funding_request fr
      WHERE fr.id = funding_request_id
        AND fr.chapter_id = funding_request_file.chapter_id
    )
  );

DROP POLICY IF EXISTS "funding_file_chapter_insert" ON public.funding_request_file;
CREATE POLICY "funding_file_chapter_insert" ON public.funding_request_file
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by_id = auth.uid()
    AND public.can_access_funding_request(funding_request_id, 'chapter.funding.submit')
    AND EXISTS (
      SELECT 1
      FROM public.funding_request fr
      WHERE fr.id = funding_request_id
        AND fr.chapter_id = funding_request_file.chapter_id
    )
  );

DROP POLICY IF EXISTS "funding_file_chapter_update" ON public.funding_request_file;
CREATE POLICY "funding_file_chapter_update" ON public.funding_request_file
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'))
  WITH CHECK (
    public.can_access_funding_request(funding_request_id, 'chapter.funding.submit')
    AND EXISTS (
      SELECT 1
      FROM public.funding_request fr
      WHERE fr.id = funding_request_id
        AND fr.chapter_id = funding_request_file.chapter_id
    )
  );

DROP POLICY IF EXISTS "funding_file_chapter_delete" ON public.funding_request_file;
CREATE POLICY "funding_file_chapter_delete" ON public.funding_request_file
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'));

DROP POLICY IF EXISTS "funding_status_event_admin_all" ON public.funding_request_status_event;
CREATE POLICY "funding_status_event_admin_all" ON public.funding_request_status_event
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "funding_status_event_chapter_select" ON public.funding_request_status_event;
CREATE POLICY "funding_status_event_chapter_select" ON public.funding_request_status_event
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.can_access_funding_request(funding_request_id, 'chapter.funding.view'));

DROP POLICY IF EXISTS "funding_status_event_chapter_insert" ON public.funding_request_status_event;
CREATE POLICY "funding_status_event_chapter_insert" ON public.funding_request_status_event
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    actor_user_id = auth.uid()
    AND public.can_access_funding_request(funding_request_id, 'chapter.funding.submit')
  );

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'funding-files',
  'funding-files',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = now();

DROP POLICY IF EXISTS "Funding files read by request access" ON storage.objects;
CREATE POLICY "Funding files read by request access"
  ON storage.objects
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'funding-files'
    AND public.can_access_funding_file_object(name, 'chapter.funding.view')
  );

DROP POLICY IF EXISTS "Funding files upload by request submitters" ON storage.objects;
CREATE POLICY "Funding files upload by request submitters"
  ON storage.objects
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'funding-files'
    AND public.can_access_funding_file_object(name, 'chapter.funding.submit')
  );

DROP POLICY IF EXISTS "Funding files update by request submitters" ON storage.objects;
CREATE POLICY "Funding files update by request submitters"
  ON storage.objects
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'funding-files'
    AND public.can_access_funding_file_object(name, 'chapter.funding.submit')
  )
  WITH CHECK (
    bucket_id = 'funding-files'
    AND public.can_access_funding_file_object(name, 'chapter.funding.submit')
  );

DROP POLICY IF EXISTS "Funding files delete by request submitters" ON storage.objects;
CREATE POLICY "Funding files delete by request submitters"
  ON storage.objects
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'funding-files'
    AND public.can_access_funding_file_object(name, 'chapter.funding.submit')
  );

REVOKE ALL ON TABLE public.funding_request FROM anon;
REVOKE ALL ON TABLE public.funding_request_budget_item FROM anon;
REVOKE ALL ON TABLE public.funding_request_file FROM anon;
REVOKE ALL ON TABLE public.funding_request_status_event FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.funding_request TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.funding_request_budget_item TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.funding_request_file TO authenticated;
GRANT SELECT, INSERT ON TABLE public.funding_request_status_event TO authenticated;

GRANT ALL ON TABLE public.funding_request TO service_role;
GRANT ALL ON TABLE public.funding_request_budget_item TO service_role;
GRANT ALL ON TABLE public.funding_request_file TO service_role;
GRANT ALL ON TABLE public.funding_request_status_event TO service_role;

GRANT EXECUTE ON FUNCTION public.can_access_funding_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_funding_request(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_access_funding_file_object(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_funding_file_object(text, text) TO service_role;

COMMIT;

SELECT 'lead funding foundation created' AS status
WHERE EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'funding_request'
)
AND EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'funding_request_budget_item'
)
AND EXISTS (
  SELECT 1
  FROM storage.buckets
  WHERE id = 'funding-files'
);


-- === Migration: 20260525133000_add_event_pathway_metadata.sql ===
-- LEAD Intelligence: event-specific Pathway metadata and recommendation traceability.

BEGIN;

CREATE TABLE IF NOT EXISTS public.event_pathway_metadata (
  event_id uuid PRIMARY KEY REFERENCES public.event(id) ON DELETE CASCADE,
  is_pathway_eligible boolean NOT NULL DEFAULT false,
  primary_okr text,
  okr_alignment text[] NOT NULL DEFAULT '{}'::text[],
  pillar_keys text[] NOT NULL DEFAULT '{}'::text[],
  student_goal text,
  growth_stage_fit text[] NOT NULL DEFAULT '{}'::text[],
  student_outcomes text[] NOT NULL DEFAULT '{}'::text[],
  proof_outcome text,
  evidence_signals text[] NOT NULL DEFAULT '{}'::text[],
  audience text,
  cta_type text,
  coordination_risk text NOT NULL DEFAULT 'low',
  recommendation_safety text NOT NULL DEFAULT 'manual_review',
  metadata_status text NOT NULL DEFAULT 'draft',
  notes text,
  created_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  updated_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_pathway_metadata_primary_okr_check
    CHECK (
      primary_okr IS NULL
      OR primary_okr IN ('inspire', 'unite', 'empower', 'elevate')
    ),
  CONSTRAINT event_pathway_metadata_okr_alignment_check
    CHECK (okr_alignment <@ ARRAY['inspire', 'unite', 'empower', 'elevate']::text[]),
  CONSTRAINT event_pathway_metadata_pillar_keys_check
    CHECK (
      pillar_keys <@ ARRAY[
        'lead_academia',
        'academic_excellence',
        'womens_excellence',
        'professional_development',
        'leadership_development',
        'community_outreach',
        'chapter_development'
      ]::text[]
    ),
  CONSTRAINT event_pathway_metadata_student_goal_check
    CHECK (
      student_goal IS NULL
      OR student_goal IN (
        'career_exploration',
        'technical_experience',
        'opportunity_readiness',
        'community_mentorship',
        'leadership'
      )
    ),
  CONSTRAINT event_pathway_metadata_growth_stage_fit_check
    CHECK (
      growth_stage_fit <@ ARRAY[
        'explorer',
        'builder',
        'leader',
        'candidate',
        'emerging_professional'
      ]::text[]
    ),
  CONSTRAINT event_pathway_metadata_student_outcomes_check
    CHECK (
      student_outcomes <@ ARRAY[
        'mission_orientation',
        'belonging',
        'career_exposure',
        'technical_skill',
        'innovation_project',
        'proof_artifact',
        'professional_readiness',
        'profile_visibility',
        'leadership_confidence',
        'teamwork',
        'reflection',
        'community_service'
      ]::text[]
    ),
  CONSTRAINT event_pathway_metadata_proof_outcome_check
    CHECK (
      proof_outcome IS NULL
      OR proof_outcome IN (
        'none',
        'reflection',
        'certificate',
        'pitch_deck',
        'linkedin_update',
        'resume_bullet',
        'project_note',
        'portfolio_item'
      )
    ),
  CONSTRAINT event_pathway_metadata_evidence_signals_check
    CHECK (
      evidence_signals <@ ARRAY[
        'event_registration',
        'event_attendance',
        'application_submitted',
        'reflection_completed',
        'proof_submitted',
        'certificate_earned',
        'linkedin_updated',
        'resume_updated',
        'profile_updated',
        'mission_recap_completed'
      ]::text[]
    ),
  CONSTRAINT event_pathway_metadata_audience_check
    CHECK (
      audience IS NULL
      OR audience IN (
        'new_member',
        'active_member',
        'chapter_leader',
        'all_students',
        'application_required',
        'open_public',
        'chapter_only'
      )
    ),
  CONSTRAINT event_pathway_metadata_cta_type_check
    CHECK (
      cta_type IS NULL
      OR cta_type IN (
        'register',
        'apply',
        'attend',
        'reflect',
        'update_profile',
        'update_linkedin',
        'update_resume',
        'capture_proof'
      )
    ),
  CONSTRAINT event_pathway_metadata_coordination_risk_check
    CHECK (coordination_risk IN ('low', 'medium', 'high')),
  CONSTRAINT event_pathway_metadata_recommendation_safety_check
    CHECK (
      recommendation_safety IN (
        'recommendable_now',
        'recommend_only_if_event_active',
        'manual_review',
        'not_recommendable'
      )
    ),
  CONSTRAINT event_pathway_metadata_status_check
    CHECK (metadata_status IN ('draft', 'ready', 'archived')),
  CONSTRAINT event_pathway_metadata_eligible_requires_metadata
    CHECK (
      is_pathway_eligible = false
      OR (
        primary_okr IS NOT NULL
        AND array_length(pillar_keys, 1) IS NOT NULL
        AND student_goal IS NOT NULL
        AND array_length(growth_stage_fit, 1) IS NOT NULL
        AND array_length(student_outcomes, 1) IS NOT NULL
        AND proof_outcome IS NOT NULL
        AND array_length(evidence_signals, 1) IS NOT NULL
        AND audience IS NOT NULL
        AND cta_type IS NOT NULL
      )
    )
);

COMMENT ON TABLE public.event_pathway_metadata IS
  'Student-safe Pathway recommendation metadata for a platform event.';

COMMENT ON COLUMN public.event_pathway_metadata.is_pathway_eligible IS
  'When true, the event can be considered by Pathway matching once metadata_status and safety permit it.';

COMMENT ON COLUMN public.event_pathway_metadata.recommendation_safety IS
  'Controls whether an event can be recommended immediately, only while active, after manual review, or not at all.';

CREATE INDEX IF NOT EXISTS idx_event_pathway_metadata_eligible
  ON public.event_pathway_metadata(is_pathway_eligible, metadata_status, recommendation_safety);

CREATE INDEX IF NOT EXISTS idx_event_pathway_metadata_primary_okr
  ON public.event_pathway_metadata(primary_okr)
  WHERE primary_okr IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_pathway_metadata_pillar_keys
  ON public.event_pathway_metadata USING gin(pillar_keys);

CREATE INDEX IF NOT EXISTS idx_event_pathway_metadata_student_outcomes
  ON public.event_pathway_metadata USING gin(student_outcomes);

ALTER TABLE public.event_pathway_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_pathway_metadata_admin_all" ON public.event_pathway_metadata;
CREATE POLICY "event_pathway_metadata_admin_all" ON public.event_pathway_metadata
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "event_pathway_metadata_editor_select" ON public.event_pathway_metadata;
CREATE POLICY "event_pathway_metadata_editor_select" ON public.event_pathway_metadata
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_event_editor(event_id));

DROP POLICY IF EXISTS "event_pathway_metadata_published_select" ON public.event_pathway_metadata;
CREATE POLICY "event_pathway_metadata_published_select" ON public.event_pathway_metadata
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    is_pathway_eligible = true
    AND EXISTS (
      SELECT 1
      FROM public.event e
      WHERE e.id = event_pathway_metadata.event_id
        AND e.is_published = true
    )
  );

DROP POLICY IF EXISTS "event_pathway_metadata_editor_insert" ON public.event_pathway_metadata;
CREATE POLICY "event_pathway_metadata_editor_insert" ON public.event_pathway_metadata
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    public.is_event_editor(event_id)
    AND created_by_id = auth.uid()
    AND updated_by_id = auth.uid()
  );

DROP POLICY IF EXISTS "event_pathway_metadata_editor_update" ON public.event_pathway_metadata;
CREATE POLICY "event_pathway_metadata_editor_update" ON public.event_pathway_metadata
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.is_event_editor(event_id))
  WITH CHECK (
    public.is_event_editor(event_id)
    AND updated_by_id = auth.uid()
  );

DROP POLICY IF EXISTS "event_pathway_metadata_editor_delete" ON public.event_pathway_metadata;
CREATE POLICY "event_pathway_metadata_editor_delete" ON public.event_pathway_metadata
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.is_event_editor(event_id));

DROP POLICY IF EXISTS "event_pathway_metadata_service_all" ON public.event_pathway_metadata;
CREATE POLICY "event_pathway_metadata_service_all" ON public.event_pathway_metadata
  AS PERMISSIVE FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.pathway_recommendation
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'fixed_action',
  ADD COLUMN IF NOT EXISTS source_event_id uuid REFERENCES public.event(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cta_type text,
  ADD COLUMN IF NOT EXISTS evidence_signal text,
  ADD COLUMN IF NOT EXISTS matched_reasons jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.pathway_recommendation
  ADD CONSTRAINT pathway_recommendation_source_type_check
    CHECK (source_type IN ('event', 'profile_action', 'proof_action', 'fixed_action')),
  ADD CONSTRAINT pathway_recommendation_cta_type_check
    CHECK (
      cta_type IS NULL
      OR cta_type IN (
        'register',
        'apply',
        'attend',
        'reflect',
        'update_profile',
        'update_linkedin',
        'update_resume',
        'capture_proof'
      )
    ),
  ADD CONSTRAINT pathway_recommendation_evidence_signal_check
    CHECK (
      evidence_signal IS NULL
      OR evidence_signal IN (
        'event_registration',
        'event_attendance',
        'application_submitted',
        'reflection_completed',
        'proof_submitted',
        'certificate_earned',
        'linkedin_updated',
        'resume_updated',
        'profile_updated',
        'mission_recap_completed'
      )
    ),
  ADD CONSTRAINT pathway_recommendation_event_source_consistency
    CHECK (
      (source_type = 'event' AND source_event_id IS NOT NULL)
      OR (source_type <> 'event')
    ),
  ADD CONSTRAINT pathway_recommendation_matched_reasons_array
    CHECK (jsonb_typeof(matched_reasons) = 'array');

COMMENT ON COLUMN public.pathway_recommendation.source_type IS
  'Auditable recommendation source: event, profile action, proof action, or fixed action.';

COMMENT ON COLUMN public.pathway_recommendation.source_event_id IS
  'Event source when a recommendation comes from event_pathway_metadata.';

COMMENT ON COLUMN public.pathway_recommendation.matched_reasons IS
  'JSON array of student-safe reasons explaining why the recommendation matched.';

CREATE INDEX IF NOT EXISTS idx_pathway_recommendation_source_event
  ON public.pathway_recommendation(source_event_id)
  WHERE source_event_id IS NOT NULL;

COMMIT;


-- === Migration: 20260525143000_grant_funding_permissions_to_chapter_roles.sql ===
-- Backfill request-based funding permissions for active chapter e-board roles.
-- Chapter leaders can submit funding requests, while admin/finance retains review power.

WITH role_permission_keys(role_level, permission_key) AS (
  VALUES
    ('president', 'chapter.funding.view'),
    ('president', 'chapter.funding.submit'),
    ('vice_president', 'chapter.funding.view'),
    ('vice_president', 'chapter.funding.submit'),
    ('chief_of_staff', 'chapter.funding.view'),
    ('chief_of_staff', 'chapter.funding.submit'),
    ('director', 'chapter.funding.view'),
    ('director', 'chapter.funding.submit'),
    ('coordinator', 'chapter.funding.view'),
    ('coordinator', 'chapter.funding.submit')
)
INSERT INTO public.chapter_permission_grant (
  user_id,
  chapter_id,
  permission_key,
  source,
  source_role_assignment_id,
  granted_by_id
)
SELECT
  cra.user_id,
  cra.chapter_id,
  rpk.permission_key,
  'migration',
  cra.id,
  NULL::uuid
FROM public.chapter_role_assignment cra
JOIN role_permission_keys rpk
  ON rpk.role_level = cra.role_level
WHERE cra.status = 'active'
  AND cra.role_level <> 'member'
  AND NOT EXISTS (
    SELECT 1
    FROM public.chapter_permission_grant existing
    WHERE existing.user_id = cra.user_id
      AND existing.chapter_id = cra.chapter_id
      AND existing.permission_key = rpk.permission_key
      AND existing.revoked_at IS NULL
  );


-- === Migration: 20260525143100_allow_authenticated_pathway_feature_flag_read.sql ===
BEGIN;

DROP POLICY IF EXISTS "pathway_feature_flag_authenticated_read" ON public.pathway_feature_flag;

CREATE POLICY "pathway_feature_flag_authenticated_read"
  ON public.pathway_feature_flag
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

COMMIT;


-- === Migration: 20260525143200_allow_student_pathway_recommendation_writes.sql ===
BEGIN;

DROP POLICY IF EXISTS "pathway_recommendation_student_insert_own" ON public.pathway_recommendation;
CREATE POLICY "pathway_recommendation_student_insert_own"
  ON public.pathway_recommendation
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.pathway_check_in
      WHERE pathway_check_in.id = pathway_recommendation.check_in_id
        AND pathway_check_in.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pathway_recommendation_student_delete_own" ON public.pathway_recommendation;
CREATE POLICY "pathway_recommendation_student_delete_own"
  ON public.pathway_recommendation
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.pathway_check_in
      WHERE pathway_check_in.id = pathway_recommendation.check_in_id
        AND pathway_check_in.user_id = auth.uid()
    )
  );

COMMIT;


-- === Migration: 20260531100000_add_chapter_invite.sql ===
-- Dedicated chapter invite lifecycle.
-- Invitations are explicit user-facing artifacts; preapproval remains legacy launch eligibility.

BEGIN;

CREATE TABLE IF NOT EXISTS public.chapter_invite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id text NOT NULL REFERENCES public.chapter(id) ON DELETE CASCADE,
  email text NOT NULL,
  normalized_email text NOT NULL,
  token_hash text NOT NULL,
  invite_type text NOT NULL,
  role_level text NOT NULL,
  functional_area text NOT NULL,
  display_title text NOT NULL,
  raw_title text,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  accepted_at timestamptz,
  accepted_by_user_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  revoked_by_user_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  created_by_user_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  created_by_role text NOT NULL,
  replaced_by_invite_id uuid REFERENCES public.chapter_invite(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'chapter_invite',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chapter_invite_email_not_empty
    CHECK (length(btrim(email)) > 0),
  CONSTRAINT chapter_invite_normalized_email_not_empty
    CHECK (length(btrim(normalized_email)) > 0),
  CONSTRAINT chapter_invite_normalized_email_matches_email
    CHECK (normalized_email = lower(btrim(email))),
  CONSTRAINT chapter_invite_token_hash_not_empty
    CHECK (length(btrim(token_hash)) > 0),
  CONSTRAINT chapter_invite_type_check
    CHECK (invite_type IN ('member', 'regular_eboard', 'protected_leader')),
  CONSTRAINT chapter_invite_role_level_check
    CHECK (
      role_level IN (
        'president',
        'vice_president',
        'chief_of_staff',
        'director',
        'coordinator',
        'member'
      )
    ),
  CONSTRAINT chapter_invite_functional_area_check
    CHECK (
      functional_area IN (
        'general_leadership',
        'strategy_operations',
        'marketing_communications',
        'events_experience',
        'finance_legal',
        'chapter_development',
        'academic_excellence',
        'professional_development',
        'leadership',
        'women_in_stem',
        'research',
        'projects',
        'partnerships_external_relations',
        'people_talent',
        'other'
      )
    ),
  CONSTRAINT chapter_invite_display_title_not_empty
    CHECK (length(btrim(display_title)) > 0),
  CONSTRAINT chapter_invite_status_check
    CHECK (status IN ('pending', 'accepted', 'revoked')),
  CONSTRAINT chapter_invite_created_by_role_check
    CHECK (created_by_role IN ('admin', 'chapter_leader', 'system')),
  CONSTRAINT chapter_invite_source_not_empty
    CHECK (length(btrim(source)) > 0),
  CONSTRAINT chapter_invite_expires_after_created
    CHECK (expires_at > created_at),
  CONSTRAINT chapter_invite_accepted_requires_user
    CHECK (
      (accepted_at IS NULL AND accepted_by_user_id IS NULL)
      OR (accepted_at IS NOT NULL AND accepted_by_user_id IS NOT NULL)
    ),
  CONSTRAINT chapter_invite_revoked_requires_user
    CHECK (
      (revoked_at IS NULL AND revoked_by_user_id IS NULL)
      OR (revoked_at IS NOT NULL AND revoked_by_user_id IS NOT NULL)
    ),
  CONSTRAINT chapter_invite_status_lifecycle
    CHECK (
      (status = 'pending' AND accepted_at IS NULL AND revoked_at IS NULL)
      OR (status = 'accepted' AND accepted_at IS NOT NULL AND revoked_at IS NULL)
      OR (status = 'revoked' AND revoked_at IS NOT NULL AND accepted_at IS NULL)
    ),
  CONSTRAINT chapter_invite_type_role_alignment
    CHECK (
      (invite_type = 'member' AND role_level = 'member')
      OR (invite_type = 'regular_eboard' AND role_level IN ('chief_of_staff', 'director', 'coordinator'))
      OR (invite_type = 'protected_leader' AND role_level IN ('president', 'vice_president'))
    )
);

COMMENT ON TABLE public.chapter_invite IS
  'Explicit email-bound chapter invitations for member, e-board, and protected leadership activation.';

COMMENT ON COLUMN public.chapter_invite.token_hash IS
  'SHA-256 hash of the invite token. Raw tokens are sent by email and never stored.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_invite_token_hash_unique
  ON public.chapter_invite(token_hash);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_invite_active_email_chapter
  ON public.chapter_invite(normalized_email, chapter_id)
  WHERE status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_invite_active_protected_role
  ON public.chapter_invite(chapter_id, role_level)
  WHERE status = 'pending'
    AND invite_type = 'protected_leader';

CREATE INDEX IF NOT EXISTS idx_chapter_invite_chapter_status
  ON public.chapter_invite(chapter_id, status);

CREATE INDEX IF NOT EXISTS idx_chapter_invite_expires_at
  ON public.chapter_invite(expires_at);

ALTER TABLE public.chapter_role_assignment
  ADD COLUMN IF NOT EXISTS source_chapter_invite_id uuid REFERENCES public.chapter_invite(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_chapter_role_assignment_source_chapter_invite
  ON public.chapter_role_assignment(source_chapter_invite_id);

ALTER TABLE public.chapter_role_assignment
  DROP CONSTRAINT IF EXISTS chapter_role_assignment_source_check;

ALTER TABLE public.chapter_role_assignment
  ADD CONSTRAINT chapter_role_assignment_source_check
    CHECK (source IN ('manual', 'manual_admin', 'preapproval', 'chapter_invite', 'migration'));

ALTER TABLE public.chapter_permission_grant
  DROP CONSTRAINT IF EXISTS chapter_permission_grant_source_check;

ALTER TABLE public.chapter_permission_grant
  ADD CONSTRAINT chapter_permission_grant_source_check
    CHECK (source IN ('role_template', 'manual_admin', 'preapproval', 'chapter_invite', 'migration'));

ALTER TABLE public.chapter_invite ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chapter_invite_admin_all" ON public.chapter_invite;
CREATE POLICY "chapter_invite_admin_all" ON public.chapter_invite
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "chapter_invite_operator_select" ON public.chapter_invite;
CREATE POLICY "chapter_invite_operator_select" ON public.chapter_invite
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard')
  );

REVOKE ALL ON TABLE public.chapter_invite FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chapter_invite TO authenticated;
GRANT ALL ON TABLE public.chapter_invite TO service_role;

COMMIT;

SELECT 'chapter_invite created' AS status
WHERE EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'chapter_invite'
);


-- === Migration: 20260606120000_add_chapter_activation_interest.sql ===
-- CHACT-01: First-conversation intake for students who want to bring LEAD to a university.
-- This deliberately stays separate from chapter_membership so it cannot grant membership,
-- member IDs, chapter permissions, or alumni state.

CREATE TABLE IF NOT EXISTS public.chapter_activation_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  university_name text NOT NULL,
  motivation text NOT NULL,
  university_context text NOT NULL,
  lead_value text NOT NULL,
  team_status text NOT NULL,
  interested_people_context text NOT NULL,
  opportunities text NOT NULL,
  long_term_commitment text NOT NULL,
  status text NOT NULL DEFAULT 'submitted',
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chapter_activation_interest_status_check
    CHECK (status IN ('submitted', 'orientation_needed', 'ready_for_activation', 'closed')),
  CONSTRAINT chapter_activation_interest_required_text_check
    CHECK (
      length(btrim(university_name)) > 0
      AND length(btrim(motivation)) > 0
      AND length(btrim(university_context)) > 0
      AND length(btrim(lead_value)) > 0
      AND length(btrim(team_status)) > 0
      AND length(btrim(interested_people_context)) > 0
      AND length(btrim(opportunities)) > 0
      AND length(btrim(long_term_commitment)) > 0
    )
);

CREATE INDEX IF NOT EXISTS idx_chapter_activation_interest_user_id
  ON public.chapter_activation_interest(user_id);

CREATE INDEX IF NOT EXISTS idx_chapter_activation_interest_status
  ON public.chapter_activation_interest(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_activation_interest_one_submitted_per_user
  ON public.chapter_activation_interest(user_id)
  WHERE status = 'submitted';

ALTER TABLE public.chapter_activation_interest ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chapter_activation_interest_select_own" ON public.chapter_activation_interest;
CREATE POLICY "chapter_activation_interest_select_own"
  ON public.chapter_activation_interest FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chapter_activation_interest_insert_own" ON public.chapter_activation_interest;
CREATE POLICY "chapter_activation_interest_insert_own"
  ON public.chapter_activation_interest FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chapter_activation_interest_admin_all" ON public.chapter_activation_interest;
CREATE POLICY "chapter_activation_interest_admin_all"
  ON public.chapter_activation_interest FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public."user" u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public."user" u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
  );


-- === Migration: 20260606130000_fix_user_admin_rls_policies.sql ===
-- LEAD QA: Fix admin RLS policies for user table
-- The previous policies checked auth.jwt() ->> 'role', but Supabase doesn't automatically
-- add the custom role claim to the JWT. Use the is_admin() function instead.

-- Drop old policies that rely on JWT role claim
DROP POLICY IF EXISTS "user_read_admin" ON "public"."user";
DROP POLICY IF EXISTS "user_update_admin" ON "public"."user";

-- Create new policy for admin SELECT using is_admin() function
CREATE POLICY "user_read_admin" ON "public"."user" 
  FOR SELECT 
  USING (public.is_admin());

-- Create new policy for admin UPDATE using is_admin() function
CREATE POLICY "user_update_admin" ON "public"."user" 
  FOR UPDATE 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());


-- === Migration: 20260606140000_make_person_profile_university_not_null.sql ===
-- Make person_profile.university NOT NULL.
-- Backfill existing NULL values with major_or_interest as a reasonable fallback.

UPDATE public.person_profile
SET university = major_or_interest
WHERE university IS NULL;

ALTER TABLE public.person_profile
ALTER COLUMN university SET NOT NULL;


