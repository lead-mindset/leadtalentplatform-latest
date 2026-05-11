BEGIN;

CREATE TABLE IF NOT EXISTS public.pathway_feature_flag (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id text NULL REFERENCES public.chapter(id) ON DELETE CASCADE,
  enable_check_in boolean NOT NULL DEFAULT false,
  enable_recommendation_card boolean NOT NULL DEFAULT false,
  enable_growth_reflection boolean NOT NULL DEFAULT false,
  enable_chapter_insights boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by_id uuid NULL REFERENCES public."user"(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS pathway_feature_flag_global_unique
  ON public.pathway_feature_flag ((chapter_id IS NULL))
  WHERE chapter_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS pathway_feature_flag_chapter_unique
  ON public.pathway_feature_flag (chapter_id)
  WHERE chapter_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS pathway_feature_flag_chapter_lookup
  ON public.pathway_feature_flag (chapter_id);

ALTER TABLE public.pathway_feature_flag ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pathway_feature_flag_admin_all" ON public.pathway_feature_flag;
DROP POLICY IF EXISTS "pathway_feature_flag_service_read" ON public.pathway_feature_flag;

CREATE POLICY "pathway_feature_flag_admin_all"
  ON public.pathway_feature_flag
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "pathway_feature_flag_service_read"
  ON public.pathway_feature_flag
  AS PERMISSIVE FOR SELECT TO service_role
  USING (true);

COMMIT;
