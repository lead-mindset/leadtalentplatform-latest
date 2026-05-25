-- LEAD chapter activation: allow scoped e-board role assignment operations.

BEGIN;

DROP POLICY IF EXISTS "chapter_role_assignment_select_chapter_operators" ON public.chapter_role_assignment;
CREATE POLICY "chapter_role_assignment_select_chapter_operators" ON public.chapter_role_assignment
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.has_chapter_permission(chapter_id, 'chapter.members.view_approved')
    OR public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard')
  );

DROP POLICY IF EXISTS "chapter_role_assignment_insert_regular_eboard" ON public.chapter_role_assignment;
CREATE POLICY "chapter_role_assignment_insert_regular_eboard" ON public.chapter_role_assignment
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    assigned_by_id = auth.uid()
    AND source = 'manual'
    AND status = 'active'
    AND role_level IN ('chief_of_staff', 'director', 'coordinator')
    AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard')
  );

DROP POLICY IF EXISTS "chapter_role_assignment_update_regular_eboard" ON public.chapter_role_assignment;
CREATE POLICY "chapter_role_assignment_update_regular_eboard" ON public.chapter_role_assignment
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    role_level IN ('chief_of_staff', 'director', 'coordinator')
    AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard')
  )
  WITH CHECK (
    role_level IN ('chief_of_staff', 'director', 'coordinator')
    AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard')
  );

DROP POLICY IF EXISTS "chapter_permission_grant_select_role_assigner" ON public.chapter_permission_grant;
CREATE POLICY "chapter_permission_grant_select_role_assigner" ON public.chapter_permission_grant
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard'));

DROP POLICY IF EXISTS "chapter_permission_grant_insert_role_template_assigner" ON public.chapter_permission_grant;
CREATE POLICY "chapter_permission_grant_insert_role_template_assigner" ON public.chapter_permission_grant
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    source = 'role_template'
    AND granted_by_id = auth.uid()
    AND revoked_at IS NULL
    AND revoked_by_id IS NULL
    AND revoke_reason IS NULL
    AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard')
    AND EXISTS (
      SELECT 1
      FROM public.chapter_role_assignment cra
      WHERE cra.id = source_role_assignment_id
        AND cra.user_id = chapter_permission_grant.user_id
        AND cra.chapter_id = chapter_permission_grant.chapter_id
        AND cra.assigned_by_id = auth.uid()
        AND cra.status = 'active'
        AND cra.role_level IN ('chief_of_staff', 'director', 'coordinator')
    )
  );

DROP POLICY IF EXISTS "chapter_permission_grant_update_role_template_assigner" ON public.chapter_permission_grant;
CREATE POLICY "chapter_permission_grant_update_role_template_assigner" ON public.chapter_permission_grant
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    source = 'role_template'
    AND revoked_at IS NULL
    AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard')
    AND EXISTS (
      SELECT 1
      FROM public.chapter_role_assignment cra
      WHERE cra.id = source_role_assignment_id
        AND cra.user_id = chapter_permission_grant.user_id
        AND cra.chapter_id = chapter_permission_grant.chapter_id
        AND cra.role_level IN ('chief_of_staff', 'director', 'coordinator')
    )
  )
  WITH CHECK (
    source = 'role_template'
    AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard')
    AND EXISTS (
      SELECT 1
      FROM public.chapter_role_assignment cra
      WHERE cra.id = source_role_assignment_id
        AND cra.user_id = chapter_permission_grant.user_id
        AND cra.chapter_id = chapter_permission_grant.chapter_id
        AND cra.role_level IN ('chief_of_staff', 'director', 'coordinator')
    )
  );

DROP POLICY IF EXISTS "chapter_audit_log_insert_role_assignment" ON public.chapter_audit_log;
CREATE POLICY "chapter_audit_log_insert_role_assignment" ON public.chapter_audit_log
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    actor_user_id = auth.uid()
    AND action IN ('chapter.role.assigned', 'chapter.role.deactivated')
    AND entity_type = 'chapter_role_assignment'
    AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard')
  );

COMMIT;
