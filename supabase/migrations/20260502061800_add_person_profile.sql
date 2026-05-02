-- Migration: 001_add_person_profile.sql
-- Purpose: Create person_profile table for basic onboarding (layered model)
-- Status: Forward-only (no DOWN - table creation is foundational)
-- Pre-validation: N/A (new table)
-- Post-validation: SELECT COUNT(*) = 0 after fresh install

BEGIN;

-- ============================================
-- CREATE TABLE: person_profile
-- Basic onboarding data - NOT tied to chapter membership
-- ============================================

CREATE TABLE IF NOT EXISTS person_profile (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    university text,
    major_or_interest text,
    graduation_year integer,
    linkedin_url text,
    portfolio_url text,
    skills text[],
    gender text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Index on user_id is automatically created by UNIQUE constraint
-- Additional index for common queries
CREATE INDEX IF NOT EXISTS idx_person_profile_created_at ON person_profile(created_at);

-- ============================================
-- CONSTRAINTS
-- ============================================

-- Foreign key to user table (must exist before adding FK)
ALTER TABLE person_profile
    ADD CONSTRAINT fk_person_profile_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE person_profile ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON person_profile FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON person_profile FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON person_profile FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Service role can do anything (for migrations/admin)
CREATE POLICY "Service role full access"
    ON person_profile FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Policy: Authenticated users can read all profiles (for chapter editors viewing members)
CREATE POLICY "Authenticated users can read profiles"
    ON person_profile FOR SELECT
    USING (auth.role() = 'authenticated');

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify table exists
SELECT 'person_profile created' AS status
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'person_profile'
);

-- Verify RLS enabled
SELECT 'RLS enabled' AS status
FROM pg_tables
WHERE tablename = 'person_profile' AND rowsecurity = true;