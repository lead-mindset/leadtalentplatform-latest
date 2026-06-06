-- CHACT-01: First-conversation intake for students who want to bring LEAD to a university.
-- This deliberately stays separate from chapter_membership so it cannot grant membership,
-- member IDs, chapter permissions, or alumni state.

CREATE TABLE IF NOT EXISTS public.chapter_activation_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  university_name text NOT NULL,
  motivation text NOT NULL,
  university_context text NOT NULL,
  lead_value text NOT NULL,
  team_status text NOT NULL,
  interested_people_context text NOT NULL,
  opportunities text NOT NULL,
  long_term_commitment text NOT NULL,
  status text NOT NULL DEFAULT 'submitted',
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chapter_activation_interest_status_check
    CHECK (status IN ('submitted', 'orientation_needed', 'ready_for_activation', 'closed')),
  CONSTRAINT chapter_activation_interest_required_text_check
    CHECK (
      length(btrim(university_name)) > 0
      AND length(btrim(motivation)) > 0
      AND length(btrim(university_context)) > 0
      AND length(btrim(lead_value)) > 0
      AND length(btrim(team_status)) > 0
      AND length(btrim(interested_people_context)) > 0
      AND length(btrim(opportunities)) > 0
      AND length(btrim(long_term_commitment)) > 0
    )
);

CREATE INDEX IF NOT EXISTS idx_chapter_activation_interest_user_id
  ON public.chapter_activation_interest(user_id);

CREATE INDEX IF NOT EXISTS idx_chapter_activation_interest_status
  ON public.chapter_activation_interest(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_activation_interest_one_submitted_per_user
  ON public.chapter_activation_interest(user_id)
  WHERE status = 'submitted';

ALTER TABLE public.chapter_activation_interest ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chapter_activation_interest_select_own" ON public.chapter_activation_interest;
CREATE POLICY "chapter_activation_interest_select_own"
  ON public.chapter_activation_interest FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chapter_activation_interest_insert_own" ON public.chapter_activation_interest;
CREATE POLICY "chapter_activation_interest_insert_own"
  ON public.chapter_activation_interest FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chapter_activation_interest_admin_all" ON public.chapter_activation_interest;
CREATE POLICY "chapter_activation_interest_admin_all"
  ON public.chapter_activation_interest FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public."user" u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public."user" u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
  );
