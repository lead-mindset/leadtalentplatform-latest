-- Backfill LEAD IDs for existing person_profile rows created before the
-- lead_id column was added. Uses the existing issue_lead_id() function
-- which is idempotent (skips rows where lead_id IS NOT NULL).

DO $$
DECLARE
  rec RECORD;
  v_lead_id text;
BEGIN
  FOR rec IN SELECT id FROM public.person_profile WHERE lead_id IS NULL LOOP
    SELECT public.issue_lead_id(rec.id) INTO v_lead_id;
  END LOOP;
END;
$$;
