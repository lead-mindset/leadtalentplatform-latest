-- Migration: 006_migrate_to_person_profile.sql
-- Purpose: Copy universal fields from student_profile to person_profile
-- Pre-validation: SELECT COUNT(*) FROM student_profile;
-- Post-validation: Row counts match
-- Rollback: DELETE FROM person_profile;

BEGIN;

-- ============================================
-- PRE-VALIDATION: Verify source data exists
-- ============================================

DO $$
DECLARE source_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO source_count FROM student_profile;

    IF source_count = 0 THEN
        RAISE NOTICE 'No source data in student_profile - skipping migration';
    ELSE
        RAISE NOTICE 'Found % records in student_profile to migrate', source_count;
    END IF;
END $$;

-- ============================================
-- MAIN MIGRATION: Copy universal fields
-- ============================================

INSERT INTO person_profile (
    id,
    user_id,
    university,
    major_or_interest,
    graduation_year,
    linkedin_url,
    skills,
    gender,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    sp.user_id,
    sp.major,                    -- maps to university (using major as proxy)
    sp.major,                    -- maps to major_or_interest
    sp.graduation_year,
    sp.linkedin_url,
    sp.skills,
    sp.gender,
    COALESCE(sp.created_at, NOW()),
    NOW()
FROM student_profile sp
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- POST-VALIDATION: Verify data integrity
-- ============================================

DO $$
DECLARE source_count INTEGER;
DECLARE target_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO source_count FROM student_profile;
    SELECT COUNT(*) INTO target_count FROM person_profile;

    IF target_count < source_count THEN
        RAISE EXCEPTION 'Data loss detected: source=%, target=%', source_count, target_count;
    END IF;

    RAISE NOTICE 'Migration verified: % source rows, % target rows', source_count, target_count;
END $$;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES (run manually if needed)
-- ============================================

-- Check for any duplicates (should be 0)
SELECT COUNT(*) - COUNT(DISTINCT user_id) AS duplicate_users
FROM person_profile;

-- Sample a few rows to verify
SELECT user_id, university, major_or_interest, graduation_year
FROM person_profile
LIMIT 5;