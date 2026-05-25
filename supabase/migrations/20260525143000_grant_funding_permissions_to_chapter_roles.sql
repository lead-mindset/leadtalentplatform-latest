-- Backfill request-based funding permissions for active chapter e-board roles.
-- Chapter leaders can submit funding requests, while admin/finance retains review power.

WITH role_permission_keys(role_level, permission_key) AS (
  VALUES
    ('president', 'chapter.funding.view'),
    ('president', 'chapter.funding.submit'),
    ('vice_president', 'chapter.funding.view'),
    ('vice_president', 'chapter.funding.submit'),
    ('chief_of_staff', 'chapter.funding.view'),
    ('chief_of_staff', 'chapter.funding.submit'),
    ('director', 'chapter.funding.view'),
    ('director', 'chapter.funding.submit'),
    ('coordinator', 'chapter.funding.view'),
    ('coordinator', 'chapter.funding.submit')
)
INSERT INTO public.chapter_permission_grant (
  user_id,
  chapter_id,
  permission_key,
  source,
  source_role_assignment_id,
  granted_by_id
)
SELECT
  cra.user_id,
  cra.chapter_id,
  rpk.permission_key,
  'migration',
  cra.id,
  NULL::uuid
FROM public.chapter_role_assignment cra
JOIN role_permission_keys rpk
  ON rpk.role_level = cra.role_level
WHERE cra.status = 'active'
  AND cra.role_level <> 'member'
  AND NOT EXISTS (
    SELECT 1
    FROM public.chapter_permission_grant existing
    WHERE existing.user_id = cra.user_id
      AND existing.chapter_id = cra.chapter_id
      AND existing.permission_key = rpk.permission_key
      AND existing.revoked_at IS NULL
  );
