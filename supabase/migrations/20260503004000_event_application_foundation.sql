-- Migration: LEAD-009 Event Application Foundation
-- Purpose: Support native event application questions and structured answers.
-- Status: Forward-only

BEGIN;

-- Native application questions can now be the primary application path.
-- Keep application_form_url as optional legacy/external-form metadata.
ALTER TABLE public.event
  DROP CONSTRAINT IF EXISTS event_application_url_required;

ALTER TABLE public.event_application_question
  DROP CONSTRAINT IF EXISTS event_application_question_sort_order_nonnegative;

ALTER TABLE public.event_application_question
  ADD CONSTRAINT event_application_question_sort_order_nonnegative
  CHECK (sort_order >= 0);

ALTER TABLE public.event_application_answer
  ADD COLUMN IF NOT EXISTS answer_json jsonb;

COMMENT ON COLUMN public.event_application_answer.answer_json IS
  'Structured answer payload for multi-value application question types such as checkbox.';

COMMIT;
