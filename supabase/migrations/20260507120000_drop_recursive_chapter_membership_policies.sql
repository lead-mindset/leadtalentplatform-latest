-- Drop legacy chapter_membership policies that query chapter_membership from
-- inside chapter_membership RLS and can trigger infinite recursion.

DROP POLICY IF EXISTS "Editors can manage chapter memberships" ON public.chapter_membership;
DROP POLICY IF EXISTS "Users can read own memberships" ON public.chapter_membership;
DROP POLICY IF EXISTS "Users can insert own membership" ON public.chapter_membership;
DROP POLICY IF EXISTS "Service role full access to memberships" ON public.chapter_membership;
