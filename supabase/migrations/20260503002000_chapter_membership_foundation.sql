-- LEAD-006: Chapter membership foundation
-- Adds explicit alumni status and database invariants for chapter applications.

ALTER TYPE public.membership_status ADD VALUE IF NOT EXISTS 'alumni';

UPDATE public.chapter_membership
SET
  position = 'member',
  updated_at = NOW()
WHERE position IS NULL;

ALTER TABLE public.chapter_membership
  ADD CONSTRAINT chapter_membership_position_check
  CHECK (
    position IS NULL
    OR position IN (
      'member',
      'president',
      'vice_president',
      'secretary',
      'treasurer',
      'events_lead',
      'marketing_lead',
      'editor'
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_membership_user_chapter_unique
  ON public.chapter_membership(user_id, chapter_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_membership_one_approved_per_user
  ON public.chapter_membership(user_id)
  WHERE status = 'approved';
