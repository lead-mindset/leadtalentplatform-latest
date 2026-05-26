BEGIN;

DROP POLICY IF EXISTS "pathway_feature_flag_authenticated_read" ON public.pathway_feature_flag;

CREATE POLICY "pathway_feature_flag_authenticated_read"
  ON public.pathway_feature_flag
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

COMMIT;
