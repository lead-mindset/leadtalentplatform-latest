-- Migration: 009_migrate_email_subscriptions.sql
-- Purpose: Create newsletter_subscriptions from student_profile.email_notifications_enabled
-- Pre-validation: SELECT COUNT(*) FROM student_profile WHERE email_notifications_enabled = true;
-- Post-validation: All users with email_notifications have subscription
-- Rollback: DELETE FROM newsletter_subscription;

BEGIN;

-- ============================================
-- PRE-VALIDATION: Verify source data exists
-- ============================================

DO $$
DECLARE enabled_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO enabled_count
    FROM student_profile
    WHERE email_notifications_enabled = true;

    IF enabled_count = 0 THEN
        RAISE NOTICE 'No email subscriptions to migrate';
    ELSE
        RAISE NOTICE 'Found % users with email notifications enabled', enabled_count;
    END IF;
END $$;

-- ============================================
-- MAIN MIGRATION: Create global subscriptions
-- ============================================

INSERT INTO newsletter_subscription (
    id,
    user_id,
    scope,
    status,
    source,
    subscribed_at,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    sp.user_id,
    'global'::newsletter_scope,
    CASE
        WHEN sp.email_notifications_enabled THEN 'active'::newsletter_status
        ELSE 'unsubscribed'::newsletter_status
    END,
    'onboarding'::subscription_source,
    COALESCE(sp.created_at, NOW()),
    COALESCE(sp.created_at, NOW()),
    NOW()
FROM student_profile sp
WHERE NOT EXISTS (
    SELECT 1 FROM newsletter_subscription ns
    WHERE ns.user_id = sp.user_id AND ns.scope = 'global'
);

-- ============================================
-- ALSO: Create subscriptions from event registrations
-- Users who registered for events should have newsletter
-- ============================================

INSERT INTO newsletter_subscription (
    id,
    user_id,
    scope,
    status,
    source,
    subscribed_at,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    er.user_id,
    'global'::newsletter_scope,
    'active'::newsletter_status,
    'event_registration'::subscription_source,
    COALESCE(er.registered_at, NOW()),
    COALESCE(er.registered_at, NOW()),
    NOW()
FROM event_registration er
WHERE NOT EXISTS (
    SELECT 1 FROM newsletter_subscription ns
    WHERE ns.user_id = er.user_id AND ns.scope = 'global'
);

-- ============================================
-- POST-VALIDATION: Verify subscriptions created
-- ============================================

DO $$
DECLARE source_users INTEGER;
DECLARE subscriptions_created INTEGER;
BEGIN
    -- Count unique users with email_notifications or event_registrations
    SELECT COUNT(DISTINCT user_id) INTO source_users
    FROM (
        SELECT user_id FROM student_profile WHERE email_notifications_enabled = true
        UNION
        SELECT user_id FROM event_registration
    ) AS sources;

    -- Count active global subscriptions
    SELECT COUNT(*) INTO subscriptions_created
    FROM newsletter_subscription
    WHERE scope = 'global' AND status = 'active';

    RAISE NOTICE 'Migration verified: % source users, % active subscriptions',
        source_users, subscriptions_created;
END $$;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check subscription distribution by status
SELECT status, source, COUNT(*) as count
FROM newsletter_subscription
GROUP BY status, source;

-- Check subscription distribution by scope
SELECT scope, COUNT(*) as count
FROM newsletter_subscription
GROUP BY scope;

-- Sample records
SELECT ns.user_id, ns.scope, ns.status, ns.source, ns.subscribed_at
FROM newsletter_subscription ns
WHERE ns.scope = 'global'
LIMIT 5;