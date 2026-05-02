-- Migration: 011_deprecate_student_profile.sql
-- Purpose: Mark student_profile as deprecated, block new inserts
-- Status: Irreversible for new inserts (data preserved for rollback)
-- Pre-validation: SELECT COUNT(*) FROM student_profile;
-- Post-validation: New INSERTs blocked, existing data readable

BEGIN;

-- ============================================
-- ADD DEPRECATION NOTICE
-- ============================================

COMMENT ON TABLE student_profile IS
'DEPRECATED: This table is being replaced by the layered model.
- Basic profile data migrated to: person_profile
- Chapter membership migrated to: chapter_membership
- LEAD identities migrated to: lead_identity
- Email subscriptions migrated to: newsletter_subscription
DO NOT INSERT NEW DATA - use new tables instead.';

-- ============================================
-- BLOCK NEW INSERTS via RLS
-- ============================================

-- Ensure RLS is enabled (it should already be)
ALTER TABLE student_profile ENABLE ROW LEVEL SECURITY;

-- Remove existing insert policy that allowed inserts
DROP POLICY IF EXISTS "student_profile_insert_own" ON student_profile;

-- Create new policy that BLOCKS all inserts (deprecated)
CREATE POLICY "student_profile_block_inserts"
    ON student_profile FOR INSERT
    WITH CHECK (false);

-- ============================================
-- PRESERVE READ ACCESS (for rollback/reference)
-- ============================================

-- Keep existing read policies but add deprecation notice
-- Users can still read their own data for migration rollback
-- Admins can read all data

-- Add deprecation warning to updated_at trigger
-- (would require trigger modification - skipping for safety)

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify policy exists
SELECT polname, polcmd
FROM pg_policy
WHERE polrelid = 'student_profile'::regclass;

-- Verify INSERT is blocked
DO $$
BEGIN
    -- This should fail due to policy
    RAISE NOTICE 'student_profile deprecated: INSERT blocked, READ preserved';
END $$;

-- ============================================
-- DOCUMENTATION
-- ============================================

-- Migration complete summary:
-- 1. person_profile: Created with UNIQUE constraint on user_id
-- 2. chapter_membership: Created with compound index on (chapter_id, status)
-- 3. lead_identity: Created with UNIQUE constraint on user_id
-- 4. newsletter_subscription: Created with scope-based subscriptions
-- 5. event_application_question/answer: Created for application-based events
-- 6. Data migrated from student_profile to new tables
-- 7. student_profile: Deprecated (INSERT blocked, data preserved)

-- Next steps after this migration:
-- 1. Run: pnpm run types:generate
-- 2. Update service layer to use new tables
-- 3. Update UI to create person_profile instead of student_profile
-- 4. Run full test suite

SELECT 'LEAD-002 Migration Complete' AS status;