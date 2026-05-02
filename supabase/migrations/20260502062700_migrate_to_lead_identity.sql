-- Migration: 008_migrate_to_lead_identity.sql
-- Purpose: Create lead_identity records for approved chapter members
-- Pre-validation: SELECT COUNT(*) FROM chapter_membership WHERE status = 'approved';
-- Post-validation: All approved members have identity
-- Rollback: DELETE FROM lead_identity;

BEGIN;

-- ============================================
-- PRE-VALIDATION: Verify source data exists
-- ============================================

DO $$
DECLARE approved_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO approved_count
    FROM chapter_membership
    WHERE status = 'approved';

    IF approved_count = 0 THEN
        RAISE NOTICE 'No approved members to create identities for';
    ELSE
        RAISE NOTICE 'Found % approved members to create identities', approved_count;
    END IF;
END $$;

-- ============================================
-- MAIN MIGRATION: Create identities for approved members
-- ============================================

-- Create identities for users with approved chapter membership
INSERT INTO lead_identity (
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
        WHEN cm.position IN ('president', 'vice_president', 'secretary', 'treasurer', 'editor')
            THEN 'chapter_editor'::identity_type
        ELSE 'chapter_member'::identity_type
    END,
    cm.chapter_id,
    true,                                       -- is_primary
    cm.approved_by_id,                         -- issued by approver
    COALESCE(cm.joined_at, NOW()),             -- issued at join time
    'active'::identity_status,
    NOW(),
    NOW()
FROM chapter_membership cm
WHERE cm.status = 'approved'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- POST-VALIDATION: Verify all approved members have identity
-- ============================================

DO $$
DECLARE approved_members INTEGER;
DECLARE identities_created INTEGER;
BEGIN
    SELECT COUNT(DISTINCT user_id) INTO approved_members
    FROM chapter_membership
    WHERE status = 'approved';

    SELECT COUNT(*) INTO identities_created
    FROM lead_identity
    WHERE status = 'active';

    IF identities_created < approved_members THEN
        RAISE WARNING 'Some approved members missing identity: % members, % identities',
            approved_members, identities_created;
    ELSE
        RAISE NOTICE 'Migration verified: % approved members, % identities created',
            approved_members, identities_created;
    END IF;
END $$;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check identity type distribution
SELECT identity_type, COUNT(*) as count
FROM lead_identity
GROUP BY identity_type;

-- Check for users with multiple identities (should be 0 for now)
SELECT user_id, COUNT(*) as count
FROM lead_identity
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Sample records
SELECT li.user_id, li.identity_type, li.chapter_id, c.name as chapter_name
FROM lead_identity li
LEFT JOIN chapter c ON li.chapter_id = c.id
WHERE li.status = 'active'
LIMIT 5;