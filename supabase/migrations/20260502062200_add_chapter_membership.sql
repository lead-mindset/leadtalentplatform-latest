-- Migration: 002_add_chapter_membership.sql
-- Purpose: Create chapter_membership table for chapter approval and affiliation
-- Status: Forward-only (no DOWN - table creation is foundational)
-- Pre-validation: N/A (new table)
-- Post-validation: SELECT COUNT(*) = 0 after fresh install

BEGIN;

-- ============================================
-- CREATE TYPE: membership_status
-- ============================================

DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM (
        'pending',
        'approved',
        'rejected',
        'inactive'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- CREATE TABLE: chapter_membership
-- Chapter membership with approval workflow
-- One user can have MULTIPLE chapter memberships
-- ============================================

CREATE TABLE IF NOT EXISTS chapter_membership (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    chapter_id text NOT NULL,
    status membership_status NOT NULL DEFAULT 'pending',
    position text,
    approved_by_id uuid,
    member_id text UNIQUE,
    joined_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Index on user_id for "get user's memberships"
CREATE INDEX IF NOT EXISTS idx_chapter_membership_user_id
    ON chapter_membership(user_id);

-- Index on chapter_id for "get chapter's members"
CREATE INDEX IF NOT EXISTS idx_chapter_membership_chapter_id
    ON chapter_membership(chapter_id);

-- Index on member_id for lookups by member ID
CREATE INDEX IF NOT EXISTS idx_chapter_membership_member_id
    ON chapter_membership(member_id);

-- Compound index for common query: "get all pending members for chapter X"
CREATE INDEX IF NOT EXISTS idx_chapter_membership_chapter_status
    ON chapter_membership(chapter_id, status);

-- ============================================
-- CONSTRAINTS
-- ============================================

-- Foreign key to user table
ALTER TABLE chapter_membership
    ADD CONSTRAINT fk_chapter_membership_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Foreign key to chapter table (chapter.id is TEXT, not UUID)
ALTER TABLE chapter_membership
    ADD CONSTRAINT fk_chapter_membership_chapter
    FOREIGN KEY (chapter_id) REFERENCES chapter(id)
    ON DELETE CASCADE;

-- Foreign key to approved_by (self-reference to user)
ALTER TABLE chapter_membership
    ADD CONSTRAINT fk_chapter_membership_approved_by
    FOREIGN KEY (approved_by_id) REFERENCES auth.users(id)
    ON DELETE SET NULL;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE chapter_membership ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own memberships
CREATE POLICY "Users can read own memberships"
    ON chapter_membership FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert membership request for themselves
CREATE POLICY "Users can insert own membership"
    ON chapter_membership FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Editors can manage their chapter's memberships
-- (Controlled by application logic - editors have chapter admin rights)
CREATE POLICY "Editors can manage chapter memberships"
    ON chapter_membership FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM chapter_membership cm2
            WHERE cm2.user_id = auth.uid()
            AND cm2.chapter_id = chapter_membership.chapter_id
            AND cm2.status = 'approved'
            AND cm2.position IN ('president', 'vice_president', 'secretary', 'treasurer', 'editor')
        )
        OR auth.jwt()->>'role' = 'service_role'
    );

-- Policy: Admins can do everything
CREATE POLICY "Service role full access to memberships"
    ON chapter_membership FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'chapter_membership created' AS status
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'chapter_membership'
);

SELECT 'Indexes created' AS status
FROM pg_indexes
WHERE tablename = 'chapter_membership'
AND indexname IN (
    'idx_chapter_membership_user_id',
    'idx_chapter_membership_chapter_id',
    'idx_chapter_membership_member_id',
    'idx_chapter_membership_chapter_status'
);

SELECT 'RLS enabled' AS status
FROM pg_tables
WHERE tablename = 'chapter_membership' AND rowsecurity = true;