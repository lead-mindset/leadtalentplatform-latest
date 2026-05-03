-- LEAD-017: Allow multiple LEAD identities per user with one active primary.
--
-- Earlier identity work modeled lead_identity as one row per user. The product
-- model now allows a user to hold multiple active identities, while display
-- surfaces should resolve exactly one primary active identity.

BEGIN;

-- Drop the legacy one-identity-per-user uniqueness, regardless of generated name.
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname
  INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'lead_identity'
    AND con.contype = 'u'
    AND (
      SELECT array_agg(att.attname ORDER BY cols.ordinality)
      FROM unnest(con.conkey) WITH ORDINALITY AS cols(attnum, ordinality)
      JOIN pg_attribute att
        ON att.attrelid = rel.oid
       AND att.attnum = cols.attnum
    )::text[] = ARRAY['user_id'];

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.lead_identity DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- Remove duplicate active rows for the exact identity target before adding the index.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, identity_type, COALESCE(chapter_id, '__global__')
      ORDER BY is_primary DESC, issued_at ASC, created_at ASC, id ASC
    ) AS row_number
  FROM public.lead_identity
  WHERE status = 'active'::public.identity_status
)
UPDATE public.lead_identity li
SET
  status = 'revoked'::public.identity_status,
  revoked_at = COALESCE(li.revoked_at, NOW()),
  is_primary = false,
  updated_at = NOW()
FROM ranked
WHERE ranked.id = li.id
  AND ranked.row_number > 1;

-- Normalize any existing multiple primary rows to one deterministic primary per user.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY
        CASE identity_type
          WHEN 'founder'::public.identity_type THEN 1
          WHEN 'staff'::public.identity_type THEN 2
          WHEN 'chapter_editor'::public.identity_type THEN 3
          WHEN 'chapter_member'::public.identity_type THEN 4
          WHEN 'alumni'::public.identity_type THEN 5
          ELSE 99
        END,
        issued_at DESC,
        created_at DESC,
        id ASC
    ) AS row_number
  FROM public.lead_identity
  WHERE status = 'active'::public.identity_status
    AND is_primary = true
)
UPDATE public.lead_identity li
SET
  is_primary = ranked.row_number = 1,
  updated_at = NOW()
FROM ranked
WHERE ranked.id = li.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_identity_one_active_target
  ON public.lead_identity (user_id, identity_type, COALESCE(chapter_id, '__global__'))
  WHERE status = 'active'::public.identity_status;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_identity_one_active_primary
  ON public.lead_identity (user_id)
  WHERE status = 'active'::public.identity_status
    AND is_primary = true;

COMMIT;
