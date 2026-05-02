-- Migration: 005_add_event_application_tables.sql
-- Purpose: Create event_application_question and event_application_answer tables
-- Status: Forward-only (no DOWN - table creation is foundational)
-- Pre-validation: N/A (new tables)
-- Post-validation: SELECT COUNT(*) = 0 after fresh install

BEGIN;

-- ============================================
-- CREATE TYPE: question_type
-- ============================================

DO $$ BEGIN
    CREATE TYPE question_type AS ENUM (
        'short_text',
        'long_text',
        'single_select',
        'checkbox',
        'url'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- CREATE TABLE: event_application_question
-- Custom questions for application-based events
-- ============================================

CREATE TABLE IF NOT EXISTS event_application_question (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL,
    question_type question_type NOT NULL DEFAULT 'short_text',
    question_text text NOT NULL,
    options text[],
    is_required boolean NOT NULL DEFAULT false,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Index on event_id for "get questions for event"
CREATE INDEX IF NOT EXISTS idx_event_application_question_event_id
    ON event_application_question(event_id);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_event_application_question_sort_order
    ON event_application_question(event_id, sort_order);

-- Foreign key to event
ALTER TABLE event_application_question
    ADD CONSTRAINT fk_event_application_question_event
    FOREIGN KEY (event_id) REFERENCES event(id)
    ON DELETE CASCADE;

-- ============================================
-- CREATE TABLE: event_application_answer
-- Applicant answers to event questions
-- ============================================

CREATE TABLE IF NOT EXISTS event_application_answer (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id uuid NOT NULL,
    question_id uuid NOT NULL,
    answer_text text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Index on registration_id for "get answers for registration"
CREATE INDEX IF NOT EXISTS idx_event_application_answer_registration_id
    ON event_application_answer(registration_id);

-- Index on question_id for "get answers for question"
CREATE INDEX IF NOT EXISTS idx_event_application_answer_question_id
    ON event_application_answer(question_id);

-- ============================================
-- CONSTRAINTS
-- ============================================

-- Foreign key to event_registration
ALTER TABLE event_application_answer
    ADD CONSTRAINT fk_event_application_answer_registration
    FOREIGN KEY (registration_id) REFERENCES event_registration(id)
    ON DELETE CASCADE;

-- Foreign key to question
ALTER TABLE event_application_answer
    ADD CONSTRAINT fk_event_application_answer_question
    FOREIGN KEY (question_id) REFERENCES event_application_question(id)
    ON DELETE CASCADE;

-- Unique constraint: one answer per question per registration
ALTER TABLE event_application_answer
    ADD CONSTRAINT uq_event_application_answer_unique
    UNIQUE (registration_id, question_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- event_application_question RLS
ALTER TABLE event_application_question ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read questions (public event info)
CREATE POLICY "Public can read event questions"
    ON event_application_question FOR SELECT
    USING (true);

-- Policy: Editors can manage their event's questions
CREATE POLICY "Editors can manage event questions"
    ON event_application_question FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM event_chapter ec
            JOIN chapter_membership cm ON ec.chapter_id = cm.chapter_id
            WHERE ec.event_id = event_application_question.event_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'approved'
            AND cm.position IN ('president', 'vice_president', 'secretary', 'treasurer', 'editor')
        )
        OR auth.jwt()->>'role' = 'service_role'
    );

-- event_application_answer RLS
ALTER TABLE event_application_answer ENABLE ROW LEVEL SECURITY;

-- Policy: User can read their own answers
CREATE POLICY "User can read own answers"
    ON event_application_answer FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM event_registration er
            WHERE er.id = event_application_answer.registration_id
            AND er.user_id = auth.uid()
        )
        OR auth.jwt()->>'role' = 'service_role'
    );

-- Policy: User can insert their own answers (application submission)
CREATE POLICY "User can submit own answers"
    ON event_application_answer FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM event_registration er
            WHERE er.id = event_application_answer.registration_id
            AND er.user_id = auth.uid()
        )
    );

-- Policy: User can update their own answers (simplified - no deadline field)
CREATE POLICY "User can update own answers"
    ON event_application_answer FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM event_registration er
            WHERE er.id = event_application_answer.registration_id
            AND er.user_id = auth.uid()
        )
        OR auth.jwt()->>'role' = 'service_role'
    );

-- Policy: Editors can read answers for their events
CREATE POLICY "Editors can read event answers"
    ON event_application_answer FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM event_chapter ec
            JOIN chapter_membership cm ON ec.chapter_id = cm.chapter_id
            JOIN event_registration er ON ec.event_id = er.event_id
            WHERE er.id = event_application_answer.registration_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'approved'
            AND cm.position IN ('president', 'vice_president', 'secretary', 'treasurer', 'editor')
        )
        OR auth.jwt()->>'role' = 'service_role'
    );

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'event_application_question created' AS status
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'event_application_question'
);

SELECT 'event_application_answer created' AS status
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'event_application_answer'
);

SELECT 'RLS enabled on both tables' AS status
FROM pg_tables
WHERE tablename IN ('event_application_question', 'event_application_answer')
AND rowsecurity = true
GROUP BY tablename
HAVING COUNT(*) = 2;