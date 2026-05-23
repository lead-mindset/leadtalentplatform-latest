-- Backfill legacy global editors into explicit chapter-scoped role assignments and grants.
-- Legacy editors map to chief_of_staff so they retain applicant/event operations without
-- receiving newer member-revoke or e-board-assignment powers.

WITH legacy_editors AS (
  SELECT
    u.id AS user_id,
    cm.chapter_id,
    cm.approved_by_id
  FROM public."user" u
  JOIN public.chapter_membership cm
    ON cm.user_id = u.id
   AND cm.status = 'approved'
  WHERE u.role = 'editor'
),
inserted_assignments AS (
  INSERT INTO public.chapter_role_assignment (
    user_id,
    chapter_id,
    role_level,
    functional_area,
    display_title,
    raw_title,
    is_primary,
    status,
    assigned_by_id,
    source,
    source_preapproval_id
  )
  SELECT
    le.user_id,
    le.chapter_id,
    'chief_of_staff',
    'strategy_operations',
    'Legacy Chapter Editor',
    'legacy_editor',
    true,
    'active',
    le.approved_by_id,
    'migration',
    NULL::uuid
  FROM legacy_editors le
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.chapter_role_assignment existing
    WHERE existing.user_id = le.user_id
      AND existing.chapter_id = le.chapter_id
      AND existing.status = 'active'
  )
  RETURNING id, user_id, chapter_id
),
legacy_assignments AS (
  SELECT
    ia.id,
    ia.user_id,
    ia.chapter_id
  FROM inserted_assignments ia
  UNION
  SELECT
    cra.id,
    le.user_id,
    le.chapter_id
  FROM legacy_editors le
  JOIN public.chapter_role_assignment cra
    ON cra.user_id = le.user_id
   AND cra.chapter_id = le.chapter_id
   AND cra.status = 'active'
),
permission_keys(permission_key) AS (
  VALUES
    ('chapter.dashboard.access'),
    ('chapter.members.view_approved'),
    ('chapter.members.view_alumni'),
    ('chapter.members.view_member_contact'),
    ('chapter.members.view_applicants'),
    ('chapter.members.view_rejected'),
    ('chapter.members.view_inactive'),
    ('chapter.members.manage_applications'),
    ('chapter.events.manage'),
    ('chapter.events.view_registrations'),
    ('chapter.events.check_in'),
    ('chapter.events.archive')
)
INSERT INTO public.chapter_permission_grant (
  user_id,
  chapter_id,
  permission_key,
  source,
  source_role_assignment_id,
  granted_by_id
)
SELECT DISTINCT
  la.user_id,
  la.chapter_id,
  pk.permission_key,
  'migration',
  la.id,
  NULL::uuid
FROM legacy_assignments la
CROSS JOIN permission_keys pk
WHERE NOT EXISTS (
  SELECT 1
  FROM public.chapter_permission_grant existing
  WHERE existing.user_id = la.user_id
    AND existing.chapter_id = la.chapter_id
    AND existing.permission_key = pk.permission_key
    AND existing.revoked_at IS NULL
);

SELECT 'legacy editor permission backfill complete' AS status;
