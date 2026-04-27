-- Migration: Security hardening - drop backup tables, restrict function access, fix RLS

-- ─────────────────────────────────────────────────────────────────
-- 1. Drop unused backup tables (already removed from production, migration for consistency)
-- ─────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.user_backup_20260416_2001;
DROP TABLE IF EXISTS public.studentprofile_backup_20260416_2001;
DROP TABLE IF EXISTS public.resume_storage_backup_20260416_2001;

-- ─────────────────────────────────────────────────────────────────
-- 2. Revoke anon EXECUTE on SECURITY DEFINER functions
--    These should only be callable by authenticated users or service_role
-- ─────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.check_is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_chapter_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_event_editor(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_user_role_to_claims() FROM anon;

-- Note: st_estimatedextent is a PostGIS system function — we leave it as-is

-- ─────────────────────────────────────────────────────────────────
-- 3. Fix function search_path to prevent search_path injection
-- ─────────────────────────────────────────────────────────────────

-- authenticative.is_user_authenticated
ALTER FUNCTION authenticative.is_user_authenticated SET search_path = authenticative, public, pg_temp;

-- public.bulk_approve_applications
ALTER FUNCTION public.bulk_approve_applications SET search_path = public, pg_temp;

-- public.get_my_chapter_id
ALTER FUNCTION public.get_my_chapter_id SET search_path = public, pg_temp;

-- public.check_is_admin
ALTER FUNCTION public.check_is_admin SET search_path = public, pg_temp;

-- public.call_welcome_email_function
ALTER FUNCTION public.call_welcome_email_function SET search_path = public, pg_temp;

-- public.get_auth_uid
ALTER FUNCTION public.get_auth_uid SET search_path = public, pg_temp;

-- public.is_event_editor (both signatures)
ALTER FUNCTION public.is_event_editor(event_uuid uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_event_editor(p_user_id uuid, p_event_id uuid) SET search_path = public, pg_temp;

-- public.current_user_role
ALTER FUNCTION public.current_user_role SET search_path = public, pg_temp;

-- public.handle_new_user
ALTER FUNCTION public.handle_new_user SET search_path = public, pg_temp;

-- public.get_user_role
ALTER FUNCTION public.get_user_role SET search_path = public, pg_temp;

-- ─────────────────────────────────────────────────────────────────
-- 4. Fix permissive RLS policy on user table
--    The user_insert_authenticated policy allowed any authenticated user to INSERT.
--    Replace with a more restrictive policy: only allow inserting their own row
--    based on auth.uid() matching the id column.
-- ─────────────────────────────────────────────────────────────────

-- Drop the overly permissive policy
DROP POLICY IF EXISTS user_insert_authenticated ON public.user;

-- Recreate with proper restriction: users can only insert their own record
CREATE POLICY user_insert_own ON public.user
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);
