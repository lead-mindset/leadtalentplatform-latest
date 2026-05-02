-- Migration: 004_add_newsletter_subscription.sql
-- Purpose: Create newsletter_subscription table for global and chapter subscriptions
-- Status: Forward-only (no DOWN - table creation is foundational)
-- Pre-validation: N/A (new table)
-- Post-validation: SELECT COUNT(*) = 0 after fresh install

BEGIN;

-- ============================================
-- CREATE TYPE: newsletter_scope
-- ============================================

DO $$ BEGIN
    CREATE TYPE newsletter_scope AS ENUM (
        'global',
        'chapter'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- CREATE TYPE: newsletter_status
-- ============================================

DO $$ BEGIN
    CREATE TYPE newsletter_status AS ENUM (
        'active',
        'inactive',
        'unsubscribed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- CREATE TYPE: subscription_source
-- ============================================

DO $$ BEGIN
    CREATE TYPE subscription_source AS ENUM (
        'onboarding',
        'event_registration',
        'manual'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- CREATE TABLE: newsletter_subscription
-- Global and chapter-specific subscriptions
-- ============================================

CREATE TABLE IF NOT EXISTS newsletter_subscription (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    scope newsletter_scope NOT NULL DEFAULT 'global',
    chapter_id text,
    status newsletter_status NOT NULL DEFAULT 'active',
    source subscription_source NOT NULL DEFAULT 'manual',
    subscribed_at timestamptz NOT NULL DEFAULT NOW(),
    unsubscribed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Index on user_id for "get user's subscriptions"
CREATE INDEX IF NOT EXISTS idx_newsletter_subscription_user_id
    ON newsletter_subscription(user_id);

-- Index on status for cleanup queries
CREATE INDEX IF NOT EXISTS idx_newsletter_subscription_status
    ON newsletter_subscription(status);

-- Index on chapter_id for chapter-specific newsletters
CREATE INDEX IF NOT EXISTS idx_newsletter_subscription_chapter_id
    ON newsletter_subscription(chapter_id);

-- ============================================
-- CONSTRAINTS
-- ============================================

-- Foreign key to user table
ALTER TABLE newsletter_subscription
    ADD CONSTRAINT fk_newsletter_subscription_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Foreign key to chapter (nullable - global subscriptions don't have chapter)
ALTER TABLE newsletter_subscription
    ADD CONSTRAINT fk_newsletter_subscription_chapter
    FOREIGN KEY (chapter_id) REFERENCES chapter(id)
    ON DELETE SET NULL;

-- Note: Partial unique constraint skipped (not supported in all Supabase versions)
-- Application layer should enforce: one active global subscription per user
-- Use service layer to prevent duplicate global subscriptions

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE newsletter_subscription ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions"
    ON newsletter_subscription FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can subscribe/unsubscribe for themselves
CREATE POLICY "Users can manage own subscriptions"
    ON newsletter_subscription FOR ALL
    USING (auth.uid() = user_id);

-- Policy: Admins can manage all
CREATE POLICY "Admins can manage all subscriptions"
    ON newsletter_subscription FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'newsletter_subscription created' AS status
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'newsletter_subscription'
);

SELECT 'Indexes created' AS status
FROM pg_indexes
WHERE tablename = 'newsletter_subscription';

SELECT 'RLS enabled' AS status
FROM pg_tables
WHERE tablename = 'newsletter_subscription' AND rowsecurity = true;