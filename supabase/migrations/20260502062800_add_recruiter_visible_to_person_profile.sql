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