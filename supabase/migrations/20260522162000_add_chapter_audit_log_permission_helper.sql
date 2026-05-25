-- LEAD chapter activation: audit log and canonical chapter permission helper.

BEGIN;

CREATE TABLE IF NOT EXISTS public.chapter_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  actor_user_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  chapter_id text REFERENCES public.chapter(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chapter_audit_log_action_not_empty
    CHECK (length(btrim(action)) > 0),
  CONSTRAINT chapter_audit_log_entity_type_not_empty
    CHECK (length(btrim(entity_type)) > 0),
  CONSTRAINT chapter_audit_log_metadata_object
    CHECK (jsonb_typeof(metadata) = 'object')
);

COMMENT ON TABLE public.chapter_audit_log IS
  'Audit history for sensitive chapter preapproval, role, permission, membership, and event operations.';

COMMENT ON COLUMN public.chapter_audit_log.metadata IS
  'Structured operation context. Must be a JSON object.';

CREATE INDEX IF NOT EXISTS idx_chapter_audit_log_chapter_created
  ON public.chapter_audit_log(chapter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chapter_audit_log_action_created
  ON public.chapter_audit_log(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chapter_audit_log_actor_created
  ON public.chapter_audit_log(actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chapter_audit_log_target_created
  ON public.chapter_audit_log(target_user_id, created_at DESC);

ALTER TABLE public.chapter_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chapter_audit_log_admin_all" ON public.chapter_audit_log;
CREATE POLICY "chapter_audit_log_admin_all" ON public.chapter_audit_log
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.has_chapter_permission(
  check_chapter_id text,
  check_permission_key text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.chapter_permission_grant cpg
      JOIN public.chapter_membership cm
        ON cm.user_id = cpg.user_id
       AND cm.chapter_id = cpg.chapter_id
       AND cm.status = 'approved'
      JOIN public."user" u
        ON u.id = cpg.user_id
      WHERE cpg.user_id = auth.uid()
        AND cpg.chapter_id = check_chapter_id
        AND cpg.permission_key = check_permission_key
        AND cpg.revoked_at IS NULL
        AND u.role <> 'recruiter'
    );
$$;

COMMENT ON FUNCTION public.has_chapter_permission(text, text) IS
  'Returns true for admins or approved non-recruiter chapter members with an active unrevoked permission grant.';

GRANT EXECUTE ON FUNCTION public.has_chapter_permission(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_chapter_permission(text, text) TO service_role;

REVOKE ALL ON TABLE public.chapter_audit_log FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chapter_audit_log TO authenticated;
GRANT ALL ON TABLE public.chapter_audit_log TO service_role;

COMMIT;

SELECT 'chapter audit log and permission helper created' AS status
WHERE EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'chapter_audit_log'
)
AND EXISTS (
  SELECT 1
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'has_chapter_permission'
);

