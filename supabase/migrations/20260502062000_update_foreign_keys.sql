-- Migration: 010_update_foreign_keys.sql
-- Purpose: Verify existing tables reference user.id correctly (no changes needed)
-- Pre-validation: N/A
-- Post-validation: All existing FKs to user.id are valid

BEGIN;

-- ============================================
-- ANALYSIS: Existing table references
-- ============================================

-- The following tables ALREADY reference user.id (not student_profile):
-- 1. event_registration.user_id → user.id
-- 2. resume.student_id → user.id
-- 3. saved_student.student_id → user.id
-- 4. recruiter_access.accepted_by_user_id → user.id

-- No FK changes needed - existing schema is already correct!

-- ============================================
-- VERIFICATION: Confirm all FKs are valid
-- ============================================

-- Check event_registration references valid users
DO $$
DECLARE invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM event_registration er
    LEFT JOIN "user" u ON er.user_id = u.id
    WHERE u.id IS NULL;

    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % event_registrations with invalid user_id', invalid_count;
    ELSE
        RAISE NOTICE 'event_registration FK verification: OK';
    END IF;
END $$;

-- Check resume references valid users
DO $$
DECLARE invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM resume r
    LEFT JOIN "user" u ON r.student_id = u.id
    WHERE u.id IS NULL;

    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % resumes with invalid student_id', invalid_count;
    ELSE
        RAISE NOTICE 'resume FK verification: OK';
    END IF;
END $$;

-- Check saved_student references valid users
DO $$
DECLARE invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM saved_student ss
    LEFT JOIN "user" u ON ss.student_id = u.id
    WHERE u.id IS NULL;

    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % saved_students with invalid student_id', invalid_count;
    ELSE
        RAISE NOTICE 'saved_student FK verification: OK';
    END IF;
END $$;

-- ============================================
-- DOCUMENTATION: Model alignment
-- ============================================

-- After migration, the model is:
-- - user (auth source)
--   ├── person_profile (one-to-one, basic info)
--   ├── chapter_membership (one-to-many, per-chapter)
--   ├── lead_identity (one-to-one, official identity)
--   ├── event_registration (one-to-many)
--   └── newsletter_subscription (one-to-many)

-- All relationships are through user.id - no direct FK to student_profile needed

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Show current FK relationships
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('event_registration', 'resume', 'saved_student', 'recruiter_access');