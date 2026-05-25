-- LEAD chapter activation: preapproved member and e-board emails.
-- Real chapter email lists must be loaded operationally, not committed here.

BEGIN;

CREATE TABLE IF NOT EXISTS public.chapter_preapproval (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  normalized_email text NOT NULL,
  chapter_id text NOT NULL REFERENCES public.chapter(id) ON DELETE CASCADE,
  preapproval_type text NOT NULL,
  role_level text,
  functional_area text,
  display_title text,
  raw_title text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '6 months'),
  consumed_at timestamptz,
  consumed_by_user_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  revoked_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  created_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'manual_admin',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chapter_preapproval_email_not_empty
    CHECK (length(btrim(email)) > 0),
  CONSTRAINT chapter_preapproval_normalized_email_not_empty
    CHECK (length(btrim(normalized_email)) > 0),
  CONSTRAINT chapter_preapproval_normalized_email_matches_email
    CHECK (normalized_email = lower(btrim(email))),
  CONSTRAINT chapter_preapproval_type_check
    CHECK (preapproval_type IN ('member', 'eboard')),
  CONSTRAINT chapter_preapproval_source_not_empty
    CHECK (length(btrim(source)) > 0),
  CONSTRAINT chapter_preapproval_role_fields_by_type
    CHECK (
      (
        preapproval_type = 'member'
        AND role_level IS NULL
        AND functional_area IS NULL
        AND display_title IS NULL
      )
      OR
      (
        preapproval_type = 'eboard'
        AND role_level IS NOT NULL
        AND length(btrim(role_level)) > 0
        AND functional_area IS NOT NULL
        AND length(btrim(functional_area)) > 0
        AND display_title IS NOT NULL
        AND length(btrim(display_title)) > 0
      )
    ),
  CONSTRAINT chapter_preapproval_expires_after_created
    CHECK (expires_at > created_at),
  CONSTRAINT chapter_preapproval_consumed_requires_user
    CHECK (
      (consumed_at IS NULL AND consumed_by_user_id IS NULL)
      OR (consumed_at IS NOT NULL AND consumed_by_user_id IS NOT NULL)
    ),
  CONSTRAINT chapter_preapproval_revoked_requires_user
    CHECK (
      (revoked_at IS NULL AND revoked_by_id IS NULL)
      OR (revoked_at IS NOT NULL AND revoked_by_id IS NOT NULL)
    )
);

COMMENT ON TABLE public.chapter_preapproval IS
  'Email-bound preapproval records for verified chapter member and e-board activation.';

COMMENT ON COLUMN public.chapter_preapproval.normalized_email IS
  'Lowercase trimmed email used for exact claim matching.';

COMMENT ON COLUMN public.chapter_preapproval.preapproval_type IS
  'member auto-approves membership; eboard also creates role assignment and permission grants in service code.';

CREATE INDEX IF NOT EXISTS idx_chapter_preapproval_normalized_email_active
  ON public.chapter_preapproval(normalized_email)
  WHERE consumed_at IS NULL
    AND revoked_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_preapproval_active_email_chapter
  ON public.chapter_preapproval(normalized_email, chapter_id)
  WHERE consumed_at IS NULL
    AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chapter_preapproval_chapter_type
  ON public.chapter_preapproval(chapter_id, preapproval_type);

CREATE INDEX IF NOT EXISTS idx_chapter_preapproval_expires_at
  ON public.chapter_preapproval(expires_at);

ALTER TABLE public.chapter_preapproval ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chapter_preapproval_admin_all" ON public.chapter_preapproval;
CREATE POLICY "chapter_preapproval_admin_all" ON public.chapter_preapproval
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON TABLE public.chapter_preapproval FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chapter_preapproval TO authenticated;
GRANT ALL ON TABLE public.chapter_preapproval TO service_role;

COMMIT;

SELECT 'chapter_preapproval created' AS status
WHERE EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'chapter_preapproval'
);

SELECT 'chapter_preapproval indexes created' AS status
WHERE EXISTS (
  SELECT 1
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'chapter_preapproval'
    AND indexname = 'idx_chapter_preapproval_active_email_chapter'
);

