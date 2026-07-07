-- LEAD QA: Fix admin RLS policies for user table
-- The previous policies checked auth.jwt() ->> 'role', but Supabase doesn't automatically
-- add the custom role claim to the JWT. Use the is_admin() function instead.

-- Drop old policies that rely on JWT role claim
DROP POLICY IF EXISTS "user_read_admin" ON "public"."user";
DROP POLICY IF EXISTS "user_update_admin" ON "public"."user";

-- Create new policy for admin SELECT using is_admin() function
CREATE POLICY "user_read_admin" ON "public"."user" 
  FOR SELECT 
  USING (public.is_admin());

-- Create new policy for admin UPDATE using is_admin() function
CREATE POLICY "user_update_admin" ON "public"."user" 
  FOR UPDATE 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());
