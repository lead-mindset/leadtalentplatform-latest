-- LEAD Funding: request-based funding workflow foundation.
--
-- This migration creates the data model, RLS boundaries, and private storage
-- bucket needed for chapter-scoped funding requests. Payments/transfers remain
-- offline in v1.

BEGIN;

CREATE TABLE IF NOT EXISTS public.funding_request (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id text NOT NULL REFERENCES public.chapter(id) ON DELETE CASCADE,
  requester_user_id uuid NOT NULL REFERENCES public."user"(id),
  event_id uuid REFERENCES public.event(id) ON DELETE SET NULL,
  title text NOT NULL,
  purpose text NOT NULL,
  expected_audience text NOT NULL,
  expected_attendee_count integer,
  requested_amount numeric(12,2) NOT NULL,
  approved_amount numeric(12,2),
  actual_spend_amount numeric(12,2),
  currency text NOT NULL DEFAULT 'PEN',
  status text NOT NULL DEFAULT 'draft',
  okr_keys text[] NOT NULL DEFAULT '{}'::text[],
  pillar_keys text[] NOT NULL DEFAULT '{}'::text[],
  partner_name text,
  partner_details text,
  supporting_notes text,
  event_date date NOT NULL,
  is_late_request boolean NOT NULL DEFAULT false,
  submitted_at timestamptz,
  reviewed_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  admin_decision_note text,
  internal_funding_source text,
  internal_funding_source_note text,
  accountability_due_at date,
  accountability_submitted_at timestamptz,
  accountability_note text,
  result_summary text,
  closed_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  closed_at timestamptz,
  closure_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT funding_request_title_not_empty
    CHECK (length(btrim(title)) > 0),
  CONSTRAINT funding_request_purpose_not_empty
    CHECK (length(btrim(purpose)) > 0),
  CONSTRAINT funding_request_expected_audience_not_empty
    CHECK (length(btrim(expected_audience)) > 0),
  CONSTRAINT funding_request_expected_attendee_count_nonnegative
    CHECK (expected_attendee_count IS NULL OR expected_attendee_count >= 0),
  CONSTRAINT funding_request_requested_amount_positive
    CHECK (requested_amount > 0),
  CONSTRAINT funding_request_approved_amount_nonnegative
    CHECK (approved_amount IS NULL OR approved_amount >= 0),
  CONSTRAINT funding_request_actual_spend_amount_nonnegative
    CHECK (actual_spend_amount IS NULL OR actual_spend_amount >= 0),
  CONSTRAINT funding_request_approved_not_above_requested
    CHECK (approved_amount IS NULL OR approved_amount <= requested_amount),
  CONSTRAINT funding_request_currency_check
    CHECK (currency IN ('PEN', 'USD')),
  CONSTRAINT funding_request_status_check
    CHECK (
      status IN (
        'draft',
        'submitted',
        'changes_requested',
        'approved',
        'rejected',
        'receipts_due',
        'closed'
      )
    ),
  CONSTRAINT funding_request_internal_source_check
    CHECK (
      internal_funding_source IS NULL
      OR internal_funding_source IN (
        'lead_peru_chapter_budget',
        'lead_wide_event_budget',
        'sponsor_partner',
        'hola_benevity',
        'other'
      )
    ),
  CONSTRAINT funding_request_okr_keys_valid
    CHECK (
      okr_keys <@ ARRAY[
        'inspire',
        'unite',
        'empower',
        'elevate'
      ]::text[]
    ),
  CONSTRAINT funding_request_pillar_keys_valid
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
  CONSTRAINT funding_request_requires_okr
    CHECK (array_length(okr_keys, 1) IS NOT NULL),
  CONSTRAINT funding_request_requires_pillar
    CHECK (array_length(pillar_keys, 1) IS NOT NULL),
  CONSTRAINT funding_request_review_consistency
    CHECK (
      (
        reviewed_by_id IS NULL
        AND reviewed_at IS NULL
      )
      OR
      (
        reviewed_by_id IS NOT NULL
        AND reviewed_at IS NOT NULL
      )
    ),
  CONSTRAINT funding_request_closure_consistency
    CHECK (
      (
        closed_by_id IS NULL
        AND closed_at IS NULL
      )
      OR
      (
        closed_by_id IS NOT NULL
        AND closed_at IS NOT NULL
      )
    )
);

COMMENT ON TABLE public.funding_request IS
  'Chapter-scoped LEAD Funding requests for event or initiative support. Payments stay offline.';

COMMENT ON COLUMN public.funding_request.internal_funding_source IS
  'Admin-only tag for internal source assignment. Chapters do not choose this in v1.';

COMMENT ON COLUMN public.funding_request.is_late_request IS
  'True when the request is submitted less than 14 days before the event or initiative date.';

CREATE INDEX IF NOT EXISTS idx_funding_request_chapter_status_date
  ON public.funding_request(chapter_id, status, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_funding_request_requester
  ON public.funding_request(requester_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_funding_request_reviewer
  ON public.funding_request(reviewed_by_id, reviewed_at DESC)
  WHERE reviewed_by_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_funding_request_event
  ON public.funding_request(event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_funding_request_okr_keys
  ON public.funding_request USING gin(okr_keys);

CREATE INDEX IF NOT EXISTS idx_funding_request_pillar_keys
  ON public.funding_request USING gin(pillar_keys);

CREATE TABLE IF NOT EXISTS public.funding_request_budget_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_request_id uuid NOT NULL REFERENCES public.funding_request(id) ON DELETE CASCADE,
  label text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  amount numeric(12,2) NOT NULL,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT funding_request_budget_item_label_not_empty
    CHECK (length(btrim(label)) > 0),
  CONSTRAINT funding_request_budget_item_amount_positive
    CHECK (amount > 0),
  CONSTRAINT funding_request_budget_item_category_check
    CHECK (
      category IN (
        'food_refreshments',
        'event_materials',
        'minimal_decorations',
        'learning_materials',
        'recognition_items',
        'software_platforms',
        'speaker_support',
        'transportation_exception',
        'other'
      )
    )
);

COMMENT ON TABLE public.funding_request_budget_item IS
  'Itemized budget rows for a LEAD Funding request.';

CREATE INDEX IF NOT EXISTS idx_funding_request_budget_item_request
  ON public.funding_request_budget_item(funding_request_id, sort_order);

CREATE TABLE IF NOT EXISTS public.funding_request_file (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_request_id uuid NOT NULL REFERENCES public.funding_request(id) ON DELETE CASCADE,
  chapter_id text NOT NULL REFERENCES public.chapter(id) ON DELETE CASCADE,
  uploaded_by_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  file_type text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'funding-files',
  storage_path text,
  external_url text,
  original_name text,
  mime_type text,
  file_size_bytes integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT funding_request_file_type_check
    CHECK (file_type IN ('supporting_material', 'receipt', 'evidence')),
  CONSTRAINT funding_request_file_bucket_check
    CHECK (storage_bucket = 'funding-files'),
  CONSTRAINT funding_request_file_location_check
    CHECK (
      storage_path IS NOT NULL
      OR external_url IS NOT NULL
    ),
  CONSTRAINT funding_request_file_size_nonnegative
    CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0)
);

COMMENT ON TABLE public.funding_request_file IS
  'Private file or link metadata for LEAD Funding supporting materials, receipts, and evidence.';

CREATE INDEX IF NOT EXISTS idx_funding_request_file_request_type
  ON public.funding_request_file(funding_request_id, file_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_funding_request_file_chapter
  ON public.funding_request_file(chapter_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_funding_request_file_storage_path_unique
  ON public.funding_request_file(storage_bucket, storage_path)
  WHERE storage_path IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.funding_request_status_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_request_id uuid NOT NULL REFERENCES public.funding_request(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES public."user"(id) ON DELETE SET NULL,
  from_status text,
  to_status text NOT NULL,
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT funding_request_status_event_from_status_check
    CHECK (
      from_status IS NULL
      OR from_status IN (
        'draft',
        'submitted',
        'changes_requested',
        'approved',
        'rejected',
        'receipts_due',
        'closed'
      )
    ),
  CONSTRAINT funding_request_status_event_to_status_check
    CHECK (
      to_status IN (
        'draft',
        'submitted',
        'changes_requested',
        'approved',
        'rejected',
        'receipts_due',
        'closed'
      )
    ),
  CONSTRAINT funding_request_status_event_metadata_object
    CHECK (jsonb_typeof(metadata) = 'object')
);

COMMENT ON TABLE public.funding_request_status_event IS
  'Status timeline for LEAD Funding request decisions and accountability events.';

CREATE INDEX IF NOT EXISTS idx_funding_request_status_event_request_created
  ON public.funding_request_status_event(funding_request_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.can_access_funding_request(
  check_request_id uuid,
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
      FROM public.funding_request fr
      WHERE fr.id = check_request_id
        AND public.has_chapter_permission(fr.chapter_id, check_permission_key)
    );
$$;

COMMENT ON FUNCTION public.can_access_funding_request(uuid, text) IS
  'Returns true for admins or chapter operators with the requested funding permission for the request chapter.';

CREATE OR REPLACE FUNCTION public.can_access_funding_file_object(
  object_name text,
  check_permission_key text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'storage', 'pg_temp'
AS $$
DECLARE
  request_id uuid;
BEGIN
  IF object_name IS NULL OR array_length(storage.foldername(object_name), 1) < 1 THEN
    RETURN false;
  END IF;

  BEGIN
    request_id := (storage.foldername(object_name))[1]::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN false;
  END;

  RETURN public.can_access_funding_request(request_id, check_permission_key);
END;
$$;

COMMENT ON FUNCTION public.can_access_funding_file_object(text, text) IS
  'Checks funding-files objects whose first path segment is the funding request id.';

ALTER TABLE public.funding_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_request_budget_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_request_file ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_request_status_event ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "funding_request_admin_all" ON public.funding_request;
CREATE POLICY "funding_request_admin_all" ON public.funding_request
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "funding_request_chapter_select" ON public.funding_request;
CREATE POLICY "funding_request_chapter_select" ON public.funding_request
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_chapter_permission(chapter_id, 'chapter.funding.view'));

DROP POLICY IF EXISTS "funding_request_chapter_insert" ON public.funding_request;
CREATE POLICY "funding_request_chapter_insert" ON public.funding_request
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    requester_user_id = auth.uid()
    AND public.has_chapter_permission(chapter_id, 'chapter.funding.submit')
  );

DROP POLICY IF EXISTS "funding_request_chapter_update" ON public.funding_request;
CREATE POLICY "funding_request_chapter_update" ON public.funding_request
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.has_chapter_permission(chapter_id, 'chapter.funding.submit'))
  WITH CHECK (public.has_chapter_permission(chapter_id, 'chapter.funding.submit'));

DROP POLICY IF EXISTS "funding_budget_item_admin_all" ON public.funding_request_budget_item;
CREATE POLICY "funding_budget_item_admin_all" ON public.funding_request_budget_item
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "funding_budget_item_chapter_select" ON public.funding_request_budget_item;
CREATE POLICY "funding_budget_item_chapter_select" ON public.funding_request_budget_item
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.can_access_funding_request(funding_request_id, 'chapter.funding.view'));

DROP POLICY IF EXISTS "funding_budget_item_chapter_insert" ON public.funding_request_budget_item;
CREATE POLICY "funding_budget_item_chapter_insert" ON public.funding_request_budget_item
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'));

DROP POLICY IF EXISTS "funding_budget_item_chapter_update" ON public.funding_request_budget_item;
CREATE POLICY "funding_budget_item_chapter_update" ON public.funding_request_budget_item
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'))
  WITH CHECK (public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'));

DROP POLICY IF EXISTS "funding_budget_item_chapter_delete" ON public.funding_request_budget_item;
CREATE POLICY "funding_budget_item_chapter_delete" ON public.funding_request_budget_item
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'));

DROP POLICY IF EXISTS "funding_file_admin_all" ON public.funding_request_file;
CREATE POLICY "funding_file_admin_all" ON public.funding_request_file
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "funding_file_chapter_select" ON public.funding_request_file;
CREATE POLICY "funding_file_chapter_select" ON public.funding_request_file
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.can_access_funding_request(funding_request_id, 'chapter.funding.view')
    AND EXISTS (
      SELECT 1
      FROM public.funding_request fr
      WHERE fr.id = funding_request_id
        AND fr.chapter_id = funding_request_file.chapter_id
    )
  );

DROP POLICY IF EXISTS "funding_file_chapter_insert" ON public.funding_request_file;
CREATE POLICY "funding_file_chapter_insert" ON public.funding_request_file
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by_id = auth.uid()
    AND public.can_access_funding_request(funding_request_id, 'chapter.funding.submit')
    AND EXISTS (
      SELECT 1
      FROM public.funding_request fr
      WHERE fr.id = funding_request_id
        AND fr.chapter_id = funding_request_file.chapter_id
    )
  );

DROP POLICY IF EXISTS "funding_file_chapter_update" ON public.funding_request_file;
CREATE POLICY "funding_file_chapter_update" ON public.funding_request_file
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'))
  WITH CHECK (
    public.can_access_funding_request(funding_request_id, 'chapter.funding.submit')
    AND EXISTS (
      SELECT 1
      FROM public.funding_request fr
      WHERE fr.id = funding_request_id
        AND fr.chapter_id = funding_request_file.chapter_id
    )
  );

DROP POLICY IF EXISTS "funding_file_chapter_delete" ON public.funding_request_file;
CREATE POLICY "funding_file_chapter_delete" ON public.funding_request_file
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'));

DROP POLICY IF EXISTS "funding_status_event_admin_all" ON public.funding_request_status_event;
CREATE POLICY "funding_status_event_admin_all" ON public.funding_request_status_event
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "funding_status_event_chapter_select" ON public.funding_request_status_event;
CREATE POLICY "funding_status_event_chapter_select" ON public.funding_request_status_event
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.can_access_funding_request(funding_request_id, 'chapter.funding.view'));

DROP POLICY IF EXISTS "funding_status_event_chapter_insert" ON public.funding_request_status_event;
CREATE POLICY "funding_status_event_chapter_insert" ON public.funding_request_status_event
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    actor_user_id = auth.uid()
    AND public.can_access_funding_request(funding_request_id, 'chapter.funding.submit')
  );

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'funding-files',
  'funding-files',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = now();

DROP POLICY IF EXISTS "Funding files read by request access" ON storage.objects;
CREATE POLICY "Funding files read by request access"
  ON storage.objects
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'funding-files'
    AND public.can_access_funding_file_object(name, 'chapter.funding.view')
  );

DROP POLICY IF EXISTS "Funding files upload by request submitters" ON storage.objects;
CREATE POLICY "Funding files upload by request submitters"
  ON storage.objects
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'funding-files'
    AND public.can_access_funding_file_object(name, 'chapter.funding.submit')
  );

DROP POLICY IF EXISTS "Funding files update by request submitters" ON storage.objects;
CREATE POLICY "Funding files update by request submitters"
  ON storage.objects
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'funding-files'
    AND public.can_access_funding_file_object(name, 'chapter.funding.submit')
  )
  WITH CHECK (
    bucket_id = 'funding-files'
    AND public.can_access_funding_file_object(name, 'chapter.funding.submit')
  );

DROP POLICY IF EXISTS "Funding files delete by request submitters" ON storage.objects;
CREATE POLICY "Funding files delete by request submitters"
  ON storage.objects
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'funding-files'
    AND public.can_access_funding_file_object(name, 'chapter.funding.submit')
  );

REVOKE ALL ON TABLE public.funding_request FROM anon;
REVOKE ALL ON TABLE public.funding_request_budget_item FROM anon;
REVOKE ALL ON TABLE public.funding_request_file FROM anon;
REVOKE ALL ON TABLE public.funding_request_status_event FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.funding_request TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.funding_request_budget_item TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.funding_request_file TO authenticated;
GRANT SELECT, INSERT ON TABLE public.funding_request_status_event TO authenticated;

GRANT ALL ON TABLE public.funding_request TO service_role;
GRANT ALL ON TABLE public.funding_request_budget_item TO service_role;
GRANT ALL ON TABLE public.funding_request_file TO service_role;
GRANT ALL ON TABLE public.funding_request_status_event TO service_role;

GRANT EXECUTE ON FUNCTION public.can_access_funding_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_funding_request(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_access_funding_file_object(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_funding_file_object(text, text) TO service_role;

COMMIT;

SELECT 'lead funding foundation created' AS status
WHERE EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'funding_request'
)
AND EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'funding_request_budget_item'
)
AND EXISTS (
  SELECT 1
  FROM storage.buckets
  WHERE id = 'funding-files'
);
