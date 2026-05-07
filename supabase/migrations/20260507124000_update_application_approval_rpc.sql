-- Align application approval RPC with the canonical event_registration table.
-- The legacy implementation updated public."EventRegistration", which no longer
-- backs the live event application review flow.

CREATE OR REPLACE FUNCTION public.bulk_approve_applications(
  p_event_id uuid,
  p_application_ids uuid[],
  p_approved_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_current_count integer;
  v_capacity integer;
  v_updated_count integer;
  v_capacity_warning boolean := false;
  v_capacity_status text := 'ok';
BEGIN
  SELECT COUNT(*) INTO v_current_count
  FROM public.event_registration
  WHERE event_id = p_event_id
    AND status = 'registered';

  SELECT capacity INTO v_capacity
  FROM public.event
  WHERE id = p_event_id;

  IF v_capacity IS NOT NULL
    AND (v_current_count + COALESCE(array_length(p_application_ids, 1), 0)) >= v_capacity THEN
    v_capacity_warning := true;
    v_capacity_status :=
      CASE
        WHEN (v_current_count + COALESCE(array_length(p_application_ids, 1), 0)) > v_capacity
          THEN 'over_capacity'
        ELSE 'at_capacity'
      END;
  END IF;

  UPDATE public.event_registration
  SET
    status = 'registered',
    qr_token = COALESCE(qr_token, gen_random_uuid())
  WHERE id = ANY(p_application_ids)
    AND event_id = p_event_id
    AND status = 'pending_review';

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'capacity_warning', v_capacity_warning,
    'capacity_status', v_capacity_status,
    'updated_count', v_updated_count,
    'approved_by', p_approved_by
  );
END;
$$;
