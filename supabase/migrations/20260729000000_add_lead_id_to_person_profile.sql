-- Add public, immutable LEAD ID to person_profile.
-- Every onboarded user gets a LEAD-XXXXXX identifier at creation time.
-- This is NOT a chapter membership — it's a universal participant ID for events,
-- networking, and platform identification.

ALTER TABLE person_profile ADD COLUMN lead_id text UNIQUE;

-- Sequence for sequential LEAD IDs (LEAD-000001, LEAD-000002, ...)
CREATE SEQUENCE IF NOT EXISTS lead_id_seq START 1;

CREATE OR REPLACE FUNCTION issue_lead_id(p_person_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_lead_id text;
BEGIN
  UPDATE public.person_profile
  SET lead_id = 'LEAD-' || lpad(nextval('public.lead_id_seq')::text, 6, '0')
  WHERE id = p_person_id AND lead_id IS NULL
  RETURNING lead_id INTO v_lead_id;

  IF v_lead_id IS NULL THEN
    SELECT lead_id INTO v_lead_id FROM public.person_profile WHERE id = p_person_id;
  END IF;

  RETURN v_lead_id;
END;
$$;
