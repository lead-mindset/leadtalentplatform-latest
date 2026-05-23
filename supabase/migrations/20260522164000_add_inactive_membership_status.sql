-- LEAD chapter activation: represent revoked active memberships explicitly.

BEGIN;

ALTER TYPE public.membership_status ADD VALUE IF NOT EXISTS 'inactive';

COMMIT;
