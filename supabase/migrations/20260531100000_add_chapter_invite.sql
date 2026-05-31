-- Dedicated chapter invite lifecycle.
-- Invitations are explicit user-facing artifacts; preapproval remains legacy launch eligibility.

BEGIN;

CREATE TABLE IF NOT EXISTS public.chapter_invite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id text NOT NULL REFERENCES public.chapter(id) ON DELETE CASCADE,
  email text NOT NULL,
  normalized_email text NOT NULL,
  token_hash text NOT NULL,
  invite_type text NOT NULL,
  role_level text NOT NULL,
  functional_area text NOT NULL,
  display_title text NOT NULL,
  raw_title text,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  accepted_at timestamptz,
  accepted_by_user_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  revoked_by_user_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  created_by_user_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  created_by_role text NOT NULL,
  replaced_by_invite_id uuid REFERENCES public.chapter_invite(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'chapter_invite',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chapter_invite_email_not_empty
    CHECK (length(btrim(email)) > 0),
  CONSTRAINT chapter_invite_normalized_email_not_empty
    CHECK (length(btrim(normalized_email)) > 0),
  CONSTRAINT chapter_invite_normalized_email_matches_email
    CHECK (normalized_email = lower(btrim(email))),
  CONSTRAINT chapter_invite_token_hash_not_empty
    CHECK (length(btrim(token_hash)) > 0),
  CONSTRAINT chapter_invite_type_check
    CHECK (invite_type IN ('member', 'regular_eboard', 'protected_leader')),
  CONSTRAINT chapter_invite_role_level_check
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
  CONSTRAINT chapter_invite_functional_area_check
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
  CONSTRAINT chapter_invite_display_title_not_empty
    CHECK (length(btrim(display_title)) > 0),
  CONSTRAINT chapter_invite_status_check
    CHECK (status IN ('pending', 'accepted', 'revoked')),
  CONSTRAINT chapter_invite_created_by_role_check
    CHECK (created_by_role IN ('admin', 'chapter_leader', 'system')),
  CONSTRAINT chapter_invite_source_not_empty
    CHECK (length(btrim(source)) > 0),
  CONSTRAINT chapter_invite_expires_after_created
    CHECK (expires_at > created_at),
  CONSTRAINT chapter_invite_accepted_requires_user
    CHECK (
      (accepted_at IS NULL AND accepted_by_user_id IS NULL)
      OR (accepted_at IS NOT NULL AND accepted_by_user_id IS NOT NULL)
    ),
  CONSTRAINT chapter_invite_revoked_requires_user
    CHECK (
      (revoked_at IS NULL AND revoked_by_user_id IS NULL)
      OR (revoked_at IS NOT NULL AND revoked_by_user_id IS NOT NULL)
    ),
  CONSTRAINT chapter_invite_status_lifecycle
    CHECK (
      (status = 'pending' AND accepted_at IS NULL AND revoked_at IS NULL)
      OR (status = 'accepted' AND accepted_at IS NOT NULL AND revoked_at IS NULL)
      OR (status = 'revoked' AND revoked_at IS NOT NULL AND accepted_at IS NULL)
    ),
  CONSTRAINT chapter_invite_type_role_alignment
    CHECK (
      (invite_type = 'member' AND role_level = 'member')
      OR (invite_type = 'regular_eboard' AND role_level IN ('chief_of_staff', 'director', 'coordinator'))
      OR (invite_type = 'protected_leader' AND role_level IN ('president', 'vice_president'))
    )
);

COMMENT ON TABLE public.chapter_invite IS
  'Explicit email-bound chapter invitations for member, e-board, and protected leadership activation.';

COMMENT ON COLUMN public.chapter_invite.token_hash IS
  'SHA-256 hash of the invite token. Raw tokens are sent by email and never stored.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_invite_token_hash_unique
  ON public.chapter_invite(token_hash);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_invite_active_email_chapter
  ON public.chapter_invite(normalized_email, chapter_id)
  WHERE status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_invite_active_protected_role
  ON public.chapter_invite(chapter_id, role_level)
  WHERE status = 'pending'
    AND invite_type = 'protected_leader';

CREATE INDEX IF NOT EXISTS idx_chapter_invite_chapter_status
  ON public.chapter_invite(chapter_id, status);

CREATE INDEX IF NOT EXISTS idx_chapter_invite_expires_at
  ON public.chapter_invite(expires_at);

ALTER TABLE public.chapter_role_assignment
  ADD COLUMN IF NOT EXISTS source_chapter_invite_id uuid REFERENCES public.chapter_invite(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_chapter_role_assignment_source_chapter_invite
  ON public.chapter_role_assignment(source_chapter_invite_id);

ALTER TABLE public.chapter_role_assignment
  DROP CONSTRAINT IF EXISTS chapter_role_assignment_source_check;

ALTER TABLE public.chapter_role_assignment
  ADD CONSTRAINT chapter_role_assignment_source_check
    CHECK (source IN ('manual', 'manual_admin', 'preapproval', 'chapter_invite', 'migration'));

ALTER TABLE public.chapter_permission_grant
  DROP CONSTRAINT IF EXISTS chapter_permission_grant_source_check;

ALTER TABLE public.chapter_permission_grant
  ADD CONSTRAINT chapter_permission_grant_source_check
    CHECK (source IN ('role_template', 'manual_admin', 'preapproval', 'chapter_invite', 'migration'));

ALTER TABLE public.chapter_invite ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chapter_invite_admin_all" ON public.chapter_invite;
CREATE POLICY "chapter_invite_admin_all" ON public.chapter_invite
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "chapter_invite_operator_select" ON public.chapter_invite;
CREATE POLICY "chapter_invite_operator_select" ON public.chapter_invite
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard')
  );

REVOKE ALL ON TABLE public.chapter_invite FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chapter_invite TO authenticated;
GRANT ALL ON TABLE public.chapter_invite TO service_role;

COMMIT;

SELECT 'chapter_invite created' AS status
WHERE EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'chapter_invite'
);
