-- LEAD Intelligence: event-specific Pathway metadata and recommendation traceability.

BEGIN;

CREATE TABLE IF NOT EXISTS public.event_pathway_metadata (
  event_id uuid PRIMARY KEY REFERENCES public.event(id) ON DELETE CASCADE,
  is_pathway_eligible boolean NOT NULL DEFAULT false,
  primary_okr text,
  okr_alignment text[] NOT NULL DEFAULT '{}'::text[],
  pillar_keys text[] NOT NULL DEFAULT '{}'::text[],
  student_goal text,
  growth_stage_fit text[] NOT NULL DEFAULT '{}'::text[],
  student_outcomes text[] NOT NULL DEFAULT '{}'::text[],
  proof_outcome text,
  evidence_signals text[] NOT NULL DEFAULT '{}'::text[],
  audience text,
  cta_type text,
  coordination_risk text NOT NULL DEFAULT 'low',
  recommendation_safety text NOT NULL DEFAULT 'manual_review',
  metadata_status text NOT NULL DEFAULT 'draft',
  notes text,
  created_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  updated_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_pathway_metadata_primary_okr_check
    CHECK (
      primary_okr IS NULL
      OR primary_okr IN ('inspire', 'unite', 'empower', 'elevate')
    ),
  CONSTRAINT event_pathway_metadata_okr_alignment_check
    CHECK (okr_alignment <@ ARRAY['inspire', 'unite', 'empower', 'elevate']::text[]),
  CONSTRAINT event_pathway_metadata_pillar_keys_check
    CHECK (
      pillar_keys <@ ARRAY[
        'lead_academia',
        'academic_excellence',
        'womens_excellence',
        'professional_development',
        'leadership_development',
        'community_outreach',
        'chapter_development'
      ]::text[]
    ),
  CONSTRAINT event_pathway_metadata_student_goal_check
    CHECK (
      student_goal IS NULL
      OR student_goal IN (
        'career_exploration',
        'technical_experience',
        'opportunity_readiness',
        'community_mentorship',
        'leadership'
      )
    ),
  CONSTRAINT event_pathway_metadata_growth_stage_fit_check
    CHECK (
      growth_stage_fit <@ ARRAY[
        'explorer',
        'builder',
        'leader',
        'candidate',
        'emerging_professional'
      ]::text[]
    ),
  CONSTRAINT event_pathway_metadata_student_outcomes_check
    CHECK (
      student_outcomes <@ ARRAY[
        'mission_orientation',
        'belonging',
        'career_exposure',
        'technical_skill',
        'innovation_project',
        'proof_artifact',
        'professional_readiness',
        'profile_visibility',
        'leadership_confidence',
        'teamwork',
        'reflection',
        'community_service'
      ]::text[]
    ),
  CONSTRAINT event_pathway_metadata_proof_outcome_check
    CHECK (
      proof_outcome IS NULL
      OR proof_outcome IN (
        'none',
        'reflection',
        'certificate',
        'pitch_deck',
        'linkedin_update',
        'resume_bullet',
        'project_note',
        'portfolio_item'
      )
    ),
  CONSTRAINT event_pathway_metadata_evidence_signals_check
    CHECK (
      evidence_signals <@ ARRAY[
        'event_registration',
        'event_attendance',
        'application_submitted',
        'reflection_completed',
        'proof_submitted',
        'certificate_earned',
        'linkedin_updated',
        'resume_updated',
        'profile_updated',
        'mission_recap_completed'
      ]::text[]
    ),
  CONSTRAINT event_pathway_metadata_audience_check
    CHECK (
      audience IS NULL
      OR audience IN (
        'new_member',
        'active_member',
        'chapter_leader',
        'all_students',
        'application_required',
        'open_public',
        'chapter_only'
      )
    ),
  CONSTRAINT event_pathway_metadata_cta_type_check
    CHECK (
      cta_type IS NULL
      OR cta_type IN (
        'register',
        'apply',
        'attend',
        'reflect',
        'update_profile',
        'update_linkedin',
        'update_resume',
        'capture_proof'
      )
    ),
  CONSTRAINT event_pathway_metadata_coordination_risk_check
    CHECK (coordination_risk IN ('low', 'medium', 'high')),
  CONSTRAINT event_pathway_metadata_recommendation_safety_check
    CHECK (
      recommendation_safety IN (
        'recommendable_now',
        'recommend_only_if_event_active',
        'manual_review',
        'not_recommendable'
      )
    ),
  CONSTRAINT event_pathway_metadata_status_check
    CHECK (metadata_status IN ('draft', 'ready', 'archived')),
  CONSTRAINT event_pathway_metadata_eligible_requires_metadata
    CHECK (
      is_pathway_eligible = false
      OR (
        primary_okr IS NOT NULL
        AND array_length(pillar_keys, 1) IS NOT NULL
        AND student_goal IS NOT NULL
        AND array_length(growth_stage_fit, 1) IS NOT NULL
        AND array_length(student_outcomes, 1) IS NOT NULL
        AND proof_outcome IS NOT NULL
        AND array_length(evidence_signals, 1) IS NOT NULL
        AND audience IS NOT NULL
        AND cta_type IS NOT NULL
      )
    )
);

COMMENT ON TABLE public.event_pathway_metadata IS
  'Student-safe Pathway recommendation metadata for a platform event.';

COMMENT ON COLUMN public.event_pathway_metadata.is_pathway_eligible IS
  'When true, the event can be considered by Pathway matching once metadata_status and safety permit it.';

COMMENT ON COLUMN public.event_pathway_metadata.recommendation_safety IS
  'Controls whether an event can be recommended immediately, only while active, after manual review, or not at all.';

CREATE INDEX IF NOT EXISTS idx_event_pathway_metadata_eligible
  ON public.event_pathway_metadata(is_pathway_eligible, metadata_status, recommendation_safety);

CREATE INDEX IF NOT EXISTS idx_event_pathway_metadata_primary_okr
  ON public.event_pathway_metadata(primary_okr)
  WHERE primary_okr IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_pathway_metadata_pillar_keys
  ON public.event_pathway_metadata USING gin(pillar_keys);

CREATE INDEX IF NOT EXISTS idx_event_pathway_metadata_student_outcomes
  ON public.event_pathway_metadata USING gin(student_outcomes);

ALTER TABLE public.event_pathway_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_pathway_metadata_admin_all" ON public.event_pathway_metadata;
CREATE POLICY "event_pathway_metadata_admin_all" ON public.event_pathway_metadata
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "event_pathway_metadata_editor_select" ON public.event_pathway_metadata;
CREATE POLICY "event_pathway_metadata_editor_select" ON public.event_pathway_metadata
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_event_editor(event_id));

DROP POLICY IF EXISTS "event_pathway_metadata_published_select" ON public.event_pathway_metadata;
CREATE POLICY "event_pathway_metadata_published_select" ON public.event_pathway_metadata
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    is_pathway_eligible = true
    AND EXISTS (
      SELECT 1
      FROM public.event e
      WHERE e.id = event_pathway_metadata.event_id
        AND e.is_published = true
    )
  );

DROP POLICY IF EXISTS "event_pathway_metadata_editor_insert" ON public.event_pathway_metadata;
CREATE POLICY "event_pathway_metadata_editor_insert" ON public.event_pathway_metadata
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    public.is_event_editor(event_id)
    AND created_by_id = auth.uid()
    AND updated_by_id = auth.uid()
  );

DROP POLICY IF EXISTS "event_pathway_metadata_editor_update" ON public.event_pathway_metadata;
CREATE POLICY "event_pathway_metadata_editor_update" ON public.event_pathway_metadata
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.is_event_editor(event_id))
  WITH CHECK (
    public.is_event_editor(event_id)
    AND updated_by_id = auth.uid()
  );

DROP POLICY IF EXISTS "event_pathway_metadata_editor_delete" ON public.event_pathway_metadata;
CREATE POLICY "event_pathway_metadata_editor_delete" ON public.event_pathway_metadata
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.is_event_editor(event_id));

DROP POLICY IF EXISTS "event_pathway_metadata_service_all" ON public.event_pathway_metadata;
CREATE POLICY "event_pathway_metadata_service_all" ON public.event_pathway_metadata
  AS PERMISSIVE FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.pathway_recommendation
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'fixed_action',
  ADD COLUMN IF NOT EXISTS source_event_id uuid REFERENCES public.event(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cta_type text,
  ADD COLUMN IF NOT EXISTS evidence_signal text,
  ADD COLUMN IF NOT EXISTS matched_reasons jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.pathway_recommendation
  ADD CONSTRAINT pathway_recommendation_source_type_check
    CHECK (source_type IN ('event', 'profile_action', 'proof_action', 'fixed_action')),
  ADD CONSTRAINT pathway_recommendation_cta_type_check
    CHECK (
      cta_type IS NULL
      OR cta_type IN (
        'register',
        'apply',
        'attend',
        'reflect',
        'update_profile',
        'update_linkedin',
        'update_resume',
        'capture_proof'
      )
    ),
  ADD CONSTRAINT pathway_recommendation_evidence_signal_check
    CHECK (
      evidence_signal IS NULL
      OR evidence_signal IN (
        'event_registration',
        'event_attendance',
        'application_submitted',
        'reflection_completed',
        'proof_submitted',
        'certificate_earned',
        'linkedin_updated',
        'resume_updated',
        'profile_updated',
        'mission_recap_completed'
      )
    ),
  ADD CONSTRAINT pathway_recommendation_event_source_consistency
    CHECK (
      (source_type = 'event' AND source_event_id IS NOT NULL)
      OR (source_type <> 'event')
    ),
  ADD CONSTRAINT pathway_recommendation_matched_reasons_array
    CHECK (jsonb_typeof(matched_reasons) = 'array');

COMMENT ON COLUMN public.pathway_recommendation.source_type IS
  'Auditable recommendation source: event, profile action, proof action, or fixed action.';

COMMENT ON COLUMN public.pathway_recommendation.source_event_id IS
  'Event source when a recommendation comes from event_pathway_metadata.';

COMMENT ON COLUMN public.pathway_recommendation.matched_reasons IS
  'JSON array of student-safe reasons explaining why the recommendation matched.';

CREATE INDEX IF NOT EXISTS idx_pathway_recommendation_source_event
  ON public.pathway_recommendation(source_event_id)
  WHERE source_event_id IS NOT NULL;

COMMIT;
