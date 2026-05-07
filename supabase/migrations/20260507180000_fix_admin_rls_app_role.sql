-- LEAD QA stabilization: admin RLS must use the canonical app role.
--
-- Supabase JWT role is usually "authenticated"; platform authorization lives in
-- public.user.role. Keep this helper independent from profile tables to avoid
-- admin lockouts while still honoring the canonical account model.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."user" u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
