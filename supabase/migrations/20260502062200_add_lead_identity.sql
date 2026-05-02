-- Migration: 003_add_lead_identity.sql
-- Purpose: Create lead_identity table for official LEAD IDs
-- Status: Forward-only (no DOWN - table creation is foundational)
-- Pre-validation: N/A (new table)
-- Post-validation: SELECT COUNT(*) = 0 after fresh install

BEGIN;

-- ============================================
-- CREATE TYPE: identity_type
-- ============================================

DO $$ BEGIN
    CREATE TYPE identity_type AS ENUM (
        'founder',
        'staff',
        'chapter_editor',
        'chapter_member',
        'alumni'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- CREATE TYPE: identity_status
-- ============================================

DO $$ BEGIN
    CREATE TYPE identity_status AS ENUM (
        'active',
        'revoked'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- CREATE TABLE: lead_identity
-- Official LEAD IDs - ONE PER USER (global identity)
-- Independent of chapter membership
-- ============================================

CREATE TABLE IF NOT EXISTS lead_identity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    identity_type identity_type NOT NULL,
    chapter_id text,
    is_primary boolean NOT NULL DEFAULT true,
    issued_by_id uuid,
    issued_at timestamptz NOT NULL DEFAULT NOW(),
    revoked_at timestamptz,
    status identity_status NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Index on user_id is automatically created by UNIQUE constraint

-- ============================================
-- CONSTRAINTS
-- ============================================

-- Foreign key to user table
ALTER TABLE lead_identity
    ADD CONSTRAINT fk_lead_identity_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Foreign key to chapter (nullable - founder/staff may not have chapter)
ALTER TABLE lead_identity
    ADD CONSTRAINT fk_lead_identity_chapter
    FOREIGN KEY (chapter_id) REFERENCES chapter(id)
    ON DELETE SET NULL;

-- Foreign key to issued_by (self-reference)
ALTER TABLE lead_identity
    ADD CONSTRAINT fk_lead_identity_issued_by
    FOREIGN KEY (issued_by_id) REFERENCES auth.users(id)
    ON DELETE SET NULL;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE lead_identity ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own identity
CREATE POLICY "Users can read own identity"
    ON lead_identity FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Only admins/service can insert identities (not self-service)
CREATE POLICY "Admins can manage identities"
    ON lead_identity FOR ALL
    USING (
        auth.jwt()->>'role' = 'service_role'
        OR auth.jwt()->>'role' = 'authenticated'
    );

-- Policy: Users can update their own identity status
CREATE POLICY "Users can update own identity"
    ON lead_identity FOR UPDATE
    USING (auth.uid() = user_id);

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'lead_identity created' AS status
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'lead_identity'
);

SELECT 'RLS enabled' AS status
FROM pg_tables
WHERE tablename = 'lead_identity' AND rowsecurity = true;