BEGIN;

DROP POLICY IF EXISTS "pathway_recommendation_student_insert_own" ON public.pathway_recommendation;
CREATE POLICY "pathway_recommendation_student_insert_own"
  ON public.pathway_recommendation
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.pathway_check_in
      WHERE pathway_check_in.id = pathway_recommendation.check_in_id
        AND pathway_check_in.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pathway_recommendation_student_delete_own" ON public.pathway_recommendation;
CREATE POLICY "pathway_recommendation_student_delete_own"
  ON public.pathway_recommendation
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.pathway_check_in
      WHERE pathway_check_in.id = pathway_recommendation.check_in_id
        AND pathway_check_in.user_id = auth.uid()
    )
  );

COMMIT;
