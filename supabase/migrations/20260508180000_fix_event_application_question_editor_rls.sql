BEGIN;

DROP POLICY IF EXISTS "Editors can manage event questions" ON public.event_application_question;

CREATE POLICY "Editors can manage event questions"
  ON public.event_application_question
  FOR ALL
  USING (public.is_admin() OR public.is_event_editor(event_id))
  WITH CHECK (public.is_admin() OR public.is_event_editor(event_id));

DROP POLICY IF EXISTS "Editors can read event answers" ON public.event_application_answer;

CREATE POLICY "Editors can read event answers"
  ON public.event_application_answer
  FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.event_registration er
      WHERE er.id = event_application_answer.registration_id
        AND public.is_event_editor(er.event_id)
    )
  );

COMMIT;
