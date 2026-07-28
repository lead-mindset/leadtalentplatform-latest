-- LEAD-XXX: Fix admin RLS function and prevent self-role-escalation
-- 
-- 1. Replaces public.is_admin() with SECURITY DEFINER that queries
--    public.user directly, because Supabase does not inject the
--    custom user.role into the JWT.  The previous version always
--    returned false, breaking all admin RLS policies.
--
-- 2. Adds a column-level trigger that prevents any authenticated
--    user from changing their own role, closing the self-escalation
--    vector while allowing admins (different user) and service-role
--    operations to proceed normally.

-- =============================================================================
-- 1. Fix is_admin() – SECURITY DEFINER, query public.user directly
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public."user"
    WHERE id = auth.uid() AND role = 'admin'::"public"."Role"
  );
$$;

-- =============================================================================
-- 2. Prevent self-role-escalation trigger
--    Fires only when the `role` column is mentioned in UPDATE.
--    Allows:   admin updating other users, service-role operations,
--              user updating own name/phone (role column untouched)
--    Blocks:  user setting their own role
-- =============================================================================
CREATE OR REPLACE FUNCTION public.prevent_self_role_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.uid() = OLD.id THEN
    RAISE EXCEPTION 'You cannot change your own role. Contact an admin.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_self_role_change
  BEFORE UPDATE OF role ON public."user"
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_change();
