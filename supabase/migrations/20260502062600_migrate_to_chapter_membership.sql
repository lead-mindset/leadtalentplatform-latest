-- Migration: 007_migrate_to_chapter_membership.sql
-- Purpose: Copy chapter membership data from student_profile to chapter_membership
-- Pre-validation: SELECT COUNT(*) FROM student_profile WHERE chapter_id IS NOT NULL;
-- Post-validation: All chapter_ids reference valid chapters
-- Rollback: DELETE FROM chapter_membership;

BEGIN;

-- ============================================
-- PRE-VALIDATION: Verify source data exists
-- ============================================

DO $$
DECLARE source_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO source_count
    FROM student_profile
    WHERE chapter_id IS NOT NULL;

    IF source_count = 0 THEN
        RAISE NOTICE 'No chapter memberships to migrate';
    ELSE
        RAISE NOTICE 'Found % records with chapter_id to migrate', source_count;
    END IF;
END $$;

-- ============================================
-- MAIN MIGRATION: Copy membership data
-- ============================================

INSERT INTO chapter_membership (
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
    sp.chapter_id,                              -- TEXT matches chapter.id (also TEXT)
    CASE sp.approval_status
        WHEN 'pending' THEN 'pending'::membership_status
        WHEN 'approved' THEN 'approved'::membership_status
        WHEN 'rejected' THEN 'rejected'::membership_status
        ELSE 'inactive'::membership_status     -- default for unknown states
    END,
    NULL,                                       -- position - no source field
    sp.approved_by_id,
    sp.member_id,
    sp.created_at,
    COALESCE(sp.created_at, NOW()),
    NOW()
FROM student_profile sp
WHERE sp.chapter_id IS NOT NULL
ON CONFLICT (member_id) DO NOTHING;

-- ============================================
-- POST-VALIDATION: Verify referential integrity
-- ============================================

DO $$
DECLARE migrated_count INTEGER;
DECLARE orphaned_count INTEGER;
BEGIN
    -- Count migrated records
    SELECT COUNT(*) INTO migrated_count FROM chapter_membership;

    -- Count records with invalid chapter_id (orphaned)
    SELECT COUNT(*) INTO orphaned_count
    FROM chapter_membership cm
    LEFT JOIN chapter c ON cm.chapter_id = c.id
    WHERE c.id IS NULL;

    IF orphaned_count > 0 THEN
        RAISE WARNING 'Found % orphaned chapter memberships (invalid chapter_id)', orphaned_count;
    ELSE
        RAISE NOTICE 'Migration verified: % memberships migrated, % orphaned',
            migrated_count, orphaned_count;
    END IF;
END $$;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check membership distribution by status
SELECT status, COUNT(*) as count
FROM chapter_membership
GROUP BY status;

-- Check for duplicates on member_id
SELECT member_id, COUNT(*) as count
FROM chapter_membership
WHERE member_id IS NOT NULL
GROUP BY member_id
HAVING COUNT(*) > 1;

-- Sample records
SELECT cm.user_id, cm.chapter_id, cm.status, cm.member_id, c.name as chapter_name
FROM chapter_membership cm
JOIN chapter c ON cm.chapter_id = c.id
LIMIT 5;