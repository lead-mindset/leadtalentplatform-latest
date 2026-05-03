-- LEAD-003: Define RLS and Access Matrix for New Account Model
-- Resolves recursion, admin lockout, and tight recruiter scope.

-- ==============================================================================
-- 1. Helper Functions (SECURITY DEFINER to prevent recursion & infinite loops)
-- ==============================================================================

-- Check if user is admin via JWT (fastest, no DB lookup)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'role'), '') = 'admin';
$$;

-- Check if user is recruiter via JWT
CREATE OR REPLACE FUNCTION public.is_recruiter()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'role'), '') = 'recruiter';
$$;

-- Check if user is chapter editor (Security Definer to bypass RLS recursion on chapter_membership)
CREATE OR REPLACE FUNCTION public.is_chapter_editor(check_chapter_id text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chapter_membership cm
    WHERE cm.user_id = auth.uid()
      AND cm.chapter_id = check_chapter_id
      AND cm.position IN ('president', 'vice_president', 'secretary', 'treasurer', 'editor')
      AND cm.status = 'approved'
  );
$$;

-- ==============================================================================
-- 2. ENABLE RLS
-- ==============================================================================

ALTER TABLE public.person_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_application_question ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_application_answer ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. POLICIES
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table: person_profile
-- ------------------------------------------------------------------------------
-- Admin: ALL
CREATE POLICY "person_profile_admin_all" ON public.person_profile
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- User: SELECT/UPDATE own
CREATE POLICY "person_profile_select_own" ON public.person_profile
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "person_profile_update_own" ON public.person_profile
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Editor: SELECT own (already covered by select_own)
-- Recruiter: SELECT only if user is an active recruiter and student is visible
CREATE POLICY "person_profile_select_recruiter" ON public.person_profile
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    is_recruiter_visible = true
    AND EXISTS (
      SELECT 1 FROM public.recruiter_access ra
      WHERE ra.accepted_by_user_id = auth.uid()
      AND ra.is_active = true
      AND ra.revoked_at IS NULL
    )
  );

-- ------------------------------------------------------------------------------
-- Table: chapter_membership
-- ------------------------------------------------------------------------------
-- Admin: ALL
CREATE POLICY "chapter_membership_admin_all" ON public.chapter_membership
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Editor: SELECT members of their own chapter
CREATE POLICY "chapter_membership_select_editor" ON public.chapter_membership
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_chapter_editor(chapter_id));

-- Editor: UPDATE members of their own chapter
CREATE POLICY "chapter_membership_update_editor" ON public.chapter_membership
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.is_chapter_editor(chapter_id))
  WITH CHECK (public.is_chapter_editor(chapter_id));

-- User: SELECT/INSERT/UPDATE own
CREATE POLICY "chapter_membership_select_own" ON public.chapter_membership
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "chapter_membership_insert_own" ON public.chapter_membership
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "chapter_membership_update_own" ON public.chapter_membership
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- Table: lead_identity
-- ------------------------------------------------------------------------------
-- Admin: ALL
CREATE POLICY "lead_identity_admin_all" ON public.lead_identity
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- User/Editor/Recruiter: SELECT own
CREATE POLICY "lead_identity_select_own" ON public.lead_identity
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (user_id = auth.uid());
-- No insert/update (managed by backend triggers/functions)

-- ------------------------------------------------------------------------------
-- Table: newsletter_subscription
-- ------------------------------------------------------------------------------
-- Admin: ALL
CREATE POLICY "newsletter_subscription_admin_all" ON public.newsletter_subscription
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- User: ALL own
CREATE POLICY "newsletter_subscription_all_own" ON public.newsletter_subscription
  AS PERMISSIVE FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Editor: SELECT subscribers scoped to their chapter
CREATE POLICY "newsletter_subscription_select_editor" ON public.newsletter_subscription
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_chapter_editor(chapter_id));

-- ------------------------------------------------------------------------------
-- Table: event_application_question
-- ------------------------------------------------------------------------------
-- Note: Requires a helper to find the chapter_id for an event.

CREATE OR REPLACE FUNCTION public.get_event_chapter_id(check_event_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT chapter_id FROM public.event WHERE id = check_event_id;
$$;

-- Admin: ALL
CREATE POLICY "event_application_question_admin_all" ON public.event_application_question
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Editor: ALL within chapter
CREATE POLICY "event_application_question_editor_all" ON public.event_application_question
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_chapter_editor(public.get_event_chapter_id(event_id)))
  WITH CHECK (public.is_chapter_editor(public.get_event_chapter_id(event_id)));

-- User: SELECT only
CREATE POLICY "event_application_question_select_all" ON public.event_application_question
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (true); -- Questions are public/visible to applicants

-- ------------------------------------------------------------------------------
-- Table: event_application_answer
-- ------------------------------------------------------------------------------
-- Admin: ALL
CREATE POLICY "event_application_answer_admin_all" ON public.event_application_answer
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Editor: SELECT/UPDATE within chapter
-- Need helper to link answer -> question -> event -> chapter
CREATE OR REPLACE FUNCTION public.get_question_chapter_id(check_question_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT e.chapter_id 
  FROM public.event_application_question q
  JOIN public.event e ON q.event_id = e.id
  WHERE q.id = check_question_id;
$$;

CREATE POLICY "event_application_answer_select_editor" ON public.event_application_answer
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_chapter_editor(public.get_question_chapter_id(question_id)));

CREATE POLICY "event_application_answer_update_editor" ON public.event_application_answer
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.is_chapter_editor(public.get_question_chapter_id(question_id)))
  WITH CHECK (public.is_chapter_editor(public.get_question_chapter_id(question_id)));

-- User: SELECT/INSERT/UPDATE own
CREATE POLICY "event_application_answer_select_own" ON public.event_application_answer
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.event_registration er
    WHERE er.id = registration_id AND er.user_id = auth.uid()
  ));

CREATE POLICY "event_application_answer_insert_own" ON public.event_application_answer
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.event_registration er
    WHERE er.id = registration_id AND er.user_id = auth.uid()
  ));

CREATE POLICY "event_application_answer_update_own" ON public.event_application_answer
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.event_registration er
    WHERE er.id = registration_id AND er.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.event_registration er
    WHERE er.id = registration_id AND er.user_id = auth.uid()
  ));
