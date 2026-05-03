-- Migration: LEAD-008 Newsletter Subscription Foundation
-- Purpose: Enforce one logical global/chapter newsletter preference row per user.
-- Status: Forward-only

BEGIN;

-- Keep the table compatible with future campaign planning by preserving
-- inactive/unsubscribed rows instead of deleting preference history.
DELETE FROM public.newsletter_subscription ns
USING public.newsletter_subscription newer
WHERE ns.id <> newer.id
  AND ns.user_id = newer.user_id
  AND ns.scope = 'global'
  AND newer.scope = 'global'
  AND newer.created_at >= ns.created_at;

DELETE FROM public.newsletter_subscription ns
USING public.newsletter_subscription newer
WHERE ns.id <> newer.id
  AND ns.user_id = newer.user_id
  AND ns.scope = 'chapter'
  AND newer.scope = 'chapter'
  AND ns.chapter_id = newer.chapter_id
  AND newer.created_at >= ns.created_at;

ALTER TABLE public.newsletter_subscription
  DROP CONSTRAINT IF EXISTS newsletter_subscription_scope_chapter_check;

ALTER TABLE public.newsletter_subscription
  ADD CONSTRAINT newsletter_subscription_scope_chapter_check
  CHECK (
    (scope = 'global' AND chapter_id IS NULL)
    OR
    (scope = 'chapter' AND chapter_id IS NOT NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscription_one_global_per_user
  ON public.newsletter_subscription(user_id)
  WHERE scope = 'global';

CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscription_one_chapter_per_user
  ON public.newsletter_subscription(user_id, chapter_id)
  WHERE scope = 'chapter';

CREATE INDEX IF NOT EXISTS idx_newsletter_subscription_active_chapter_campaigns
  ON public.newsletter_subscription(chapter_id, status)
  WHERE scope = 'chapter';

COMMIT;
