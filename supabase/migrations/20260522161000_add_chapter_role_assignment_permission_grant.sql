-- LEAD chapter activation: official chapter responsibilities and scoped permissions.
-- This migration adds schema only. Permission helper/RLS expansion follows separately.

BEGIN;

CREATE TABLE IF NOT EXISTS public.chapter_role_assignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  chapter_id text NOT NULL REFERENCES public.chapter(id) ON DELETE CASCADE,
  role_level text NOT NULL,
  functional_area text NOT NULL,
  display_title text NOT NULL,
  raw_title text,
  is_primary boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active',
  assigned_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'manual',
  source_preapproval_id uuid REFERENCES public.chapter_preapproval(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chapter_role_assignment_role_level_check
    CHECK (
      role_level IN (
        'president',
        'vice_president',
        'chief_of_staff',
        'director',
        'coordinator',
        'member'
      )
    ),
  CONSTRAINT chapter_role_assignment_functional_area_check
    CHECK (
      functional_area IN (
        'general_leadership',
        'strategy_operations',
        'marketing_communications',
        'events_experience',
        'finance_legal',
        'chapter_development',
        'academic_excellence',
        'professional_development',
        'leadership',
        'women_in_stem',
        'research',
        'projects',
        'partnerships_external_relations',
        'people_talent',
        'other'
      )
    ),
  CONSTRAINT chapter_role_assignment_display_title_not_empty
    CHECK (length(btrim(display_title)) > 0),
  CONSTRAINT chapter_role_assignment_status_check
    CHECK (status IN ('active', 'inactive')),
  CONSTRAINT chapter_role_assignment_source_check
    CHECK (source IN ('manual', 'manual_admin', 'preapproval', 'migration')),
  CONSTRAINT chapter_role_assignment_source_not_empty
    CHECK (length(btrim(source)) > 0),
  CONSTRAINT chapter_role_assignment_lifecycle_check
    CHECK (
      (status = 'active' AND ends_at IS NULL)
      OR
      (status = 'inactive' AND ends_at IS NOT NULL AND ends_at > starts_at)
    )
);

COMMENT ON TABLE public.chapter_role_assignment IS
  'Official chapter responsibility/title assignments for approved chapter members.';

COMMENT ON COLUMN public.chapter_role_assignment.role_level IS
  'Normalized seniority such as president, vice_president, chief_of_staff, director, coordinator, or member.';

COMMENT ON COLUMN public.chapter_role_assignment.functional_area IS
  'Normalized responsibility area used for reporting and permission templates.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_role_assignment_one_active_primary
  ON public.chapter_role_assignment(user_id, chapter_id)
  WHERE is_primary = true
    AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_chapter_role_assignment_chapter_status
  ON public.chapter_role_assignment(chapter_id, status);

CREATE INDEX IF NOT EXISTS idx_chapter_role_assignment_user_chapter
  ON public.chapter_role_assignment(user_id, chapter_id);

CREATE INDEX IF NOT EXISTS idx_chapter_role_assignment_source_preapproval
  ON public.chapter_role_assignment(source_preapproval_id);

CREATE TABLE IF NOT EXISTS public.chapter_permission_grant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  chapter_id text NOT NULL REFERENCES public.chapter(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  source text NOT NULL,
  source_role_assignment_id uuid REFERENCES public.chapter_role_assignment(id) ON DELETE SET NULL,
  granted_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  revoke_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chapter_permission_grant_permission_key_check
    CHECK (
      permission_key IN (
        'chapter.dashboard.access',
        'chapter.members.view_approved',
        'chapter.members.view_alumni',
        'chapter.members.view_member_contact',
        'chapter.members.view_applicants',
        'chapter.members.view_rejected',
        'chapter.members.view_inactive',
        'chapter.members.manage_applications',
        'chapter.members.revoke',
        'chapter.roles.assign_eboard',
        'chapter.events.manage',
        'chapter.events.view_registrations',
        'chapter.events.check_in',
        'chapter.events.archive',
        'chapter.funding.view',
        'chapter.funding.submit',
        'chapter.funding.review',
        'chapter.pulse.view',
        'chapter.pulse.manage_action_plan',
        'chapter.impact_metrics.view',
        'chapter.impact_metrics.edit'
      )
    ),
  CONSTRAINT chapter_permission_grant_source_check
    CHECK (source IN ('role_template', 'manual_admin', 'preapproval', 'migration')),
  CONSTRAINT chapter_permission_grant_source_not_empty
    CHECK (length(btrim(source)) > 0),
  CONSTRAINT chapter_permission_grant_revoke_check
    CHECK (
      (
        revoked_at IS NULL
        AND revoked_by_id IS NULL
        AND revoke_reason IS NULL
      )
      OR
      (
        revoked_at IS NOT NULL
        AND revoked_by_id IS NOT NULL
        AND revoke_reason IS NOT NULL
        AND length(btrim(revoke_reason)) > 0
      )
    )
);

COMMENT ON TABLE public.chapter_permission_grant IS
  'Chapter-scoped product capabilities for official chapter operators.';

COMMENT ON COLUMN public.chapter_permission_grant.permission_key IS
  'Action key such as chapter.dashboard.access or chapter.events.check_in.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_permission_active_unique
  ON public.chapter_permission_grant(user_id, chapter_id, permission_key)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chapter_permission_user_chapter
  ON public.chapter_permission_grant(user_id, chapter_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chapter_permission_chapter_key
  ON public.chapter_permission_grant(chapter_id, permission_key)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chapter_permission_source_assignment
  ON public.chapter_permission_grant(source_role_assignment_id);

ALTER TABLE public.chapter_role_assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_permission_grant ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chapter_role_assignment_admin_all" ON public.chapter_role_assignment;
CREATE POLICY "chapter_role_assignment_admin_all" ON public.chapter_role_assignment
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "chapter_permission_grant_admin_all" ON public.chapter_permission_grant;
CREATE POLICY "chapter_permission_grant_admin_all" ON public.chapter_permission_grant
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON TABLE public.chapter_role_assignment FROM anon;
REVOKE ALL ON TABLE public.chapter_permission_grant FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chapter_role_assignment TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chapter_permission_grant TO authenticated;
GRANT ALL ON TABLE public.chapter_role_assignment TO service_role;
GRANT ALL ON TABLE public.chapter_permission_grant TO service_role;

COMMIT;

SELECT 'chapter role and permission tables created' AS status
WHERE EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'chapter_role_assignment'
)
AND EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'chapter_permission_grant'
);

SELECT 'chapter permission unique index created' AS status
WHERE EXISTS (
  SELECT 1
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'chapter_permission_grant'
    AND indexname = 'idx_chapter_permission_active_unique'
);

