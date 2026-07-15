--
-- PostgreSQL database dump
--

\restrict YxJigqzXOOJqeiOdo5Z2z8prb0Igp8ar5cAy2ih3uAXF4cLFi0W9HVZGKwnW3mi

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'PostGIS extension is now active';


--
-- Name: EventType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EventType" AS ENUM (
    'in_person',
    'online',
    'hybrid'
);


--
-- Name: OKRCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OKRCategory" AS ENUM (
    'inspire',
    'unite',
    'empower',
    'elevate'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'member',
    'editor',
    'admin',
    'recruiter'
);


--
-- Name: approval_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.approval_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: identity_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.identity_status AS ENUM (
    'active',
    'revoked'
);


--
-- Name: identity_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.identity_type AS ENUM (
    'founder',
    'staff',
    'chapter_editor',
    'chapter_member',
    'alumni'
);


--
-- Name: membership_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.membership_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'inactive',
    'alumni'
);


--
-- Name: newsletter_scope; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.newsletter_scope AS ENUM (
    'global',
    'chapter'
);


--
-- Name: newsletter_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.newsletter_status AS ENUM (
    'active',
    'inactive',
    'unsubscribed'
);


--
-- Name: question_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.question_type AS ENUM (
    'short_text',
    'long_text',
    'single_select',
    'checkbox',
    'url'
);


--
-- Name: subscription_source; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscription_source AS ENUM (
    'onboarding',
    'event_registration',
    'manual'
);


--
-- Name: bulk_approve_applications(uuid, uuid[], uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bulk_approve_applications(p_event_id uuid, p_application_ids uuid[], p_approved_by uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_current_count integer;
  v_capacity integer;
  v_updated_count integer;
  v_capacity_warning boolean := false;
  v_capacity_status text := 'ok';
BEGIN
  SELECT COUNT(*) INTO v_current_count
  FROM public.event_registration
  WHERE event_id = p_event_id
    AND status = 'registered';

  SELECT capacity INTO v_capacity
  FROM public.event
  WHERE id = p_event_id;

  IF v_capacity IS NOT NULL
    AND (v_current_count + COALESCE(array_length(p_application_ids, 1), 0)) >= v_capacity THEN
    v_capacity_warning := true;
    v_capacity_status :=
      CASE
        WHEN (v_current_count + COALESCE(array_length(p_application_ids, 1), 0)) > v_capacity
          THEN 'over_capacity'
        ELSE 'at_capacity'
      END;
  END IF;

  UPDATE public.event_registration
  SET
    status = 'registered',
    qr_token = COALESCE(qr_token, gen_random_uuid())
  WHERE id = ANY(p_application_ids)
    AND event_id = p_event_id
    AND status = 'pending_review';

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'capacity_warning', v_capacity_warning,
    'capacity_status', v_capacity_status,
    'updated_count', v_updated_count,
    'approved_by', p_approved_by
  );
END;
$$;


--
-- Name: call_welcome_email_function(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.call_welcome_email_function() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  service_role_key text;
BEGIN
  service_role_key := current_setting('app.service_role_key', true);

  IF service_role_key IS NULL OR service_role_key = '' THEN
    RETURN NEW;
  END IF;

  PERFORM extensions.http_post(
    'https://sboibxszratyaswwursb.supabase.co/functions/v1/welcome-email',
    json_build_object(
      'userId', NEW.id,
      'email', NEW.email,
      'name', COALESCE(NEW.name, 'there')
    ),
    headers := json_build_object('Authorization', 'Bearer ' || service_role_key)
  );

  RETURN NEW;
END;
$$;


--
-- Name: can_access_event_with_permission(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_event_with_permission(check_event_id uuid, check_permission_key text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.event e
      JOIN public.chapter_membership cm
        ON cm.user_id = auth.uid()
       AND cm.status = 'approved'
       AND (
         e.chapter_id = cm.chapter_id
         OR EXISTS (
           SELECT 1
           FROM public.event_chapter ec
           WHERE ec.event_id = e.id
             AND ec.chapter_id = cm.chapter_id
         )
       )
      WHERE e.id = check_event_id
        AND public.has_chapter_permission(cm.chapter_id, check_permission_key)
    );
$$;


--
-- Name: FUNCTION can_access_event_with_permission(check_event_id uuid, check_permission_key text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.can_access_event_with_permission(check_event_id uuid, check_permission_key text) IS 'Returns true for admins or approved chapter members whose chapter owns/collaborates on the event and has the requested active grant.';


--
-- Name: can_access_funding_file_object(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_funding_file_object(object_name text, check_permission_key text) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'storage', 'pg_temp'
    AS $$
DECLARE
  request_id uuid;
BEGIN
  IF object_name IS NULL OR array_length(storage.foldername(object_name), 1) < 1 THEN
    RETURN false;
  END IF;

  BEGIN
    request_id := (storage.foldername(object_name))[1]::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN false;
  END;

  RETURN public.can_access_funding_request(request_id, check_permission_key);
END;
$$;


--
-- Name: FUNCTION can_access_funding_file_object(object_name text, check_permission_key text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.can_access_funding_file_object(object_name text, check_permission_key text) IS 'Checks funding-files objects whose first path segment is the funding request id.';


--
-- Name: can_access_funding_request(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_funding_request(check_request_id uuid, check_permission_key text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.funding_request fr
      WHERE fr.id = check_request_id
        AND public.has_chapter_permission(fr.chapter_id, check_permission_key)
    );
$$;


--
-- Name: FUNCTION can_access_funding_request(check_request_id uuid, check_permission_key text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.can_access_funding_request(check_request_id uuid, check_permission_key text) IS 'Returns true for admins or chapter operators with the requested funding permission for the request chapter.';


--
-- Name: can_access_resume_object(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_resume_object(object_name text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT
    public.is_admin()
    OR (auth.uid() IS NOT NULL AND (storage.foldername(object_name))[1] = auth.uid()::text)
    OR EXISTS (
      SELECT 1
      FROM public.resume r
      JOIN public.person_profile pp
        ON pp.user_id = r.student_id
       AND pp.is_recruiter_visible = true
      JOIN public.chapter_membership cm
        ON cm.user_id = r.student_id
       AND cm.status = 'approved'
      JOIN public.recruiter_access ra
        ON ra.accepted_by_user_id = auth.uid()
       AND ra.is_active = true
       AND ra.revoked_at IS NULL
      WHERE r.file_url LIKE ('%/storage/v1/object/public/resumes/' || object_name)
    );
$$;


--
-- Name: FUNCTION can_access_resume_object(object_name text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.can_access_resume_object(object_name text) IS 'Allows resume object reads for the owner, admins, or active recruiters when the resume belongs to visible approved talent.';


--
-- Name: can_upload_event_cover(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_upload_event_cover() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.chapter_membership cm
      WHERE cm.user_id = auth.uid()
        AND cm.status = 'approved'
        AND public.has_chapter_permission(cm.chapter_id, 'chapter.events.manage')
    );
$$;


--
-- Name: FUNCTION can_upload_event_cover(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.can_upload_event_cover() IS 'Returns true when the signed-in user can manage events for at least one approved chapter.';


--
-- Name: check_is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_is_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public."user" u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  );
END;
$$;


--
-- Name: current_user_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_user_role() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT u.role::text
  FROM public."user" u
  WHERE u.id = auth.uid();
$$;


--
-- Name: get_auth_uid(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_auth_uid() RETURNS uuid
    LANGUAGE sql
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT auth.uid();
$$;


--
-- Name: get_event_chapter_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_event_chapter_id(check_event_id uuid) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  SELECT chapter_id FROM public.event WHERE id = check_event_id;
$$;


--
-- Name: get_my_chapter_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_chapter_id() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  chapter_id text;
BEGIN
  SELECT cm.chapter_id INTO chapter_id
  FROM public.chapter_membership cm
  WHERE cm.user_id = auth.uid()
    AND cm.status = 'approved'
    AND public.has_chapter_permission(cm.chapter_id, 'chapter.dashboard.access')
  LIMIT 1;

  RETURN chapter_id;
END;
$$;


--
-- Name: get_question_chapter_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_question_chapter_id(check_question_id uuid) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  SELECT e.chapter_id 
  FROM public.event_application_question q
  JOIN public.event e ON q.event_id = e.id
  WHERE q.id = check_question_id;
$$;


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(user_id uuid) RETURNS text
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT COALESCE(
    (
      SELECT u.role::text
      FROM public."user" u
      WHERE u.id = user_id
    ),
    'member'
  );
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  INSERT INTO public."user" (
    id,
    email,
    name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    'member',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    updated_at = now();

  RETURN NEW;
END;
$$;


--
-- Name: has_chapter_permission(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_chapter_permission(check_chapter_id text, check_permission_key text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.chapter_permission_grant cpg
      JOIN public.chapter_membership cm
        ON cm.user_id = cpg.user_id
       AND cm.chapter_id = cpg.chapter_id
       AND cm.status = 'approved'
      JOIN public."user" u
        ON u.id = cpg.user_id
      WHERE cpg.user_id = auth.uid()
        AND cpg.chapter_id = check_chapter_id
        AND cpg.permission_key = check_permission_key
        AND cpg.revoked_at IS NULL
        AND u.role <> 'recruiter'
    );
$$;


--
-- Name: FUNCTION has_chapter_permission(check_chapter_id text, check_permission_key text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.has_chapter_permission(check_chapter_id text, check_permission_key text) IS 'Returns true for admins or approved non-recruiter chapter members with an active unrevoked permission grant.';


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."user" u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  );
$$;


--
-- Name: is_chapter_editor(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_chapter_editor(check_chapter_id text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chapter_membership cm
    WHERE cm.user_id = auth.uid()
      AND cm.chapter_id = check_chapter_id
      AND cm.position IN ('president', 'vice_president', 'secretary', 'treasurer', 'editor')
      AND cm.status = 'approved'
  );
$$;


--
-- Name: is_event_editor(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_event_editor(event_uuid uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT public.can_access_event_with_permission(event_uuid, 'chapter.events.manage');
$$;


--
-- Name: is_event_editor(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_event_editor(p_user_id uuid, p_event_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM "User" u
    WHERE u.id = p_user_id
    AND u.role = 'editor'
    AND (
      -- editor's chapter owns the event
      get_editor_chapter_id(u.id) = (
        SELECT "chapterId" FROM "Event" WHERE id = p_event_id
      )
      OR
      -- editor's chapter is a collaborator
      get_editor_chapter_id(u.id) IN (
        SELECT "chapterId" FROM "EventChapter" WHERE "eventId" = p_event_id
      )
    )
  );
$$;


--
-- Name: is_recruiter(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_recruiter() RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  SELECT coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'role'), '') = 'recruiter';
$$;


--
-- Name: sync_user_role_to_claims(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_user_role_to_claims() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- This will be used by a Supabase Edge Function or trigger
  -- For now, we'll use a different approach
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: chapter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chapter (
    id text NOT NULL,
    name text NOT NULL,
    university text NOT NULL,
    city text,
    region text,
    created_at date,
    updated_at timestamp(3) without time zone NOT NULL,
    instagram_url text,
    latitude numeric,
    longitude numeric,
    location_point public.geometry(Point,4326)
);


--
-- Name: COLUMN chapter.instagram_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chapter.instagram_url IS 'Full Instagram profile URL for the chapter';


--
-- Name: COLUMN chapter.latitude; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chapter.latitude IS 'Chapter location latitude (from university coordinates)';


--
-- Name: COLUMN chapter.longitude; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chapter.longitude IS 'Chapter location longitude (from university coordinates)';


--
-- Name: COLUMN chapter.location_point; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chapter.location_point IS 'PostGIS geometry point for spatial queries';


--
-- Name: chapter_activation_interest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chapter_activation_interest (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    university_name text NOT NULL,
    motivation text NOT NULL,
    university_context text NOT NULL,
    lead_value text NOT NULL,
    team_status text NOT NULL,
    interested_people_context text NOT NULL,
    opportunities text NOT NULL,
    long_term_commitment text NOT NULL,
    status text DEFAULT 'submitted'::text NOT NULL,
    review_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chapter_activation_interest_required_text_check CHECK (((length(btrim(university_name)) > 0) AND (length(btrim(motivation)) > 0) AND (length(btrim(university_context)) > 0) AND (length(btrim(lead_value)) > 0) AND (length(btrim(team_status)) > 0) AND (length(btrim(interested_people_context)) > 0) AND (length(btrim(opportunities)) > 0) AND (length(btrim(long_term_commitment)) > 0))),
    CONSTRAINT chapter_activation_interest_status_check CHECK ((status = ANY (ARRAY['submitted'::text, 'orientation_needed'::text, 'ready_for_activation'::text, 'closed'::text])))
);


--
-- Name: chapter_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chapter_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    action text NOT NULL,
    actor_user_id uuid,
    target_user_id uuid,
    chapter_id text,
    entity_type text NOT NULL,
    entity_id text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chapter_audit_log_action_not_empty CHECK ((length(btrim(action)) > 0)),
    CONSTRAINT chapter_audit_log_entity_type_not_empty CHECK ((length(btrim(entity_type)) > 0)),
    CONSTRAINT chapter_audit_log_metadata_object CHECK ((jsonb_typeof(metadata) = 'object'::text))
);


--
-- Name: TABLE chapter_audit_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chapter_audit_log IS 'Audit history for sensitive chapter preapproval, role, permission, membership, and event operations.';


--
-- Name: COLUMN chapter_audit_log.metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chapter_audit_log.metadata IS 'Structured operation context. Must be a JSON object.';


--
-- Name: chapter_invite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chapter_invite (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chapter_id text NOT NULL,
    email text NOT NULL,
    normalized_email text NOT NULL,
    token_hash text NOT NULL,
    invite_type text NOT NULL,
    role_level text NOT NULL,
    functional_area text NOT NULL,
    display_title text NOT NULL,
    raw_title text,
    status text DEFAULT 'pending'::text NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '30 days'::interval) NOT NULL,
    accepted_at timestamp with time zone,
    accepted_by_user_id uuid,
    revoked_at timestamp with time zone,
    revoked_by_user_id uuid,
    created_by_user_id uuid,
    created_by_role text NOT NULL,
    replaced_by_invite_id uuid,
    source text DEFAULT 'chapter_invite'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chapter_invite_accepted_requires_user CHECK ((((accepted_at IS NULL) AND (accepted_by_user_id IS NULL)) OR ((accepted_at IS NOT NULL) AND (accepted_by_user_id IS NOT NULL)))),
    CONSTRAINT chapter_invite_created_by_role_check CHECK ((created_by_role = ANY (ARRAY['admin'::text, 'chapter_leader'::text, 'system'::text]))),
    CONSTRAINT chapter_invite_display_title_not_empty CHECK ((length(btrim(display_title)) > 0)),
    CONSTRAINT chapter_invite_email_not_empty CHECK ((length(btrim(email)) > 0)),
    CONSTRAINT chapter_invite_expires_after_created CHECK ((expires_at > created_at)),
    CONSTRAINT chapter_invite_functional_area_check CHECK ((functional_area = ANY (ARRAY['general_leadership'::text, 'strategy_operations'::text, 'marketing_communications'::text, 'events_experience'::text, 'finance_legal'::text, 'chapter_development'::text, 'academic_excellence'::text, 'professional_development'::text, 'leadership'::text, 'women_in_stem'::text, 'research'::text, 'projects'::text, 'partnerships_external_relations'::text, 'people_talent'::text, 'other'::text]))),
    CONSTRAINT chapter_invite_normalized_email_matches_email CHECK ((normalized_email = lower(btrim(email)))),
    CONSTRAINT chapter_invite_normalized_email_not_empty CHECK ((length(btrim(normalized_email)) > 0)),
    CONSTRAINT chapter_invite_revoked_requires_user CHECK ((((revoked_at IS NULL) AND (revoked_by_user_id IS NULL)) OR ((revoked_at IS NOT NULL) AND (revoked_by_user_id IS NOT NULL)))),
    CONSTRAINT chapter_invite_role_level_check CHECK ((role_level = ANY (ARRAY['president'::text, 'vice_president'::text, 'chief_of_staff'::text, 'director'::text, 'coordinator'::text, 'member'::text]))),
    CONSTRAINT chapter_invite_source_not_empty CHECK ((length(btrim(source)) > 0)),
    CONSTRAINT chapter_invite_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'revoked'::text]))),
    CONSTRAINT chapter_invite_status_lifecycle CHECK ((((status = 'pending'::text) AND (accepted_at IS NULL) AND (revoked_at IS NULL)) OR ((status = 'accepted'::text) AND (accepted_at IS NOT NULL) AND (revoked_at IS NULL)) OR ((status = 'revoked'::text) AND (revoked_at IS NOT NULL) AND (accepted_at IS NULL)))),
    CONSTRAINT chapter_invite_token_hash_not_empty CHECK ((length(btrim(token_hash)) > 0)),
    CONSTRAINT chapter_invite_type_check CHECK ((invite_type = ANY (ARRAY['member'::text, 'regular_eboard'::text, 'protected_leader'::text]))),
    CONSTRAINT chapter_invite_type_role_alignment CHECK ((((invite_type = 'member'::text) AND (role_level = 'member'::text)) OR ((invite_type = 'regular_eboard'::text) AND (role_level = ANY (ARRAY['chief_of_staff'::text, 'director'::text, 'coordinator'::text]))) OR ((invite_type = 'protected_leader'::text) AND (role_level = ANY (ARRAY['president'::text, 'vice_president'::text])))))
);


--
-- Name: TABLE chapter_invite; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chapter_invite IS 'Explicit email-bound chapter invitations for member, e-board, and protected leadership activation.';


--
-- Name: COLUMN chapter_invite.token_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chapter_invite.token_hash IS 'SHA-256 hash of the invite token. Raw tokens are sent by email and never stored.';


--
-- Name: chapter_membership; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chapter_membership (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    chapter_id text NOT NULL,
    status public.membership_status DEFAULT 'pending'::public.membership_status NOT NULL,
    "position" text,
    approved_by_id uuid,
    member_id text,
    joined_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chapter_membership_position_check CHECK ((("position" IS NULL) OR ("position" = ANY (ARRAY['member'::text, 'president'::text, 'vice_president'::text, 'secretary'::text, 'treasurer'::text, 'events_lead'::text, 'marketing_lead'::text, 'editor'::text]))))
);


--
-- Name: chapter_permission_grant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chapter_permission_grant (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    chapter_id text NOT NULL,
    permission_key text NOT NULL,
    source text NOT NULL,
    source_role_assignment_id uuid,
    granted_by_id uuid,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    revoked_by_id uuid,
    revoke_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chapter_permission_grant_permission_key_check CHECK ((permission_key = ANY (ARRAY['chapter.dashboard.access'::text, 'chapter.members.view_approved'::text, 'chapter.members.view_alumni'::text, 'chapter.members.view_member_contact'::text, 'chapter.members.view_applicants'::text, 'chapter.members.view_rejected'::text, 'chapter.members.view_inactive'::text, 'chapter.members.manage_applications'::text, 'chapter.members.revoke'::text, 'chapter.roles.assign_eboard'::text, 'chapter.events.manage'::text, 'chapter.events.view_registrations'::text, 'chapter.events.check_in'::text, 'chapter.events.archive'::text, 'chapter.funding.view'::text, 'chapter.funding.submit'::text, 'chapter.funding.review'::text, 'chapter.pulse.view'::text, 'chapter.pulse.manage_action_plan'::text, 'chapter.impact_metrics.view'::text, 'chapter.impact_metrics.edit'::text]))),
    CONSTRAINT chapter_permission_grant_revoke_check CHECK ((((revoked_at IS NULL) AND (revoked_by_id IS NULL) AND (revoke_reason IS NULL)) OR ((revoked_at IS NOT NULL) AND (revoked_by_id IS NOT NULL) AND (revoke_reason IS NOT NULL) AND (length(btrim(revoke_reason)) > 0)))),
    CONSTRAINT chapter_permission_grant_source_check CHECK ((source = ANY (ARRAY['role_template'::text, 'manual_admin'::text, 'preapproval'::text, 'chapter_invite'::text, 'migration'::text]))),
    CONSTRAINT chapter_permission_grant_source_not_empty CHECK ((length(btrim(source)) > 0))
);


--
-- Name: TABLE chapter_permission_grant; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chapter_permission_grant IS 'Chapter-scoped product capabilities for official chapter operators.';


--
-- Name: COLUMN chapter_permission_grant.permission_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chapter_permission_grant.permission_key IS 'Action key such as chapter.dashboard.access or chapter.events.check_in.';


--
-- Name: chapter_preapproval; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chapter_preapproval (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    normalized_email text NOT NULL,
    chapter_id text NOT NULL,
    preapproval_type text NOT NULL,
    role_level text,
    functional_area text,
    display_title text,
    raw_title text,
    expires_at timestamp with time zone DEFAULT (now() + '6 mons'::interval) NOT NULL,
    consumed_at timestamp with time zone,
    consumed_by_user_id uuid,
    revoked_at timestamp with time zone,
    revoked_by_id uuid,
    created_by_id uuid,
    source text DEFAULT 'manual_admin'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chapter_preapproval_consumed_requires_user CHECK ((((consumed_at IS NULL) AND (consumed_by_user_id IS NULL)) OR ((consumed_at IS NOT NULL) AND (consumed_by_user_id IS NOT NULL)))),
    CONSTRAINT chapter_preapproval_email_not_empty CHECK ((length(btrim(email)) > 0)),
    CONSTRAINT chapter_preapproval_expires_after_created CHECK ((expires_at > created_at)),
    CONSTRAINT chapter_preapproval_normalized_email_matches_email CHECK ((normalized_email = lower(btrim(email)))),
    CONSTRAINT chapter_preapproval_normalized_email_not_empty CHECK ((length(btrim(normalized_email)) > 0)),
    CONSTRAINT chapter_preapproval_revoked_requires_user CHECK ((((revoked_at IS NULL) AND (revoked_by_id IS NULL)) OR ((revoked_at IS NOT NULL) AND (revoked_by_id IS NOT NULL)))),
    CONSTRAINT chapter_preapproval_role_fields_by_type CHECK ((((preapproval_type = 'member'::text) AND (role_level IS NULL) AND (functional_area IS NULL) AND (display_title IS NULL)) OR ((preapproval_type = 'eboard'::text) AND (role_level IS NOT NULL) AND (length(btrim(role_level)) > 0) AND (functional_area IS NOT NULL) AND (length(btrim(functional_area)) > 0) AND (display_title IS NOT NULL) AND (length(btrim(display_title)) > 0)))),
    CONSTRAINT chapter_preapproval_source_not_empty CHECK ((length(btrim(source)) > 0)),
    CONSTRAINT chapter_preapproval_type_check CHECK ((preapproval_type = ANY (ARRAY['member'::text, 'eboard'::text])))
);


--
-- Name: TABLE chapter_preapproval; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chapter_preapproval IS 'Email-bound preapproval records for verified chapter member and e-board activation.';


--
-- Name: COLUMN chapter_preapproval.normalized_email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chapter_preapproval.normalized_email IS 'Lowercase trimmed email used for exact claim matching.';


--
-- Name: COLUMN chapter_preapproval.preapproval_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chapter_preapproval.preapproval_type IS 'member auto-approves membership; eboard also creates role assignment and permission grants in service code.';


--
-- Name: chapter_role_assignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chapter_role_assignment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    chapter_id text NOT NULL,
    role_level text NOT NULL,
    functional_area text NOT NULL,
    display_title text NOT NULL,
    raw_title text,
    is_primary boolean DEFAULT true NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    assigned_by_id uuid,
    source text DEFAULT 'manual'::text NOT NULL,
    source_preapproval_id uuid,
    starts_at timestamp with time zone DEFAULT now() NOT NULL,
    ends_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source_chapter_invite_id uuid,
    CONSTRAINT chapter_role_assignment_display_title_not_empty CHECK ((length(btrim(display_title)) > 0)),
    CONSTRAINT chapter_role_assignment_functional_area_check CHECK ((functional_area = ANY (ARRAY['general_leadership'::text, 'strategy_operations'::text, 'marketing_communications'::text, 'events_experience'::text, 'finance_legal'::text, 'chapter_development'::text, 'academic_excellence'::text, 'professional_development'::text, 'leadership'::text, 'women_in_stem'::text, 'research'::text, 'projects'::text, 'partnerships_external_relations'::text, 'people_talent'::text, 'other'::text]))),
    CONSTRAINT chapter_role_assignment_lifecycle_check CHECK ((((status = 'active'::text) AND (ends_at IS NULL)) OR ((status = 'inactive'::text) AND (ends_at IS NOT NULL) AND (ends_at > starts_at)))),
    CONSTRAINT chapter_role_assignment_role_level_check CHECK ((role_level = ANY (ARRAY['president'::text, 'vice_president'::text, 'chief_of_staff'::text, 'director'::text, 'coordinator'::text, 'member'::text]))),
    CONSTRAINT chapter_role_assignment_source_check CHECK ((source = ANY (ARRAY['manual'::text, 'manual_admin'::text, 'preapproval'::text, 'chapter_invite'::text, 'migration'::text]))),
    CONSTRAINT chapter_role_assignment_source_not_empty CHECK ((length(btrim(source)) > 0)),
    CONSTRAINT chapter_role_assignment_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);


--
-- Name: TABLE chapter_role_assignment; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chapter_role_assignment IS 'Official chapter responsibility/title assignments for approved chapter members.';


--
-- Name: COLUMN chapter_role_assignment.role_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chapter_role_assignment.role_level IS 'Normalized seniority such as president, vice_president, chief_of_staff, director, coordinator, or member.';


--
-- Name: COLUMN chapter_role_assignment.functional_area; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chapter_role_assignment.functional_area IS 'Normalized responsibility area used for reporting and permission templates.';


--
-- Name: company; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by_id uuid NOT NULL
);


--
-- Name: event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    cover_image text,
    start_at timestamp with time zone NOT NULL,
    end_at timestamp with time zone NOT NULL,
    location text,
    meeting_url text,
    event_type public."EventType" DEFAULT 'in_person'::public."EventType" NOT NULL,
    capacity integer,
    is_published boolean DEFAULT false NOT NULL,
    chapter_id text,
    created_by_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    access_model text DEFAULT 'open'::text NOT NULL,
    application_form_url text,
    location_name text,
    location_address text,
    location_city text,
    location_region text,
    location_latitude numeric(10,8),
    location_longitude numeric(10,8),
    location_point public.geometry(Point,4326),
    CONSTRAINT "Event_accessModel_check" CHECK ((access_model = ANY (ARRAY['open'::text, 'application'::text]))),
    CONSTRAINT event_capacity_nonneg CHECK (((capacity IS NULL) OR (capacity >= 0))),
    CONSTRAINT event_end_after_start CHECK ((end_at > start_at)),
    CONSTRAINT event_type_valid CHECK ((event_type = ANY (ARRAY['in_person'::public."EventType", 'online'::public."EventType", 'hybrid'::public."EventType"])))
);


--
-- Name: COLUMN event.location_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event.location_name IS 'Human-readable location name';


--
-- Name: COLUMN event.location_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event.location_address IS 'Full street address';


--
-- Name: COLUMN event.location_city; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event.location_city IS 'City name for filtering';


--
-- Name: COLUMN event.location_region; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event.location_region IS 'Region for grouping';


--
-- Name: COLUMN event.location_latitude; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event.location_latitude IS 'Latitude for mapping';


--
-- Name: COLUMN event.location_longitude; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event.location_longitude IS 'Longitude for mapping';


--
-- Name: COLUMN event.location_point; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event.location_point IS 'Geographic point for spatial queries';


--
-- Name: event_application_answer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_application_answer (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    registration_id uuid NOT NULL,
    question_id uuid NOT NULL,
    answer_text text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    answer_json jsonb
);


--
-- Name: COLUMN event_application_answer.answer_json; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_application_answer.answer_json IS 'Structured answer payload for multi-value application question types such as checkbox.';


--
-- Name: event_application_question; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_application_question (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    question_type public.question_type DEFAULT 'short_text'::public.question_type NOT NULL,
    question_text text NOT NULL,
    options text[],
    is_required boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT event_application_question_sort_order_nonnegative CHECK ((sort_order >= 0))
);


--
-- Name: event_chapter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_chapter (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    chapter_id text NOT NULL,
    added_at timestamp with time zone DEFAULT now() NOT NULL,
    added_by_id uuid NOT NULL,
    CONSTRAINT temp_check_valid_chapters CHECK ((chapter_id IS NOT NULL))
);


--
-- Name: event_pathway_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_pathway_metadata (
    event_id uuid NOT NULL,
    is_pathway_eligible boolean DEFAULT false NOT NULL,
    primary_okr text,
    okr_alignment text[] DEFAULT '{}'::text[] NOT NULL,
    pillar_keys text[] DEFAULT '{}'::text[] NOT NULL,
    student_goal text,
    growth_stage_fit text[] DEFAULT '{}'::text[] NOT NULL,
    student_outcomes text[] DEFAULT '{}'::text[] NOT NULL,
    proof_outcome text,
    evidence_signals text[] DEFAULT '{}'::text[] NOT NULL,
    audience text,
    cta_type text,
    coordination_risk text DEFAULT 'low'::text NOT NULL,
    recommendation_safety text DEFAULT 'manual_review'::text NOT NULL,
    metadata_status text DEFAULT 'draft'::text NOT NULL,
    notes text,
    created_by_id uuid,
    updated_by_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT event_pathway_metadata_audience_check CHECK (((audience IS NULL) OR (audience = ANY (ARRAY['new_member'::text, 'active_member'::text, 'chapter_leader'::text, 'all_students'::text, 'application_required'::text, 'open_public'::text, 'chapter_only'::text])))),
    CONSTRAINT event_pathway_metadata_coordination_risk_check CHECK ((coordination_risk = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
    CONSTRAINT event_pathway_metadata_cta_type_check CHECK (((cta_type IS NULL) OR (cta_type = ANY (ARRAY['register'::text, 'apply'::text, 'attend'::text, 'reflect'::text, 'update_profile'::text, 'update_linkedin'::text, 'update_resume'::text, 'capture_proof'::text])))),
    CONSTRAINT event_pathway_metadata_eligible_requires_metadata CHECK (((is_pathway_eligible = false) OR ((primary_okr IS NOT NULL) AND (array_length(pillar_keys, 1) IS NOT NULL) AND (student_goal IS NOT NULL) AND (array_length(growth_stage_fit, 1) IS NOT NULL) AND (array_length(student_outcomes, 1) IS NOT NULL) AND (proof_outcome IS NOT NULL) AND (array_length(evidence_signals, 1) IS NOT NULL) AND (audience IS NOT NULL) AND (cta_type IS NOT NULL)))),
    CONSTRAINT event_pathway_metadata_evidence_signals_check CHECK ((evidence_signals <@ ARRAY['event_registration'::text, 'event_attendance'::text, 'application_submitted'::text, 'reflection_completed'::text, 'proof_submitted'::text, 'certificate_earned'::text, 'linkedin_updated'::text, 'resume_updated'::text, 'profile_updated'::text, 'mission_recap_completed'::text])),
    CONSTRAINT event_pathway_metadata_growth_stage_fit_check CHECK ((growth_stage_fit <@ ARRAY['explorer'::text, 'builder'::text, 'leader'::text, 'candidate'::text, 'emerging_professional'::text])),
    CONSTRAINT event_pathway_metadata_okr_alignment_check CHECK ((okr_alignment <@ ARRAY['inspire'::text, 'unite'::text, 'empower'::text, 'elevate'::text])),
    CONSTRAINT event_pathway_metadata_pillar_keys_check CHECK ((pillar_keys <@ ARRAY['lead_academia'::text, 'academic_excellence'::text, 'womens_excellence'::text, 'professional_development'::text, 'leadership_development'::text, 'community_outreach'::text, 'chapter_development'::text])),
    CONSTRAINT event_pathway_metadata_primary_okr_check CHECK (((primary_okr IS NULL) OR (primary_okr = ANY (ARRAY['inspire'::text, 'unite'::text, 'empower'::text, 'elevate'::text])))),
    CONSTRAINT event_pathway_metadata_proof_outcome_check CHECK (((proof_outcome IS NULL) OR (proof_outcome = ANY (ARRAY['none'::text, 'reflection'::text, 'certificate'::text, 'pitch_deck'::text, 'linkedin_update'::text, 'resume_bullet'::text, 'project_note'::text, 'portfolio_item'::text])))),
    CONSTRAINT event_pathway_metadata_recommendation_safety_check CHECK ((recommendation_safety = ANY (ARRAY['recommendable_now'::text, 'recommend_only_if_event_active'::text, 'manual_review'::text, 'not_recommendable'::text]))),
    CONSTRAINT event_pathway_metadata_status_check CHECK ((metadata_status = ANY (ARRAY['draft'::text, 'ready'::text, 'archived'::text]))),
    CONSTRAINT event_pathway_metadata_student_goal_check CHECK (((student_goal IS NULL) OR (student_goal = ANY (ARRAY['career_exploration'::text, 'technical_experience'::text, 'opportunity_readiness'::text, 'community_mentorship'::text, 'leadership'::text])))),
    CONSTRAINT event_pathway_metadata_student_outcomes_check CHECK ((student_outcomes <@ ARRAY['mission_orientation'::text, 'belonging'::text, 'career_exposure'::text, 'technical_skill'::text, 'innovation_project'::text, 'proof_artifact'::text, 'professional_readiness'::text, 'profile_visibility'::text, 'leadership_confidence'::text, 'teamwork'::text, 'reflection'::text, 'community_service'::text]))
);


--
-- Name: TABLE event_pathway_metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.event_pathway_metadata IS 'Student-safe Pathway recommendation metadata for a platform event.';


--
-- Name: COLUMN event_pathway_metadata.is_pathway_eligible; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_pathway_metadata.is_pathway_eligible IS 'When true, the event can be considered by Pathway matching once metadata_status and safety permit it.';


--
-- Name: COLUMN event_pathway_metadata.recommendation_safety; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_pathway_metadata.recommendation_safety IS 'Controls whether an event can be recommended immediately, only while active, after manual review, or not at all.';


--
-- Name: event_registration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_registration (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    user_id uuid NOT NULL,
    registered_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'registered'::text NOT NULL,
    qr_token uuid,
    checked_in_at timestamp with time zone,
    checked_in_by_id uuid,
    CONSTRAINT eventregistration_checkin_consistency CHECK ((((checked_in_at IS NULL) AND (checked_in_by_id IS NULL)) OR ((checked_in_at IS NOT NULL) AND (checked_in_by_id IS NOT NULL)))),
    CONSTRAINT eventregistration_status_valid CHECK ((status = ANY (ARRAY['registered'::text, 'pending_review'::text, 'rejected'::text, 'cancelled'::text, 'attended'::text]))),
    CONSTRAINT qr_token_status_check CHECK ((((status = 'registered'::text) AND (qr_token IS NOT NULL)) OR ((status <> 'registered'::text) AND (qr_token IS NULL))))
);


--
-- Name: event_registration_with_event; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.event_registration_with_event AS
 SELECT er.id,
    er.event_id,
    er.user_id,
    er.registered_at,
    er.status,
    er.qr_token,
    er.checked_in_at,
    er.checked_in_by_id,
    e.title AS event_title,
    e.description AS event_description,
    e.start_at AS event_start_at,
    e.end_at AS event_end_at,
    e.location AS event_location,
    e.meeting_url AS event_meeting_url,
    e.event_type,
    e.capacity AS event_capacity,
    e.is_published AS event_is_published,
    e.chapter_id AS event_chapter_id,
    e.access_model AS event_access_model
   FROM (public.event_registration er
     LEFT JOIN public.event e ON ((er.event_id = e.id)));


--
-- Name: event_with_chapter; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.event_with_chapter AS
 SELECT e.id,
    e.title,
    e.description,
    e.cover_image,
    e.start_at,
    e.end_at,
    e.location,
    e.meeting_url,
    e.event_type,
    e.capacity,
    e.is_published,
    e.chapter_id,
    e.created_by_id,
    e.created_at,
    e.updated_at,
    e.access_model,
    e.application_form_url,
    c.name AS chapter_name,
    c.university AS chapter_university,
    c.city AS chapter_city,
    c.region AS chapter_region
   FROM (public.event e
     LEFT JOIN public.chapter c ON ((e.chapter_id = c.id)));


--
-- Name: funding_request; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.funding_request (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chapter_id text NOT NULL,
    requester_user_id uuid NOT NULL,
    event_id uuid,
    title text NOT NULL,
    purpose text NOT NULL,
    expected_audience text NOT NULL,
    expected_attendee_count integer,
    requested_amount numeric(12,2) NOT NULL,
    approved_amount numeric(12,2),
    actual_spend_amount numeric(12,2),
    currency text DEFAULT 'PEN'::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    okr_keys text[] DEFAULT '{}'::text[] NOT NULL,
    pillar_keys text[] DEFAULT '{}'::text[] NOT NULL,
    partner_name text,
    partner_details text,
    supporting_notes text,
    event_date date NOT NULL,
    is_late_request boolean DEFAULT false NOT NULL,
    submitted_at timestamp with time zone,
    reviewed_by_id uuid,
    reviewed_at timestamp with time zone,
    admin_decision_note text,
    internal_funding_source text,
    internal_funding_source_note text,
    accountability_due_at date,
    accountability_submitted_at timestamp with time zone,
    accountability_note text,
    result_summary text,
    closed_by_id uuid,
    closed_at timestamp with time zone,
    closure_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT funding_request_actual_spend_amount_nonnegative CHECK (((actual_spend_amount IS NULL) OR (actual_spend_amount >= (0)::numeric))),
    CONSTRAINT funding_request_approved_amount_nonnegative CHECK (((approved_amount IS NULL) OR (approved_amount >= (0)::numeric))),
    CONSTRAINT funding_request_approved_not_above_requested CHECK (((approved_amount IS NULL) OR (approved_amount <= requested_amount))),
    CONSTRAINT funding_request_closure_consistency CHECK ((((closed_by_id IS NULL) AND (closed_at IS NULL)) OR ((closed_by_id IS NOT NULL) AND (closed_at IS NOT NULL)))),
    CONSTRAINT funding_request_currency_check CHECK ((currency = ANY (ARRAY['PEN'::text, 'USD'::text]))),
    CONSTRAINT funding_request_expected_attendee_count_nonnegative CHECK (((expected_attendee_count IS NULL) OR (expected_attendee_count >= 0))),
    CONSTRAINT funding_request_expected_audience_not_empty CHECK ((length(btrim(expected_audience)) > 0)),
    CONSTRAINT funding_request_internal_source_check CHECK (((internal_funding_source IS NULL) OR (internal_funding_source = ANY (ARRAY['lead_peru_chapter_budget'::text, 'lead_wide_event_budget'::text, 'sponsor_partner'::text, 'hola_benevity'::text, 'other'::text])))),
    CONSTRAINT funding_request_okr_keys_valid CHECK ((okr_keys <@ ARRAY['inspire'::text, 'unite'::text, 'empower'::text, 'elevate'::text])),
    CONSTRAINT funding_request_pillar_keys_valid CHECK ((pillar_keys <@ ARRAY['lead_academia'::text, 'academic_excellence'::text, 'womens_excellence'::text, 'professional_development'::text, 'leadership_development'::text, 'community_outreach'::text, 'chapter_development'::text])),
    CONSTRAINT funding_request_purpose_not_empty CHECK ((length(btrim(purpose)) > 0)),
    CONSTRAINT funding_request_requested_amount_positive CHECK ((requested_amount > (0)::numeric)),
    CONSTRAINT funding_request_requires_okr CHECK ((array_length(okr_keys, 1) IS NOT NULL)),
    CONSTRAINT funding_request_requires_pillar CHECK ((array_length(pillar_keys, 1) IS NOT NULL)),
    CONSTRAINT funding_request_review_consistency CHECK ((((reviewed_by_id IS NULL) AND (reviewed_at IS NULL)) OR ((reviewed_by_id IS NOT NULL) AND (reviewed_at IS NOT NULL)))),
    CONSTRAINT funding_request_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'changes_requested'::text, 'approved'::text, 'rejected'::text, 'receipts_due'::text, 'closed'::text]))),
    CONSTRAINT funding_request_title_not_empty CHECK ((length(btrim(title)) > 0))
);


--
-- Name: TABLE funding_request; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.funding_request IS 'Chapter-scoped LEAD Funding requests for event or initiative support. Payments stay offline.';


--
-- Name: COLUMN funding_request.is_late_request; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funding_request.is_late_request IS 'True when the request is submitted less than 14 days before the event or initiative date.';


--
-- Name: COLUMN funding_request.internal_funding_source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funding_request.internal_funding_source IS 'Admin-only tag for internal source assignment. Chapters do not choose this in v1.';


--
-- Name: funding_request_budget_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.funding_request_budget_item (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    funding_request_id uuid NOT NULL,
    label text NOT NULL,
    category text DEFAULT 'other'::text NOT NULL,
    amount numeric(12,2) NOT NULL,
    notes text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT funding_request_budget_item_amount_positive CHECK ((amount > (0)::numeric)),
    CONSTRAINT funding_request_budget_item_category_check CHECK ((category = ANY (ARRAY['food_refreshments'::text, 'event_materials'::text, 'minimal_decorations'::text, 'learning_materials'::text, 'recognition_items'::text, 'software_platforms'::text, 'speaker_support'::text, 'transportation_exception'::text, 'other'::text]))),
    CONSTRAINT funding_request_budget_item_label_not_empty CHECK ((length(btrim(label)) > 0))
);


--
-- Name: TABLE funding_request_budget_item; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.funding_request_budget_item IS 'Itemized budget rows for a LEAD Funding request.';


--
-- Name: funding_request_file; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.funding_request_file (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    funding_request_id uuid NOT NULL,
    chapter_id text NOT NULL,
    uploaded_by_id uuid,
    file_type text NOT NULL,
    storage_bucket text DEFAULT 'funding-files'::text NOT NULL,
    storage_path text,
    external_url text,
    original_name text,
    mime_type text,
    file_size_bytes integer,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT funding_request_file_bucket_check CHECK ((storage_bucket = 'funding-files'::text)),
    CONSTRAINT funding_request_file_location_check CHECK (((storage_path IS NOT NULL) OR (external_url IS NOT NULL))),
    CONSTRAINT funding_request_file_size_nonnegative CHECK (((file_size_bytes IS NULL) OR (file_size_bytes >= 0))),
    CONSTRAINT funding_request_file_type_check CHECK ((file_type = ANY (ARRAY['supporting_material'::text, 'receipt'::text, 'evidence'::text])))
);


--
-- Name: TABLE funding_request_file; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.funding_request_file IS 'Private file or link metadata for LEAD Funding supporting materials, receipts, and evidence.';


--
-- Name: funding_request_status_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.funding_request_status_event (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    funding_request_id uuid NOT NULL,
    actor_user_id uuid,
    from_status text,
    to_status text NOT NULL,
    note text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT funding_request_status_event_from_status_check CHECK (((from_status IS NULL) OR (from_status = ANY (ARRAY['draft'::text, 'submitted'::text, 'changes_requested'::text, 'approved'::text, 'rejected'::text, 'receipts_due'::text, 'closed'::text])))),
    CONSTRAINT funding_request_status_event_metadata_object CHECK ((jsonb_typeof(metadata) = 'object'::text)),
    CONSTRAINT funding_request_status_event_to_status_check CHECK ((to_status = ANY (ARRAY['draft'::text, 'submitted'::text, 'changes_requested'::text, 'approved'::text, 'rejected'::text, 'receipts_due'::text, 'closed'::text])))
);


--
-- Name: TABLE funding_request_status_event; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.funding_request_status_event IS 'Status timeline for LEAD Funding request decisions and accountability events.';


--
-- Name: growth_reflection; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.growth_reflection (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    recommendation_id uuid,
    status text DEFAULT 'draft'::text NOT NULL,
    visibility text DEFAULT 'private'::text NOT NULL,
    participated_in text NOT NULL,
    learned text NOT NULL,
    skill_or_mindset text NOT NULL,
    goal_connection text NOT NULL,
    next_move text NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    event_id uuid,
    CONSTRAINT growth_reflection_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'completed'::text, 'transformed'::text]))),
    CONSTRAINT growth_reflection_visibility_check CHECK ((visibility = ANY (ARRAY['private'::text, 'student_selected_for_profile'::text, 'recruiter_visible'::text, 'archived'::text])))
);


--
-- Name: lead_identity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_identity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    identity_type public.identity_type NOT NULL,
    chapter_id text,
    is_primary boolean DEFAULT true NOT NULL,
    issued_by_id uuid,
    issued_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    status public.identity_status DEFAULT 'active'::public.identity_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: newsletter_subscription; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_subscription (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    scope public.newsletter_scope DEFAULT 'global'::public.newsletter_scope NOT NULL,
    chapter_id text,
    status public.newsletter_status DEFAULT 'active'::public.newsletter_status NOT NULL,
    source public.subscription_source DEFAULT 'manual'::public.subscription_source NOT NULL,
    subscribed_at timestamp with time zone DEFAULT now() NOT NULL,
    unsubscribed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT newsletter_subscription_scope_chapter_check CHECK ((((scope = 'global'::public.newsletter_scope) AND (chapter_id IS NULL)) OR ((scope = 'chapter'::public.newsletter_scope) AND (chapter_id IS NOT NULL))))
);


--
-- Name: pathway_check_in; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pathway_check_in (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    chapter_id text,
    status text DEFAULT 'not_started'::text NOT NULL,
    looking_for text,
    current_blocker text,
    study_interest text,
    confidence_level integer,
    monthly_time_commitment text,
    submitted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    growth_stage text,
    primary_focus text,
    CONSTRAINT pathway_check_in_confidence_level_check CHECK (((confidence_level IS NULL) OR ((confidence_level >= 1) AND (confidence_level <= 5)))),
    CONSTRAINT pathway_check_in_growth_stage_check CHECK (((growth_stage IS NULL) OR (growth_stage = ANY (ARRAY['explorer'::text, 'builder'::text, 'leader'::text, 'candidate'::text, 'emerging_professional'::text])))),
    CONSTRAINT pathway_check_in_monthly_time_commitment_check CHECK (((monthly_time_commitment IS NULL) OR (monthly_time_commitment = ANY (ARRAY['one_hour'::text, 'two_to_four_hours'::text, 'five_plus_hours'::text])))),
    CONSTRAINT pathway_check_in_primary_focus_check CHECK (((primary_focus IS NULL) OR (primary_focus = ANY (ARRAY['career_exploration'::text, 'technical_experience'::text, 'opportunity_readiness'::text, 'community_mentorship'::text, 'leadership'::text])))),
    CONSTRAINT pathway_check_in_status_check CHECK ((status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text])))
);


--
-- Name: pathway_feature_flag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pathway_feature_flag (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chapter_id text,
    enable_check_in boolean DEFAULT false NOT NULL,
    enable_recommendation_card boolean DEFAULT false NOT NULL,
    enable_growth_reflection boolean DEFAULT false NOT NULL,
    enable_chapter_insights boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by_id uuid
);


--
-- Name: pathway_recommendation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pathway_recommendation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    check_in_id uuid NOT NULL,
    user_id uuid NOT NULL,
    category text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    reason text NOT NULL,
    sort_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source_type text DEFAULT 'fixed_action'::text NOT NULL,
    source_event_id uuid,
    cta_type text,
    evidence_signal text,
    matched_reasons jsonb DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT pathway_recommendation_category_check CHECK ((category = ANY (ARRAY['learn'::text, 'connect'::text, 'prove'::text]))),
    CONSTRAINT pathway_recommendation_cta_type_check CHECK (((cta_type IS NULL) OR (cta_type = ANY (ARRAY['register'::text, 'apply'::text, 'attend'::text, 'reflect'::text, 'update_profile'::text, 'update_linkedin'::text, 'update_resume'::text, 'capture_proof'::text])))),
    CONSTRAINT pathway_recommendation_event_source_consistency CHECK ((((source_type = 'event'::text) AND (source_event_id IS NOT NULL)) OR (source_type <> 'event'::text))),
    CONSTRAINT pathway_recommendation_evidence_signal_check CHECK (((evidence_signal IS NULL) OR (evidence_signal = ANY (ARRAY['event_registration'::text, 'event_attendance'::text, 'application_submitted'::text, 'reflection_completed'::text, 'proof_submitted'::text, 'certificate_earned'::text, 'linkedin_updated'::text, 'resume_updated'::text, 'profile_updated'::text, 'mission_recap_completed'::text])))),
    CONSTRAINT pathway_recommendation_matched_reasons_array CHECK ((jsonb_typeof(matched_reasons) = 'array'::text)),
    CONSTRAINT pathway_recommendation_source_type_check CHECK ((source_type = ANY (ARRAY['event'::text, 'profile_action'::text, 'proof_action'::text, 'fixed_action'::text]))),
    CONSTRAINT pathway_recommendation_status_check CHECK ((status = ANY (ARRAY['active'::text, 'started'::text, 'completed'::text, 'dismissed'::text])))
);


--
-- Name: COLUMN pathway_recommendation.source_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pathway_recommendation.source_type IS 'Auditable recommendation source: event, profile action, proof action, or fixed action.';


--
-- Name: COLUMN pathway_recommendation.source_event_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pathway_recommendation.source_event_id IS 'Event source when a recommendation comes from event_pathway_metadata.';


--
-- Name: COLUMN pathway_recommendation.matched_reasons; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pathway_recommendation.matched_reasons IS 'JSON array of student-safe reasons explaining why the recommendation matched.';


--
-- Name: person_profile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.person_profile (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    university text,
    major_or_interest text,
    graduation_year integer,
    linkedin_url text,
    portfolio_url text,
    skills text[],
    gender text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_recruiter_visible boolean DEFAULT false
);


--
-- Name: published_event_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.published_event_listing AS
SELECT
    NULL::uuid AS id,
    NULL::text AS title,
    NULL::text AS description,
    NULL::text AS cover_image,
    NULL::timestamp with time zone AS start_at,
    NULL::timestamp with time zone AS end_at,
    NULL::text AS location,
    NULL::text AS meeting_url,
    NULL::public."EventType" AS event_type,
    NULL::integer AS capacity,
    NULL::boolean AS is_published,
    NULL::text AS access_model,
    NULL::text AS application_form_url,
    NULL::text AS chapter_id,
    NULL::uuid AS created_by_id,
    NULL::timestamp with time zone AS created_at,
    NULL::timestamp with time zone AS updated_at,
    NULL::text AS location_name,
    NULL::text AS location_address,
    NULL::text AS location_city,
    NULL::text AS location_region,
    NULL::numeric(10,8) AS location_latitude,
    NULL::numeric(10,8) AS location_longitude,
    NULL::text AS chapter_name,
    NULL::text AS chapter_university,
    NULL::text AS chapter_city,
    NULL::text AS chapter_region,
    NULL::integer AS registrations_count;


--
-- Name: recruiter_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recruiter_access (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recruiter_email text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    granted_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    granted_by_id uuid NOT NULL,
    invite_token uuid NOT NULL,
    invite_expires_at timestamp with time zone,
    accepted_at timestamp with time zone,
    accepted_by_user_id uuid,
    company_id uuid NOT NULL,
    revoked_at timestamp with time zone,
    revoked_by_id uuid,
    CONSTRAINT "RecruiterAccess_isActive_consistency" CHECK (((is_active = false) OR ((accepted_at IS NOT NULL) AND (revoked_at IS NULL))))
);


--
-- Name: COLUMN recruiter_access.accepted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recruiter_access.accepted_at IS 'Timestamp when recruiter accepted the invitation';


--
-- Name: COLUMN recruiter_access.accepted_by_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recruiter_access.accepted_by_user_id IS 'User ID of the person who accepted (links to their auth account)';


--
-- Name: resume; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resume (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    file_url text NOT NULL,
    file_name text NOT NULL,
    file_size integer NOT NULL,
    uploaded_at timestamp with time zone NOT NULL,
    parsed_data jsonb
);


--
-- Name: resume_download_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resume_download_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recruiter_id uuid NOT NULL,
    student_id uuid NOT NULL,
    downloaded_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: saved_student; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_student (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recruiter_id uuid NOT NULL,
    student_id uuid NOT NULL,
    saved_at timestamp with time zone DEFAULT now() NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE saved_student; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.saved_student IS 'Stores individual recruiter saved/bookmarked students';


--
-- Name: COLUMN saved_student.recruiter_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.saved_student.recruiter_id IS 'The recruiter who saved this student';


--
-- Name: COLUMN saved_student.student_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.saved_student.student_id IS 'The student being saved';


--
-- Name: COLUMN saved_student.notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.saved_student.notes IS 'Private notes the recruiter can add about this student';


--
-- Name: student_profile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_profile (
    user_id uuid NOT NULL,
    major text NOT NULL,
    graduation_year integer NOT NULL,
    linkedin_url text,
    skills text[],
    consent_recruiter_visibility boolean DEFAULT false NOT NULL,
    consent_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    is_recruiter_visible boolean DEFAULT false NOT NULL,
    approved_by_id uuid,
    is_filled boolean DEFAULT false NOT NULL,
    chapter_id text NOT NULL,
    email_notifications_enabled boolean DEFAULT true NOT NULL,
    approval_status public.approval_status DEFAULT 'pending'::public.approval_status,
    member_id text,
    gender text,
    CONSTRAINT studentprofile_gender_check CHECK ((gender = ANY (ARRAY['man'::text, 'woman'::text, 'non_binary'::text, 'prefer_not_to_say'::text])))
);


--
-- Name: TABLE student_profile; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.student_profile IS 'DEPRECATED: This table is being replaced by the layered model.
- Basic profile data migrated to: person_profile
- Chapter membership migrated to: chapter_membership
- LEAD identities migrated to: lead_identity
- Email subscriptions migrated to: newsletter_subscription
DO NOT INSERT NEW DATA - use new tables instead.';


--
-- Name: COLUMN student_profile.email_notifications_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.student_profile.email_notifications_enabled IS 'Whether the student wants to receive email notifications about LEAD events and opportunities';


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id uuid NOT NULL,
    email text NOT NULL,
    name text,
    role public."Role" DEFAULT 'member'::public."Role" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT now() NOT NULL,
    phone text,
    deactivated_at timestamp with time zone
);


--
-- Name: chapter Chapter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter
    ADD CONSTRAINT "Chapter_pkey" PRIMARY KEY (id);


--
-- Name: company Company_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT "Company_name_key" UNIQUE (name);


--
-- Name: company Company_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT "Company_pkey" PRIMARY KEY (id);


--
-- Name: event_chapter EventChapter_eventId_chapterId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_chapter
    ADD CONSTRAINT "EventChapter_eventId_chapterId_key" UNIQUE (event_id, chapter_id);


--
-- Name: event_chapter EventChapter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_chapter
    ADD CONSTRAINT "EventChapter_pkey" PRIMARY KEY (id);


--
-- Name: event_registration EventRegistration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registration
    ADD CONSTRAINT "EventRegistration_pkey" PRIMARY KEY (id);


--
-- Name: event_registration EventRegistration_qrtoken_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registration
    ADD CONSTRAINT "EventRegistration_qrtoken_key" UNIQUE (qr_token);


--
-- Name: event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: recruiter_access RecruiterAccess_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_access
    ADD CONSTRAINT "RecruiterAccess_pkey" PRIMARY KEY (id);


--
-- Name: resume_download_log ResumeDownloadLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_download_log
    ADD CONSTRAINT "ResumeDownloadLog_pkey" PRIMARY KEY (id);


--
-- Name: resume Resume_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume
    ADD CONSTRAINT "Resume_pkey" PRIMARY KEY (id);


--
-- Name: resume Resume_studentId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume
    ADD CONSTRAINT "Resume_studentId_key" UNIQUE (student_id);


--
-- Name: saved_student SavedStudent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_student
    ADD CONSTRAINT "SavedStudent_pkey" PRIMARY KEY (id);


--
-- Name: saved_student SavedStudent_recruiter_student_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_student
    ADD CONSTRAINT "SavedStudent_recruiter_student_key" UNIQUE (recruiter_id, student_id);


--
-- Name: saved_student SavedStudent_unique_recruiter_student; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_student
    ADD CONSTRAINT "SavedStudent_unique_recruiter_student" UNIQUE (recruiter_id, student_id);


--
-- Name: student_profile StudentProfile_memberid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_profile
    ADD CONSTRAINT "StudentProfile_memberid_key" UNIQUE (member_id);


--
-- Name: student_profile StudentProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_profile
    ADD CONSTRAINT "StudentProfile_pkey" PRIMARY KEY (user_id);


--
-- Name: user User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: chapter_activation_interest chapter_activation_interest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_activation_interest
    ADD CONSTRAINT chapter_activation_interest_pkey PRIMARY KEY (id);


--
-- Name: chapter_audit_log chapter_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_audit_log
    ADD CONSTRAINT chapter_audit_log_pkey PRIMARY KEY (id);


--
-- Name: chapter_invite chapter_invite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_invite
    ADD CONSTRAINT chapter_invite_pkey PRIMARY KEY (id);


--
-- Name: chapter_membership chapter_membership_member_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_membership
    ADD CONSTRAINT chapter_membership_member_id_key UNIQUE (member_id);


--
-- Name: chapter_membership chapter_membership_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_membership
    ADD CONSTRAINT chapter_membership_pkey PRIMARY KEY (id);


--
-- Name: chapter_permission_grant chapter_permission_grant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_permission_grant
    ADD CONSTRAINT chapter_permission_grant_pkey PRIMARY KEY (id);


--
-- Name: chapter_preapproval chapter_preapproval_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_preapproval
    ADD CONSTRAINT chapter_preapproval_pkey PRIMARY KEY (id);


--
-- Name: chapter_role_assignment chapter_role_assignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_role_assignment
    ADD CONSTRAINT chapter_role_assignment_pkey PRIMARY KEY (id);


--
-- Name: event_application_answer event_application_answer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_application_answer
    ADD CONSTRAINT event_application_answer_pkey PRIMARY KEY (id);


--
-- Name: event_application_question event_application_question_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_application_question
    ADD CONSTRAINT event_application_question_pkey PRIMARY KEY (id);


--
-- Name: event_pathway_metadata event_pathway_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_pathway_metadata
    ADD CONSTRAINT event_pathway_metadata_pkey PRIMARY KEY (event_id);


--
-- Name: funding_request_budget_item funding_request_budget_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funding_request_budget_item
    ADD CONSTRAINT funding_request_budget_item_pkey PRIMARY KEY (id);


--
-- Name: funding_request_file funding_request_file_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funding_request_file
    ADD CONSTRAINT funding_request_file_pkey PRIMARY KEY (id);


--
-- Name: funding_request funding_request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funding_request
    ADD CONSTRAINT funding_request_pkey PRIMARY KEY (id);


--
-- Name: funding_request_status_event funding_request_status_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funding_request_status_event
    ADD CONSTRAINT funding_request_status_event_pkey PRIMARY KEY (id);


--
-- Name: growth_reflection growth_reflection_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_reflection
    ADD CONSTRAINT growth_reflection_pkey PRIMARY KEY (id);


--
-- Name: lead_identity lead_identity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_identity
    ADD CONSTRAINT lead_identity_pkey PRIMARY KEY (id);


--
-- Name: newsletter_subscription newsletter_subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscription
    ADD CONSTRAINT newsletter_subscription_pkey PRIMARY KEY (id);


--
-- Name: pathway_check_in pathway_check_in_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pathway_check_in
    ADD CONSTRAINT pathway_check_in_pkey PRIMARY KEY (id);


--
-- Name: pathway_feature_flag pathway_feature_flag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pathway_feature_flag
    ADD CONSTRAINT pathway_feature_flag_pkey PRIMARY KEY (id);


--
-- Name: pathway_recommendation pathway_recommendation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pathway_recommendation
    ADD CONSTRAINT pathway_recommendation_pkey PRIMARY KEY (id);


--
-- Name: person_profile person_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_profile
    ADD CONSTRAINT person_profile_pkey PRIMARY KEY (id);


--
-- Name: person_profile person_profile_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_profile
    ADD CONSTRAINT person_profile_user_id_key UNIQUE (user_id);


--
-- Name: recruiter_access unique_invite_token; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_access
    ADD CONSTRAINT unique_invite_token UNIQUE (invite_token);


--
-- Name: event_application_answer uq_event_application_answer_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_application_answer
    ADD CONSTRAINT uq_event_application_answer_unique UNIQUE (registration_id, question_id);


--
-- Name: EventChapter_chapterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EventChapter_chapterId_idx" ON public.event_chapter USING btree (chapter_id);


--
-- Name: EventChapter_eventId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EventChapter_eventId_idx" ON public.event_chapter USING btree (event_id);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."user" USING btree (email);


--
-- Name: event_chapter_start_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_chapter_start_idx ON public.event USING btree (chapter_id, start_at);


--
-- Name: event_published_start_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_published_start_idx ON public.event USING btree (is_published, start_at);


--
-- Name: idx_chapter_activation_interest_one_submitted_per_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_chapter_activation_interest_one_submitted_per_user ON public.chapter_activation_interest USING btree (user_id) WHERE (status = 'submitted'::text);


--
-- Name: idx_chapter_activation_interest_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_activation_interest_status ON public.chapter_activation_interest USING btree (status);


--
-- Name: idx_chapter_activation_interest_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_activation_interest_user_id ON public.chapter_activation_interest USING btree (user_id);


--
-- Name: idx_chapter_audit_log_action_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_audit_log_action_created ON public.chapter_audit_log USING btree (action, created_at DESC);


--
-- Name: idx_chapter_audit_log_actor_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_audit_log_actor_created ON public.chapter_audit_log USING btree (actor_user_id, created_at DESC);


--
-- Name: idx_chapter_audit_log_chapter_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_audit_log_chapter_created ON public.chapter_audit_log USING btree (chapter_id, created_at DESC);


--
-- Name: idx_chapter_audit_log_target_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_audit_log_target_created ON public.chapter_audit_log USING btree (target_user_id, created_at DESC);


--
-- Name: idx_chapter_invite_active_email_chapter; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_chapter_invite_active_email_chapter ON public.chapter_invite USING btree (normalized_email, chapter_id) WHERE (status = 'pending'::text);


--
-- Name: idx_chapter_invite_active_protected_role; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_chapter_invite_active_protected_role ON public.chapter_invite USING btree (chapter_id, role_level) WHERE ((status = 'pending'::text) AND (invite_type = 'protected_leader'::text));


--
-- Name: idx_chapter_invite_chapter_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_invite_chapter_status ON public.chapter_invite USING btree (chapter_id, status);


--
-- Name: idx_chapter_invite_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_invite_expires_at ON public.chapter_invite USING btree (expires_at);


--
-- Name: idx_chapter_invite_token_hash_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_chapter_invite_token_hash_unique ON public.chapter_invite USING btree (token_hash);


--
-- Name: idx_chapter_location_point; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_location_point ON public.chapter USING gist (location_point);


--
-- Name: idx_chapter_membership_chapter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_membership_chapter_id ON public.chapter_membership USING btree (chapter_id);


--
-- Name: idx_chapter_membership_chapter_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_membership_chapter_status ON public.chapter_membership USING btree (chapter_id, status);


--
-- Name: idx_chapter_membership_member_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_membership_member_id ON public.chapter_membership USING btree (member_id);


--
-- Name: idx_chapter_membership_one_approved_per_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_chapter_membership_one_approved_per_user ON public.chapter_membership USING btree (user_id) WHERE (status = 'approved'::public.membership_status);


--
-- Name: idx_chapter_membership_user_chapter_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_chapter_membership_user_chapter_unique ON public.chapter_membership USING btree (user_id, chapter_id);


--
-- Name: idx_chapter_membership_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_membership_user_id ON public.chapter_membership USING btree (user_id);


--
-- Name: idx_chapter_permission_active_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_chapter_permission_active_unique ON public.chapter_permission_grant USING btree (user_id, chapter_id, permission_key) WHERE (revoked_at IS NULL);


--
-- Name: idx_chapter_permission_chapter_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_permission_chapter_key ON public.chapter_permission_grant USING btree (chapter_id, permission_key) WHERE (revoked_at IS NULL);


--
-- Name: idx_chapter_permission_source_assignment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_permission_source_assignment ON public.chapter_permission_grant USING btree (source_role_assignment_id);


--
-- Name: idx_chapter_permission_user_chapter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_permission_user_chapter ON public.chapter_permission_grant USING btree (user_id, chapter_id) WHERE (revoked_at IS NULL);


--
-- Name: idx_chapter_preapproval_active_email_chapter; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_chapter_preapproval_active_email_chapter ON public.chapter_preapproval USING btree (normalized_email, chapter_id) WHERE ((consumed_at IS NULL) AND (revoked_at IS NULL));


--
-- Name: idx_chapter_preapproval_chapter_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_preapproval_chapter_type ON public.chapter_preapproval USING btree (chapter_id, preapproval_type);


--
-- Name: idx_chapter_preapproval_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_preapproval_expires_at ON public.chapter_preapproval USING btree (expires_at);


--
-- Name: idx_chapter_preapproval_normalized_email_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_preapproval_normalized_email_active ON public.chapter_preapproval USING btree (normalized_email) WHERE ((consumed_at IS NULL) AND (revoked_at IS NULL));


--
-- Name: idx_chapter_role_assignment_chapter_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_role_assignment_chapter_status ON public.chapter_role_assignment USING btree (chapter_id, status);


--
-- Name: idx_chapter_role_assignment_one_active_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_chapter_role_assignment_one_active_primary ON public.chapter_role_assignment USING btree (user_id, chapter_id) WHERE ((is_primary = true) AND (status = 'active'::text));


--
-- Name: idx_chapter_role_assignment_source_chapter_invite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_role_assignment_source_chapter_invite ON public.chapter_role_assignment USING btree (source_chapter_invite_id);


--
-- Name: idx_chapter_role_assignment_source_preapproval; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_role_assignment_source_preapproval ON public.chapter_role_assignment USING btree (source_preapproval_id);


--
-- Name: idx_chapter_role_assignment_user_chapter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_role_assignment_user_chapter ON public.chapter_role_assignment USING btree (user_id, chapter_id);


--
-- Name: idx_event_application_answer_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_application_answer_question_id ON public.event_application_answer USING btree (question_id);


--
-- Name: idx_event_application_answer_registration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_application_answer_registration_id ON public.event_application_answer USING btree (registration_id);


--
-- Name: idx_event_application_question_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_application_question_event_id ON public.event_application_question USING btree (event_id);


--
-- Name: idx_event_application_question_sort_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_application_question_sort_order ON public.event_application_question USING btree (event_id, sort_order);


--
-- Name: idx_event_chapter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_chapter ON public.event USING btree (chapter_id, is_published);


--
-- Name: idx_event_chapter_chapter_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_chapter_chapter_event ON public.event_chapter USING btree (chapter_id, event_id);


--
-- Name: idx_event_location_point; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_location_point ON public.event USING gist (location_point);


--
-- Name: idx_event_pathway_metadata_eligible; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_pathway_metadata_eligible ON public.event_pathway_metadata USING btree (is_pathway_eligible, metadata_status, recommendation_safety);


--
-- Name: idx_event_pathway_metadata_pillar_keys; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_pathway_metadata_pillar_keys ON public.event_pathway_metadata USING gin (pillar_keys);


--
-- Name: idx_event_pathway_metadata_primary_okr; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_pathway_metadata_primary_okr ON public.event_pathway_metadata USING btree (primary_okr) WHERE (primary_okr IS NOT NULL);


--
-- Name: idx_event_pathway_metadata_student_outcomes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_pathway_metadata_student_outcomes ON public.event_pathway_metadata USING gin (student_outcomes);


--
-- Name: idx_event_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_published ON public.event USING btree (is_published, start_at);


--
-- Name: idx_event_published_start_chapter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_published_start_chapter ON public.event USING btree (is_published DESC, start_at DESC, chapter_id);


--
-- Name: idx_event_registration_event_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_registration_event_status ON public.event_registration USING btree (event_id, status) WHERE (status = ANY (ARRAY['registered'::text, 'attended'::text]));


--
-- Name: idx_eventchapter_chapter_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eventchapter_chapter_lookup ON public.event_chapter USING btree (chapter_id, event_id);


--
-- Name: idx_events_chapter_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_chapter_published ON public.event USING btree (chapter_id, is_published, start_at DESC);


--
-- Name: idx_events_listing_performance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_listing_performance ON public.event USING btree (is_published, start_at DESC, chapter_id);


--
-- Name: idx_funding_request_budget_item_request; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funding_request_budget_item_request ON public.funding_request_budget_item USING btree (funding_request_id, sort_order);


--
-- Name: idx_funding_request_chapter_status_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funding_request_chapter_status_date ON public.funding_request USING btree (chapter_id, status, event_date DESC);


--
-- Name: idx_funding_request_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funding_request_event ON public.funding_request USING btree (event_id) WHERE (event_id IS NOT NULL);


--
-- Name: idx_funding_request_file_chapter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funding_request_file_chapter ON public.funding_request_file USING btree (chapter_id, created_at DESC);


--
-- Name: idx_funding_request_file_request_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funding_request_file_request_type ON public.funding_request_file USING btree (funding_request_id, file_type, created_at DESC);


--
-- Name: idx_funding_request_file_storage_path_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_funding_request_file_storage_path_unique ON public.funding_request_file USING btree (storage_bucket, storage_path) WHERE (storage_path IS NOT NULL);


--
-- Name: idx_funding_request_okr_keys; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funding_request_okr_keys ON public.funding_request USING gin (okr_keys);


--
-- Name: idx_funding_request_pillar_keys; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funding_request_pillar_keys ON public.funding_request USING gin (pillar_keys);


--
-- Name: idx_funding_request_requester; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funding_request_requester ON public.funding_request USING btree (requester_user_id, created_at DESC);


--
-- Name: idx_funding_request_reviewer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funding_request_reviewer ON public.funding_request USING btree (reviewed_by_id, reviewed_at DESC) WHERE (reviewed_by_id IS NOT NULL);


--
-- Name: idx_funding_request_status_event_request_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funding_request_status_event_request_created ON public.funding_request_status_event USING btree (funding_request_id, created_at DESC);


--
-- Name: idx_lead_identity_one_active_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_lead_identity_one_active_primary ON public.lead_identity USING btree (user_id) WHERE ((status = 'active'::public.identity_status) AND (is_primary = true));


--
-- Name: idx_lead_identity_one_active_target; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_lead_identity_one_active_target ON public.lead_identity USING btree (user_id, identity_type, COALESCE(chapter_id, '__global__'::text)) WHERE (status = 'active'::public.identity_status);


--
-- Name: idx_newsletter_subscription_active_chapter_campaigns; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_subscription_active_chapter_campaigns ON public.newsletter_subscription USING btree (chapter_id, status) WHERE (scope = 'chapter'::public.newsletter_scope);


--
-- Name: idx_newsletter_subscription_chapter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_subscription_chapter_id ON public.newsletter_subscription USING btree (chapter_id);


--
-- Name: idx_newsletter_subscription_one_chapter_per_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_newsletter_subscription_one_chapter_per_user ON public.newsletter_subscription USING btree (user_id, chapter_id) WHERE (scope = 'chapter'::public.newsletter_scope);


--
-- Name: idx_newsletter_subscription_one_global_per_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_newsletter_subscription_one_global_per_user ON public.newsletter_subscription USING btree (user_id) WHERE (scope = 'global'::public.newsletter_scope);


--
-- Name: idx_newsletter_subscription_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_subscription_status ON public.newsletter_subscription USING btree (status);


--
-- Name: idx_newsletter_subscription_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_subscription_user_id ON public.newsletter_subscription USING btree (user_id);


--
-- Name: idx_pathway_recommendation_source_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pathway_recommendation_source_event ON public.pathway_recommendation USING btree (source_event_id) WHERE (source_event_id IS NOT NULL);


--
-- Name: idx_person_profile_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_profile_created_at ON public.person_profile USING btree (created_at);


--
-- Name: idx_person_profile_recruiter_visible; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_profile_recruiter_visible ON public.person_profile USING btree (is_recruiter_visible) WHERE (is_recruiter_visible = true);


--
-- Name: idx_recruiter_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recruiter_active ON public.recruiter_access USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_recruiter_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recruiter_company ON public.recruiter_access USING btree (company_id);


--
-- Name: idx_recruiter_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recruiter_email ON public.recruiter_access USING btree (recruiter_email);


--
-- Name: idx_recruiter_invite_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recruiter_invite_token ON public.recruiter_access USING btree (invite_token) WHERE (accepted_at IS NULL);


--
-- Name: idx_recruiter_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recruiter_token ON public.recruiter_access USING btree (invite_token) WHERE (accepted_at IS NULL);


--
-- Name: idx_registration_access; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registration_access ON public.event_registration USING btree (event_id, status) WHERE (status = 'pending_review'::text);


--
-- Name: idx_registration_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registration_event ON public.event_registration USING btree (event_id, status);


--
-- Name: idx_registration_qrtoken; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registration_qrtoken ON public.event_registration USING btree (qr_token);


--
-- Name: idx_registration_unique_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_registration_unique_active ON public.event_registration USING btree (event_id, user_id) WHERE (status <> ALL (ARRAY['cancelled'::text, 'rejected'::text]));


--
-- Name: idx_registration_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registration_user ON public.event_registration USING btree (user_id, status);


--
-- Name: idx_savedstudent_recruiter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_savedstudent_recruiter ON public.saved_student USING btree (recruiter_id);


--
-- Name: idx_savedstudent_savedat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_savedstudent_savedat ON public.saved_student USING btree (saved_at DESC);


--
-- Name: idx_savedstudent_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_savedstudent_student ON public.saved_student USING btree (student_id);


--
-- Name: idx_student_profile_chapter_approval; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_profile_chapter_approval ON public.student_profile USING btree (chapter_id, approval_status) WHERE (approval_status = 'approved'::public.approval_status);


--
-- Name: idx_studentprofile_approval; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studentprofile_approval ON public.student_profile USING btree (chapter_id, approval_status);


--
-- Name: idx_studentprofile_memberid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studentprofile_memberid ON public.student_profile USING btree (member_id);


--
-- Name: idx_studentprofile_recruiter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studentprofile_recruiter ON public.student_profile USING btree (is_recruiter_visible, approval_status);


--
-- Name: pathway_check_in_user_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pathway_check_in_user_unique ON public.pathway_check_in USING btree (user_id);


--
-- Name: pathway_feature_flag_chapter_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pathway_feature_flag_chapter_lookup ON public.pathway_feature_flag USING btree (chapter_id);


--
-- Name: pathway_feature_flag_chapter_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pathway_feature_flag_chapter_unique ON public.pathway_feature_flag USING btree (chapter_id) WHERE (chapter_id IS NOT NULL);


--
-- Name: pathway_feature_flag_global_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pathway_feature_flag_global_unique ON public.pathway_feature_flag USING btree (((chapter_id IS NULL))) WHERE (chapter_id IS NULL);


--
-- Name: pathway_recommendation_check_in_category_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pathway_recommendation_check_in_category_unique ON public.pathway_recommendation USING btree (check_in_id, category);


--
-- Name: recruiter_access_active_email_company_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX recruiter_access_active_email_company_idx ON public.recruiter_access USING btree (recruiter_email, company_id) WHERE (revoked_at IS NULL);


--
-- Name: unique_active_recruiter_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_active_recruiter_email ON public.recruiter_access USING btree (recruiter_email) WHERE ((is_active = true) AND (revoked_at IS NULL));


--
-- Name: unique_active_recruiter_email_per_company; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_active_recruiter_email_per_company ON public.recruiter_access USING btree (company_id, recruiter_email) WHERE ((is_active = true) AND (revoked_at IS NULL));


--
-- Name: published_event_listing _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.published_event_listing AS
 SELECT e.id,
    e.title,
    e.description,
    e.cover_image,
    e.start_at,
    e.end_at,
    e.location,
    e.meeting_url,
    e.event_type,
    e.capacity,
    e.is_published,
    e.access_model,
    e.application_form_url,
    e.chapter_id,
    e.created_by_id,
    e.created_at,
    e.updated_at,
    e.location_name,
    e.location_address,
    e.location_city,
    e.location_region,
    e.location_latitude,
    e.location_longitude,
    c.name AS chapter_name,
    c.university AS chapter_university,
    c.city AS chapter_city,
    c.region AS chapter_region,
    (count(er.id))::integer AS registrations_count
   FROM ((public.event e
     LEFT JOIN public.chapter c ON ((c.id = e.chapter_id)))
     LEFT JOIN public.event_registration er ON (((er.event_id = e.id) AND (er.status = 'registered'::text))))
  WHERE (e.is_published = true)
  GROUP BY e.id, c.id;


--
-- Name: user welcome_email_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER welcome_email_trigger AFTER INSERT ON public."user" FOR EACH ROW EXECUTE FUNCTION public.call_welcome_email_function();


--
-- Name: chapter_activation_interest chapter_activation_interest_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_activation_interest
    ADD CONSTRAINT chapter_activation_interest_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: chapter_audit_log chapter_audit_log_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_audit_log
    ADD CONSTRAINT chapter_audit_log_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: chapter_audit_log chapter_audit_log_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_audit_log
    ADD CONSTRAINT chapter_audit_log_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapter(id) ON DELETE SET NULL;


--
-- Name: chapter_audit_log chapter_audit_log_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_audit_log
    ADD CONSTRAINT chapter_audit_log_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: chapter_invite chapter_invite_accepted_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_invite
    ADD CONSTRAINT chapter_invite_accepted_by_user_id_fkey FOREIGN KEY (accepted_by_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: chapter_invite chapter_invite_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_invite
    ADD CONSTRAINT chapter_invite_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapter(id) ON DELETE CASCADE;


--
-- Name: chapter_invite chapter_invite_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_invite
    ADD CONSTRAINT chapter_invite_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: chapter_invite chapter_invite_replaced_by_invite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_invite
    ADD CONSTRAINT chapter_invite_replaced_by_invite_id_fkey FOREIGN KEY (replaced_by_invite_id) REFERENCES public.chapter_invite(id) ON DELETE SET NULL;


--
-- Name: chapter_invite chapter_invite_revoked_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_invite
    ADD CONSTRAINT chapter_invite_revoked_by_user_id_fkey FOREIGN KEY (revoked_by_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: chapter_permission_grant chapter_permission_grant_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_permission_grant
    ADD CONSTRAINT chapter_permission_grant_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapter(id) ON DELETE CASCADE;


--
-- Name: chapter_permission_grant chapter_permission_grant_granted_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_permission_grant
    ADD CONSTRAINT chapter_permission_grant_granted_by_id_fkey FOREIGN KEY (granted_by_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: chapter_permission_grant chapter_permission_grant_revoked_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_permission_grant
    ADD CONSTRAINT chapter_permission_grant_revoked_by_id_fkey FOREIGN KEY (revoked_by_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: chapter_permission_grant chapter_permission_grant_source_role_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_permission_grant
    ADD CONSTRAINT chapter_permission_grant_source_role_assignment_id_fkey FOREIGN KEY (source_role_assignment_id) REFERENCES public.chapter_role_assignment(id) ON DELETE SET NULL;


--
-- Name: chapter_permission_grant chapter_permission_grant_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_permission_grant
    ADD CONSTRAINT chapter_permission_grant_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: chapter_preapproval chapter_preapproval_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_preapproval
    ADD CONSTRAINT chapter_preapproval_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapter(id) ON DELETE CASCADE;


--
-- Name: chapter_preapproval chapter_preapproval_consumed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_preapproval
    ADD CONSTRAINT chapter_preapproval_consumed_by_user_id_fkey FOREIGN KEY (consumed_by_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: chapter_preapproval chapter_preapproval_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_preapproval
    ADD CONSTRAINT chapter_preapproval_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: chapter_preapproval chapter_preapproval_revoked_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_preapproval
    ADD CONSTRAINT chapter_preapproval_revoked_by_id_fkey FOREIGN KEY (revoked_by_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: chapter_role_assignment chapter_role_assignment_assigned_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_role_assignment
    ADD CONSTRAINT chapter_role_assignment_assigned_by_id_fkey FOREIGN KEY (assigned_by_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: chapter_role_assignment chapter_role_assignment_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_role_assignment
    ADD CONSTRAINT chapter_role_assignment_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapter(id) ON DELETE CASCADE;


--
-- Name: chapter_role_assignment chapter_role_assignment_source_chapter_invite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_role_assignment
    ADD CONSTRAINT chapter_role_assignment_source_chapter_invite_id_fkey FOREIGN KEY (source_chapter_invite_id) REFERENCES public.chapter_invite(id) ON DELETE SET NULL;


--
-- Name: chapter_role_assignment chapter_role_assignment_source_preapproval_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_role_assignment
    ADD CONSTRAINT chapter_role_assignment_source_preapproval_id_fkey FOREIGN KEY (source_preapproval_id) REFERENCES public.chapter_preapproval(id) ON DELETE SET NULL;


--
-- Name: chapter_role_assignment chapter_role_assignment_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_role_assignment
    ADD CONSTRAINT chapter_role_assignment_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: company company_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public."user"(id);


--
-- Name: event_chapter event_chapter_added_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_chapter
    ADD CONSTRAINT event_chapter_added_by_id_fkey FOREIGN KEY (added_by_id) REFERENCES public."user"(id);


--
-- Name: event_chapter event_chapter_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_chapter
    ADD CONSTRAINT event_chapter_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapter(id) ON DELETE CASCADE;


--
-- Name: event_chapter event_chapter_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_chapter
    ADD CONSTRAINT event_chapter_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(id) ON DELETE CASCADE;


--
-- Name: event event_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapter(id);


--
-- Name: event event_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public."user"(id);


--
-- Name: event_pathway_metadata event_pathway_metadata_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_pathway_metadata
    ADD CONSTRAINT event_pathway_metadata_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: event_pathway_metadata event_pathway_metadata_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_pathway_metadata
    ADD CONSTRAINT event_pathway_metadata_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(id) ON DELETE CASCADE;


--
-- Name: event_pathway_metadata event_pathway_metadata_updated_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_pathway_metadata
    ADD CONSTRAINT event_pathway_metadata_updated_by_id_fkey FOREIGN KEY (updated_by_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: event_registration event_registration_checked_in_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registration
    ADD CONSTRAINT event_registration_checked_in_by_id_fkey FOREIGN KEY (checked_in_by_id) REFERENCES public."user"(id);


--
-- Name: event_registration event_registration_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registration
    ADD CONSTRAINT event_registration_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(id) ON DELETE CASCADE;


--
-- Name: event_registration event_registration_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registration
    ADD CONSTRAINT event_registration_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: chapter_membership fk_chapter_membership_approved_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_membership
    ADD CONSTRAINT fk_chapter_membership_approved_by FOREIGN KEY (approved_by_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: chapter_membership fk_chapter_membership_chapter; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_membership
    ADD CONSTRAINT fk_chapter_membership_chapter FOREIGN KEY (chapter_id) REFERENCES public.chapter(id) ON DELETE CASCADE;


--
-- Name: chapter_membership fk_chapter_membership_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapter_membership
    ADD CONSTRAINT fk_chapter_membership_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: event_application_answer fk_event_application_answer_question; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_application_answer
    ADD CONSTRAINT fk_event_application_answer_question FOREIGN KEY (question_id) REFERENCES public.event_application_question(id) ON DELETE CASCADE;


--
-- Name: event_application_answer fk_event_application_answer_registration; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_application_answer
    ADD CONSTRAINT fk_event_application_answer_registration FOREIGN KEY (registration_id) REFERENCES public.event_registration(id) ON DELETE CASCADE;


--
-- Name: event_application_question fk_event_application_question_event; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_application_question
    ADD CONSTRAINT fk_event_application_question_event FOREIGN KEY (event_id) REFERENCES public.event(id) ON DELETE CASCADE;


--
-- Name: lead_identity fk_lead_identity_chapter; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_identity
    ADD CONSTRAINT fk_lead_identity_chapter FOREIGN KEY (chapter_id) REFERENCES public.chapter(id) ON DELETE SET NULL;


--
-- Name: lead_identity fk_lead_identity_issued_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_identity
    ADD CONSTRAINT fk_lead_identity_issued_by FOREIGN KEY (issued_by_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: lead_identity fk_lead_identity_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_identity
    ADD CONSTRAINT fk_lead_identity_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: newsletter_subscription fk_newsletter_subscription_chapter; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscription
    ADD CONSTRAINT fk_newsletter_subscription_chapter FOREIGN KEY (chapter_id) REFERENCES public.chapter(id) ON DELETE SET NULL;


--
-- Name: newsletter_subscription fk_newsletter_subscription_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscription
    ADD CONSTRAINT fk_newsletter_subscription_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: person_profile fk_person_profile_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_profile
    ADD CONSTRAINT fk_person_profile_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: funding_request_budget_item funding_request_budget_item_funding_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funding_request_budget_item
    ADD CONSTRAINT funding_request_budget_item_funding_request_id_fkey FOREIGN KEY (funding_request_id) REFERENCES public.funding_request(id) ON DELETE CASCADE;


--
-- Name: funding_request funding_request_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funding_request
    ADD CONSTRAINT funding_request_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapter(id) ON DELETE CASCADE;


--
-- Name: funding_request funding_request_closed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funding_request
    ADD CONSTRAINT funding_request_closed_by_id_fkey FOREIGN KEY (closed_by_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: funding_request funding_request_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funding_request
    ADD CONSTRAINT funding_request_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(id) ON DELETE SET NULL;


--
-- Name: funding_request_file funding_request_file_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funding_request_file
    ADD CONSTRAINT funding_request_file_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapter(id) ON DELETE CASCADE;


--
-- Name: funding_request_file funding_request_file_funding_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funding_request_file
    ADD CONSTRAINT funding_request_file_funding_request_id_fkey FOREIGN KEY (funding_request_id) REFERENCES public.funding_request(id) ON DELETE CASCADE;


--
-- Name: funding_request_file funding_request_file_uploaded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funding_request_file
    ADD CONSTRAINT funding_request_file_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: funding_request funding_request_requester_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funding_request
    ADD CONSTRAINT funding_request_requester_user_id_fkey FOREIGN KEY (requester_user_id) REFERENCES public."user"(id);


--
-- Name: funding_request funding_request_reviewed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funding_request
    ADD CONSTRAINT funding_request_reviewed_by_id_fkey FOREIGN KEY (reviewed_by_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: funding_request_status_event funding_request_status_event_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funding_request_status_event
    ADD CONSTRAINT funding_request_status_event_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: funding_request_status_event funding_request_status_event_funding_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funding_request_status_event
    ADD CONSTRAINT funding_request_status_event_funding_request_id_fkey FOREIGN KEY (funding_request_id) REFERENCES public.funding_request(id) ON DELETE CASCADE;


--
-- Name: growth_reflection growth_reflection_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_reflection
    ADD CONSTRAINT growth_reflection_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(id) ON DELETE SET NULL;


--
-- Name: growth_reflection growth_reflection_recommendation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_reflection
    ADD CONSTRAINT growth_reflection_recommendation_id_fkey FOREIGN KEY (recommendation_id) REFERENCES public.pathway_recommendation(id) ON DELETE SET NULL;


--
-- Name: growth_reflection growth_reflection_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_reflection
    ADD CONSTRAINT growth_reflection_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: pathway_check_in pathway_check_in_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pathway_check_in
    ADD CONSTRAINT pathway_check_in_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapter(id) ON DELETE SET NULL;


--
-- Name: pathway_check_in pathway_check_in_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pathway_check_in
    ADD CONSTRAINT pathway_check_in_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: pathway_feature_flag pathway_feature_flag_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pathway_feature_flag
    ADD CONSTRAINT pathway_feature_flag_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapter(id) ON DELETE CASCADE;


--
-- Name: pathway_feature_flag pathway_feature_flag_updated_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pathway_feature_flag
    ADD CONSTRAINT pathway_feature_flag_updated_by_id_fkey FOREIGN KEY (updated_by_id) REFERENCES public."user"(id);


--
-- Name: pathway_recommendation pathway_recommendation_check_in_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pathway_recommendation
    ADD CONSTRAINT pathway_recommendation_check_in_id_fkey FOREIGN KEY (check_in_id) REFERENCES public.pathway_check_in(id) ON DELETE CASCADE;


--
-- Name: pathway_recommendation pathway_recommendation_source_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pathway_recommendation
    ADD CONSTRAINT pathway_recommendation_source_event_id_fkey FOREIGN KEY (source_event_id) REFERENCES public.event(id) ON DELETE SET NULL;


--
-- Name: pathway_recommendation pathway_recommendation_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pathway_recommendation
    ADD CONSTRAINT pathway_recommendation_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: recruiter_access recruiter_access_accepted_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_access
    ADD CONSTRAINT recruiter_access_accepted_by_user_id_fkey FOREIGN KEY (accepted_by_user_id) REFERENCES public."user"(id);


--
-- Name: recruiter_access recruiter_access_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_access
    ADD CONSTRAINT recruiter_access_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON DELETE CASCADE;


--
-- Name: recruiter_access recruiter_access_granted_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_access
    ADD CONSTRAINT recruiter_access_granted_by_id_fkey FOREIGN KEY (granted_by_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: recruiter_access recruiter_access_revoked_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_access
    ADD CONSTRAINT recruiter_access_revoked_by_id_fkey FOREIGN KEY (revoked_by_id) REFERENCES public."user"(id);


--
-- Name: resume_download_log resume_download_log_recruiter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_download_log
    ADD CONSTRAINT resume_download_log_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public."user"(id);


--
-- Name: resume_download_log resume_download_log_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_download_log
    ADD CONSTRAINT resume_download_log_student_id_fkey FOREIGN KEY (student_id) REFERENCES public."user"(id);


--
-- Name: resume resume_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume
    ADD CONSTRAINT resume_student_id_fkey FOREIGN KEY (student_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: saved_student saved_student_recruiter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_student
    ADD CONSTRAINT saved_student_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public."user"(id);


--
-- Name: saved_student saved_student_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_student
    ADD CONSTRAINT saved_student_student_id_fkey FOREIGN KEY (student_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: student_profile student_profile_approved_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_profile
    ADD CONSTRAINT student_profile_approved_by_id_fkey FOREIGN KEY (approved_by_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: student_profile student_profile_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_profile
    ADD CONSTRAINT student_profile_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapter(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: student_profile student_profile_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_profile
    ADD CONSTRAINT student_profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: newsletter_subscription Admins can manage all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all subscriptions" ON public.newsletter_subscription USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: lead_identity Admins can manage identities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage identities" ON public.lead_identity USING ((((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR ((auth.jwt() ->> 'role'::text) = 'authenticated'::text)));


--
-- Name: person_profile Authenticated users can read profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read profiles" ON public.person_profile FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: event_application_question Editors can manage event questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors can manage event questions" ON public.event_application_question USING ((public.is_admin() OR public.is_event_editor(event_id))) WITH CHECK ((public.is_admin() OR public.is_event_editor(event_id)));


--
-- Name: event_application_answer Editors can read event answers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors can read event answers" ON public.event_application_answer FOR SELECT USING ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.event_registration er
  WHERE ((er.id = event_application_answer.registration_id) AND (public.can_access_event_with_permission(er.event_id, 'chapter.events.view_registrations'::text) OR public.can_access_event_with_permission(er.event_id, 'chapter.events.manage'::text)))))));


--
-- Name: event_application_question Public can read event questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read event questions" ON public.event_application_question FOR SELECT USING (true);


--
-- Name: person_profile Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.person_profile USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: event_application_answer User can read own answers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User can read own answers" ON public.event_application_answer FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.event_registration er
  WHERE ((er.id = event_application_answer.registration_id) AND (er.user_id = auth.uid())))) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text)));


--
-- Name: event_application_answer User can submit own answers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User can submit own answers" ON public.event_application_answer FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.event_registration er
  WHERE ((er.id = event_application_answer.registration_id) AND (er.user_id = auth.uid())))));


--
-- Name: event_application_answer User can update own answers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User can update own answers" ON public.event_application_answer FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM public.event_registration er
  WHERE ((er.id = event_application_answer.registration_id) AND (er.user_id = auth.uid())))) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text)));


--
-- Name: person_profile Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.person_profile FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: newsletter_subscription Users can manage own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own subscriptions" ON public.newsletter_subscription USING ((auth.uid() = user_id));


--
-- Name: lead_identity Users can read own identity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own identity" ON public.lead_identity FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: person_profile Users can read own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own profile" ON public.person_profile FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: newsletter_subscription Users can read own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own subscriptions" ON public.newsletter_subscription FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: lead_identity Users can update own identity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own identity" ON public.lead_identity FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: person_profile Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.person_profile FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: chapter; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chapter ENABLE ROW LEVEL SECURITY;

--
-- Name: chapter_activation_interest; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chapter_activation_interest ENABLE ROW LEVEL SECURITY;

--
-- Name: chapter_activation_interest chapter_activation_interest_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_activation_interest_admin_all ON public.chapter_activation_interest USING ((EXISTS ( SELECT 1
   FROM public."user" u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::public."Role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public."user" u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::public."Role")))));


--
-- Name: chapter_activation_interest chapter_activation_interest_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_activation_interest_insert_own ON public.chapter_activation_interest FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: chapter_activation_interest chapter_activation_interest_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_activation_interest_select_own ON public.chapter_activation_interest FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: chapter chapter_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_admin_all ON public.chapter USING ((EXISTS ( SELECT 1
   FROM public."user"
  WHERE (("user".id = auth.uid()) AND ("user".role = 'admin'::public."Role")))));


--
-- Name: chapter_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chapter_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: chapter_audit_log chapter_audit_log_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_audit_log_admin_all ON public.chapter_audit_log TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: chapter_audit_log chapter_audit_log_insert_event_deleted; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_audit_log_insert_event_deleted ON public.chapter_audit_log FOR INSERT TO authenticated WITH CHECK (((actor_user_id = auth.uid()) AND (action = 'chapter.event.deleted'::text) AND (entity_type = 'event'::text) AND public.has_chapter_permission(chapter_id, 'chapter.events.archive'::text)));


--
-- Name: chapter_audit_log chapter_audit_log_insert_member_revoke; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_audit_log_insert_member_revoke ON public.chapter_audit_log FOR INSERT TO authenticated WITH CHECK (((actor_user_id = auth.uid()) AND (action = 'chapter.membership.revoked'::text) AND (entity_type = 'chapter_membership'::text) AND public.has_chapter_permission(chapter_id, 'chapter.members.revoke'::text)));


--
-- Name: chapter_audit_log chapter_audit_log_insert_role_assignment; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_audit_log_insert_role_assignment ON public.chapter_audit_log FOR INSERT TO authenticated WITH CHECK (((actor_user_id = auth.uid()) AND (action = ANY (ARRAY['chapter.role.assigned'::text, 'chapter.role.deactivated'::text])) AND (entity_type = 'chapter_role_assignment'::text) AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard'::text)));


--
-- Name: chapter_invite; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chapter_invite ENABLE ROW LEVEL SECURITY;

--
-- Name: chapter_invite chapter_invite_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_invite_admin_all ON public.chapter_invite TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: chapter_invite chapter_invite_operator_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_invite_operator_select ON public.chapter_invite FOR SELECT TO authenticated USING (public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard'::text));


--
-- Name: chapter_membership; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chapter_membership ENABLE ROW LEVEL SECURITY;

--
-- Name: chapter_membership chapter_membership_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_membership_admin_all ON public.chapter_membership TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: chapter_membership chapter_membership_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_membership_insert_own ON public.chapter_membership FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: chapter_membership chapter_membership_select_company_visible; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_membership_select_company_visible ON public.chapter_membership FOR SELECT USING (((status = 'approved'::public.membership_status) AND (EXISTS ( SELECT 1
   FROM public.person_profile pp
  WHERE ((pp.user_id = chapter_membership.user_id) AND (pp.is_recruiter_visible = true)))) AND (EXISTS ( SELECT 1
   FROM public.recruiter_access ra
  WHERE ((ra.accepted_by_user_id = auth.uid()) AND (ra.is_active = true) AND (ra.revoked_at IS NULL) AND ((ra.invite_expires_at IS NULL) OR (ra.invite_expires_at > now())))))));


--
-- Name: chapter_membership chapter_membership_select_editor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_membership_select_editor ON public.chapter_membership FOR SELECT TO authenticated USING (public.is_chapter_editor(chapter_id));


--
-- Name: chapter_membership chapter_membership_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_membership_select_own ON public.chapter_membership FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: chapter_membership chapter_membership_select_permissioned_viewers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_membership_select_permissioned_viewers ON public.chapter_membership FOR SELECT TO authenticated USING ((((status = 'approved'::public.membership_status) AND public.has_chapter_permission(chapter_id, 'chapter.members.view_approved'::text)) OR ((status = 'alumni'::public.membership_status) AND public.has_chapter_permission(chapter_id, 'chapter.members.view_alumni'::text)) OR ((status = 'pending'::public.membership_status) AND public.has_chapter_permission(chapter_id, 'chapter.members.view_applicants'::text)) OR ((status = 'rejected'::public.membership_status) AND public.has_chapter_permission(chapter_id, 'chapter.members.view_rejected'::text)) OR ((status = 'inactive'::public.membership_status) AND public.has_chapter_permission(chapter_id, 'chapter.members.view_inactive'::text))));


--
-- Name: chapter_membership chapter_membership_update_editor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_membership_update_editor ON public.chapter_membership FOR UPDATE TO authenticated USING (public.is_chapter_editor(chapter_id)) WITH CHECK (public.is_chapter_editor(chapter_id));


--
-- Name: chapter_membership chapter_membership_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_membership_update_own ON public.chapter_membership FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: chapter_membership chapter_membership_update_permissioned_managers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_membership_update_permissioned_managers ON public.chapter_membership FOR UPDATE TO authenticated USING ((((status = 'pending'::public.membership_status) AND public.has_chapter_permission(chapter_id, 'chapter.members.manage_applications'::text)) OR ((status = 'approved'::public.membership_status) AND public.has_chapter_permission(chapter_id, 'chapter.members.revoke'::text)))) WITH CHECK ((((status = ANY (ARRAY['approved'::public.membership_status, 'rejected'::public.membership_status])) AND public.has_chapter_permission(chapter_id, 'chapter.members.manage_applications'::text)) OR ((status = 'inactive'::public.membership_status) AND public.has_chapter_permission(chapter_id, 'chapter.members.revoke'::text))));


--
-- Name: chapter_permission_grant; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chapter_permission_grant ENABLE ROW LEVEL SECURITY;

--
-- Name: chapter_permission_grant chapter_permission_grant_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_permission_grant_admin_all ON public.chapter_permission_grant TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: chapter_permission_grant chapter_permission_grant_insert_role_template_assigner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_permission_grant_insert_role_template_assigner ON public.chapter_permission_grant FOR INSERT TO authenticated WITH CHECK (((source = 'role_template'::text) AND (granted_by_id = auth.uid()) AND (revoked_at IS NULL) AND (revoked_by_id IS NULL) AND (revoke_reason IS NULL) AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard'::text) AND (EXISTS ( SELECT 1
   FROM public.chapter_role_assignment cra
  WHERE ((cra.id = chapter_permission_grant.source_role_assignment_id) AND (cra.user_id = chapter_permission_grant.user_id) AND (cra.chapter_id = chapter_permission_grant.chapter_id) AND (cra.assigned_by_id = auth.uid()) AND (cra.status = 'active'::text) AND (cra.role_level = ANY (ARRAY['chief_of_staff'::text, 'director'::text, 'coordinator'::text])))))));


--
-- Name: chapter_permission_grant chapter_permission_grant_select_own_approved_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_permission_grant_select_own_approved_member ON public.chapter_permission_grant FOR SELECT TO authenticated USING (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.chapter_membership cm
  WHERE ((cm.user_id = auth.uid()) AND (cm.chapter_id = chapter_permission_grant.chapter_id) AND (cm.status = 'approved'::public.membership_status))))));


--
-- Name: chapter_permission_grant chapter_permission_grant_select_role_assigner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_permission_grant_select_role_assigner ON public.chapter_permission_grant FOR SELECT TO authenticated USING (public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard'::text));


--
-- Name: chapter_permission_grant chapter_permission_grant_update_role_template_assigner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_permission_grant_update_role_template_assigner ON public.chapter_permission_grant FOR UPDATE TO authenticated USING (((source = 'role_template'::text) AND (revoked_at IS NULL) AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard'::text) AND (EXISTS ( SELECT 1
   FROM public.chapter_role_assignment cra
  WHERE ((cra.id = chapter_permission_grant.source_role_assignment_id) AND (cra.user_id = chapter_permission_grant.user_id) AND (cra.chapter_id = chapter_permission_grant.chapter_id) AND (cra.role_level = ANY (ARRAY['chief_of_staff'::text, 'director'::text, 'coordinator'::text]))))))) WITH CHECK (((source = 'role_template'::text) AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard'::text) AND (EXISTS ( SELECT 1
   FROM public.chapter_role_assignment cra
  WHERE ((cra.id = chapter_permission_grant.source_role_assignment_id) AND (cra.user_id = chapter_permission_grant.user_id) AND (cra.chapter_id = chapter_permission_grant.chapter_id) AND (cra.role_level = ANY (ARRAY['chief_of_staff'::text, 'director'::text, 'coordinator'::text])))))));


--
-- Name: chapter_preapproval; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chapter_preapproval ENABLE ROW LEVEL SECURITY;

--
-- Name: chapter_preapproval chapter_preapproval_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_preapproval_admin_all ON public.chapter_preapproval TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: chapter chapter_read_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_read_all ON public.chapter FOR SELECT USING (true);


--
-- Name: chapter_role_assignment; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chapter_role_assignment ENABLE ROW LEVEL SECURITY;

--
-- Name: chapter_role_assignment chapter_role_assignment_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_role_assignment_admin_all ON public.chapter_role_assignment TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: chapter_role_assignment chapter_role_assignment_insert_regular_eboard; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_role_assignment_insert_regular_eboard ON public.chapter_role_assignment FOR INSERT TO authenticated WITH CHECK (((assigned_by_id = auth.uid()) AND (source = 'manual'::text) AND (status = 'active'::text) AND (role_level = ANY (ARRAY['chief_of_staff'::text, 'director'::text, 'coordinator'::text])) AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard'::text)));


--
-- Name: chapter_role_assignment chapter_role_assignment_select_chapter_operators; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_role_assignment_select_chapter_operators ON public.chapter_role_assignment FOR SELECT TO authenticated USING ((public.has_chapter_permission(chapter_id, 'chapter.members.view_approved'::text) OR public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard'::text)));


--
-- Name: chapter_role_assignment chapter_role_assignment_update_regular_eboard; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_role_assignment_update_regular_eboard ON public.chapter_role_assignment FOR UPDATE TO authenticated USING (((role_level = ANY (ARRAY['chief_of_staff'::text, 'director'::text, 'coordinator'::text])) AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard'::text))) WITH CHECK (((role_level = ANY (ARRAY['chief_of_staff'::text, 'director'::text, 'coordinator'::text])) AND public.has_chapter_permission(chapter_id, 'chapter.roles.assign_eboard'::text)));


--
-- Name: company; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.company ENABLE ROW LEVEL SECURITY;

--
-- Name: company company_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY company_admin_all ON public.company USING ((EXISTS ( SELECT 1
   FROM public."user"
  WHERE (("user".id = auth.uid()) AND ("user".role = 'admin'::public."Role")))));


--
-- Name: company company_read_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY company_read_all ON public.company FOR SELECT USING (true);


--
-- Name: event; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event ENABLE ROW LEVEL SECURITY;

--
-- Name: event_application_answer; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_application_answer ENABLE ROW LEVEL SECURITY;

--
-- Name: event_application_answer event_application_answer_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_application_answer_admin_all ON public.event_application_answer TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: event_application_answer event_application_answer_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_application_answer_insert_own ON public.event_application_answer FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.event_registration er
  WHERE ((er.id = event_application_answer.registration_id) AND (er.user_id = auth.uid())))));


--
-- Name: event_application_answer event_application_answer_select_editor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_application_answer_select_editor ON public.event_application_answer FOR SELECT TO authenticated USING (public.is_chapter_editor(public.get_question_chapter_id(question_id)));


--
-- Name: event_application_answer event_application_answer_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_application_answer_select_own ON public.event_application_answer FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.event_registration er
  WHERE ((er.id = event_application_answer.registration_id) AND (er.user_id = auth.uid())))));


--
-- Name: event_application_answer event_application_answer_update_editor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_application_answer_update_editor ON public.event_application_answer FOR UPDATE TO authenticated USING (public.is_chapter_editor(public.get_question_chapter_id(question_id))) WITH CHECK (public.is_chapter_editor(public.get_question_chapter_id(question_id)));


--
-- Name: event_application_answer event_application_answer_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_application_answer_update_own ON public.event_application_answer FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.event_registration er
  WHERE ((er.id = event_application_answer.registration_id) AND (er.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.event_registration er
  WHERE ((er.id = event_application_answer.registration_id) AND (er.user_id = auth.uid())))));


--
-- Name: event_application_question; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_application_question ENABLE ROW LEVEL SECURITY;

--
-- Name: event_application_question event_application_question_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_application_question_admin_all ON public.event_application_question TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: event_application_question event_application_question_editor_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_application_question_editor_all ON public.event_application_question TO authenticated USING (public.is_chapter_editor(public.get_event_chapter_id(event_id))) WITH CHECK (public.is_chapter_editor(public.get_event_chapter_id(event_id)));


--
-- Name: event_application_question event_application_question_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_application_question_select_all ON public.event_application_question FOR SELECT TO authenticated USING (true);


--
-- Name: event_chapter; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_chapter ENABLE ROW LEVEL SECURITY;

--
-- Name: event_chapter event_chapter_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_chapter_delete_own ON public.event_chapter FOR DELETE USING (public.can_access_event_with_permission(event_id, 'chapter.events.manage'::text));


--
-- Name: event_chapter event_chapter_insert_manage_event; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_chapter_insert_manage_event ON public.event_chapter FOR INSERT WITH CHECK (public.can_access_event_with_permission(event_id, 'chapter.events.manage'::text));


--
-- Name: event_chapter event_chapter_read_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_chapter_read_all ON public.event_chapter FOR SELECT USING (true);


--
-- Name: event_pathway_metadata; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_pathway_metadata ENABLE ROW LEVEL SECURITY;

--
-- Name: event_pathway_metadata event_pathway_metadata_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_pathway_metadata_admin_all ON public.event_pathway_metadata TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: event_pathway_metadata event_pathway_metadata_editor_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_pathway_metadata_editor_delete ON public.event_pathway_metadata FOR DELETE TO authenticated USING (public.is_event_editor(event_id));


--
-- Name: event_pathway_metadata event_pathway_metadata_editor_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_pathway_metadata_editor_insert ON public.event_pathway_metadata FOR INSERT TO authenticated WITH CHECK ((public.is_event_editor(event_id) AND (created_by_id = auth.uid()) AND (updated_by_id = auth.uid())));


--
-- Name: event_pathway_metadata event_pathway_metadata_editor_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_pathway_metadata_editor_select ON public.event_pathway_metadata FOR SELECT TO authenticated USING (public.is_event_editor(event_id));


--
-- Name: event_pathway_metadata event_pathway_metadata_editor_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_pathway_metadata_editor_update ON public.event_pathway_metadata FOR UPDATE TO authenticated USING (public.is_event_editor(event_id)) WITH CHECK ((public.is_event_editor(event_id) AND (updated_by_id = auth.uid())));


--
-- Name: event_pathway_metadata event_pathway_metadata_published_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_pathway_metadata_published_select ON public.event_pathway_metadata FOR SELECT TO authenticated USING (((is_pathway_eligible = true) AND (EXISTS ( SELECT 1
   FROM public.event e
  WHERE ((e.id = event_pathway_metadata.event_id) AND (e.is_published = true))))));


--
-- Name: event_pathway_metadata event_pathway_metadata_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_pathway_metadata_service_all ON public.event_pathway_metadata TO service_role USING (true) WITH CHECK (true);


--
-- Name: event_registration; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_registration ENABLE ROW LEVEL SECURITY;

--
-- Name: event_registration event_registration_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_registration_insert_own ON public.event_registration FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: event_registration event_registration_read_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_registration_read_admin ON public.event_registration FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public."user"
  WHERE (("user".id = auth.uid()) AND ("user".role = 'admin'::public."Role")))));


--
-- Name: event_registration event_registration_read_editor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_registration_read_editor ON public.event_registration FOR SELECT USING ((public.can_access_event_with_permission(event_id, 'chapter.events.view_registrations'::text) OR public.can_access_event_with_permission(event_id, 'chapter.events.check_in'::text) OR public.can_access_event_with_permission(event_id, 'chapter.events.manage'::text)));


--
-- Name: event_registration event_registration_read_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_registration_read_own ON public.event_registration FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: event_registration event_registration_update_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_registration_update_admin ON public.event_registration FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public."user"
  WHERE (("user".id = auth.uid()) AND ("user".role = 'admin'::public."Role")))));


--
-- Name: event_registration event_registration_update_editor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_registration_update_editor ON public.event_registration FOR UPDATE USING ((public.can_access_event_with_permission(event_id, 'chapter.events.check_in'::text) OR public.can_access_event_with_permission(event_id, 'chapter.events.manage'::text))) WITH CHECK ((public.can_access_event_with_permission(event_id, 'chapter.events.check_in'::text) OR public.can_access_event_with_permission(event_id, 'chapter.events.manage'::text)));


--
-- Name: event_registration event_registration_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_registration_update_own ON public.event_registration FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: event events_delete_own_or_collaborative; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_delete_own_or_collaborative ON public.event FOR DELETE USING (public.can_access_event_with_permission(id, 'chapter.events.archive'::text));


--
-- Name: event events_insert_own_chapter; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_insert_own_chapter ON public.event FOR INSERT WITH CHECK (public.has_chapter_permission(chapter_id, 'chapter.events.manage'::text));


--
-- Name: event events_read_own_chapter; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_read_own_chapter ON public.event FOR SELECT USING ((public.can_access_event_with_permission(id, 'chapter.events.manage'::text) OR public.can_access_event_with_permission(id, 'chapter.events.view_registrations'::text) OR public.can_access_event_with_permission(id, 'chapter.events.check_in'::text) OR public.can_access_event_with_permission(id, 'chapter.events.archive'::text)));


--
-- Name: event events_read_permissioned_chapter_direct; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_read_permissioned_chapter_direct ON public.event FOR SELECT USING ((public.has_chapter_permission(chapter_id, 'chapter.events.manage'::text) OR public.has_chapter_permission(chapter_id, 'chapter.events.view_registrations'::text) OR public.has_chapter_permission(chapter_id, 'chapter.events.check_in'::text) OR public.has_chapter_permission(chapter_id, 'chapter.events.archive'::text)));


--
-- Name: event events_read_published; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_read_published ON public.event FOR SELECT USING ((is_published = true));


--
-- Name: event events_update_own_or_collaborative; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_update_own_or_collaborative ON public.event FOR UPDATE USING (public.can_access_event_with_permission(id, 'chapter.events.manage'::text)) WITH CHECK (public.can_access_event_with_permission(id, 'chapter.events.manage'::text));


--
-- Name: funding_request_budget_item funding_budget_item_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funding_budget_item_admin_all ON public.funding_request_budget_item TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: funding_request_budget_item funding_budget_item_chapter_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funding_budget_item_chapter_delete ON public.funding_request_budget_item FOR DELETE TO authenticated USING (public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'::text));


--
-- Name: funding_request_budget_item funding_budget_item_chapter_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funding_budget_item_chapter_insert ON public.funding_request_budget_item FOR INSERT TO authenticated WITH CHECK (public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'::text));


--
-- Name: funding_request_budget_item funding_budget_item_chapter_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funding_budget_item_chapter_select ON public.funding_request_budget_item FOR SELECT TO authenticated USING (public.can_access_funding_request(funding_request_id, 'chapter.funding.view'::text));


--
-- Name: funding_request_budget_item funding_budget_item_chapter_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funding_budget_item_chapter_update ON public.funding_request_budget_item FOR UPDATE TO authenticated USING (public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'::text)) WITH CHECK (public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'::text));


--
-- Name: funding_request_file funding_file_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funding_file_admin_all ON public.funding_request_file TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: funding_request_file funding_file_chapter_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funding_file_chapter_delete ON public.funding_request_file FOR DELETE TO authenticated USING (public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'::text));


--
-- Name: funding_request_file funding_file_chapter_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funding_file_chapter_insert ON public.funding_request_file FOR INSERT TO authenticated WITH CHECK (((uploaded_by_id = auth.uid()) AND public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'::text) AND (EXISTS ( SELECT 1
   FROM public.funding_request fr
  WHERE ((fr.id = funding_request_file.funding_request_id) AND (fr.chapter_id = funding_request_file.chapter_id))))));


--
-- Name: funding_request_file funding_file_chapter_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funding_file_chapter_select ON public.funding_request_file FOR SELECT TO authenticated USING ((public.can_access_funding_request(funding_request_id, 'chapter.funding.view'::text) AND (EXISTS ( SELECT 1
   FROM public.funding_request fr
  WHERE ((fr.id = funding_request_file.funding_request_id) AND (fr.chapter_id = funding_request_file.chapter_id))))));


--
-- Name: funding_request_file funding_file_chapter_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funding_file_chapter_update ON public.funding_request_file FOR UPDATE TO authenticated USING (public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'::text)) WITH CHECK ((public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'::text) AND (EXISTS ( SELECT 1
   FROM public.funding_request fr
  WHERE ((fr.id = funding_request_file.funding_request_id) AND (fr.chapter_id = funding_request_file.chapter_id))))));


--
-- Name: funding_request; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.funding_request ENABLE ROW LEVEL SECURITY;

--
-- Name: funding_request funding_request_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funding_request_admin_all ON public.funding_request TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: funding_request_budget_item; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.funding_request_budget_item ENABLE ROW LEVEL SECURITY;

--
-- Name: funding_request funding_request_chapter_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funding_request_chapter_insert ON public.funding_request FOR INSERT TO authenticated WITH CHECK (((requester_user_id = auth.uid()) AND public.has_chapter_permission(chapter_id, 'chapter.funding.submit'::text)));


--
-- Name: funding_request funding_request_chapter_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funding_request_chapter_select ON public.funding_request FOR SELECT TO authenticated USING (public.has_chapter_permission(chapter_id, 'chapter.funding.view'::text));


--
-- Name: funding_request funding_request_chapter_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funding_request_chapter_update ON public.funding_request FOR UPDATE TO authenticated USING (public.has_chapter_permission(chapter_id, 'chapter.funding.submit'::text)) WITH CHECK (public.has_chapter_permission(chapter_id, 'chapter.funding.submit'::text));


--
-- Name: funding_request_file; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.funding_request_file ENABLE ROW LEVEL SECURITY;

--
-- Name: funding_request_status_event; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.funding_request_status_event ENABLE ROW LEVEL SECURITY;

--
-- Name: funding_request_status_event funding_status_event_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funding_status_event_admin_all ON public.funding_request_status_event TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: funding_request_status_event funding_status_event_chapter_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funding_status_event_chapter_insert ON public.funding_request_status_event FOR INSERT TO authenticated WITH CHECK (((actor_user_id = auth.uid()) AND public.can_access_funding_request(funding_request_id, 'chapter.funding.submit'::text)));


--
-- Name: funding_request_status_event funding_status_event_chapter_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funding_status_event_chapter_select ON public.funding_request_status_event FOR SELECT TO authenticated USING (public.can_access_funding_request(funding_request_id, 'chapter.funding.view'::text));


--
-- Name: growth_reflection; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.growth_reflection ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_reflection growth_reflection_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY growth_reflection_admin_all ON public.growth_reflection TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: growth_reflection growth_reflection_student_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY growth_reflection_student_insert_own ON public.growth_reflection FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) AND (visibility = 'private'::text)));


--
-- Name: growth_reflection growth_reflection_student_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY growth_reflection_student_select_own ON public.growth_reflection FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: growth_reflection growth_reflection_student_update_own_private; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY growth_reflection_student_update_own_private ON public.growth_reflection FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: lead_identity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_identity ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_identity lead_identity_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lead_identity_admin_all ON public.lead_identity TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: lead_identity lead_identity_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lead_identity_select_own ON public.lead_identity FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: newsletter_subscription; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.newsletter_subscription ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_subscription newsletter_subscription_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY newsletter_subscription_admin_all ON public.newsletter_subscription TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: newsletter_subscription newsletter_subscription_all_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY newsletter_subscription_all_own ON public.newsletter_subscription TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: newsletter_subscription newsletter_subscription_select_editor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY newsletter_subscription_select_editor ON public.newsletter_subscription FOR SELECT TO authenticated USING (public.is_chapter_editor(chapter_id));


--
-- Name: pathway_check_in; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pathway_check_in ENABLE ROW LEVEL SECURITY;

--
-- Name: pathway_check_in pathway_check_in_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pathway_check_in_admin_all ON public.pathway_check_in TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: pathway_check_in pathway_check_in_service_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pathway_check_in_service_read ON public.pathway_check_in FOR SELECT TO service_role USING (true);


--
-- Name: pathway_check_in pathway_check_in_student_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pathway_check_in_student_insert_own ON public.pathway_check_in FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: pathway_check_in pathway_check_in_student_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pathway_check_in_student_select_own ON public.pathway_check_in FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: pathway_check_in pathway_check_in_student_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pathway_check_in_student_update_own ON public.pathway_check_in FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: pathway_feature_flag; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pathway_feature_flag ENABLE ROW LEVEL SECURITY;

--
-- Name: pathway_feature_flag pathway_feature_flag_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pathway_feature_flag_admin_all ON public.pathway_feature_flag TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: pathway_feature_flag pathway_feature_flag_authenticated_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pathway_feature_flag_authenticated_read ON public.pathway_feature_flag FOR SELECT TO authenticated USING (true);


--
-- Name: pathway_feature_flag pathway_feature_flag_service_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pathway_feature_flag_service_read ON public.pathway_feature_flag FOR SELECT TO service_role USING (true);


--
-- Name: pathway_recommendation; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pathway_recommendation ENABLE ROW LEVEL SECURITY;

--
-- Name: pathway_recommendation pathway_recommendation_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pathway_recommendation_admin_all ON public.pathway_recommendation TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: pathway_recommendation pathway_recommendation_service_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pathway_recommendation_service_read ON public.pathway_recommendation FOR SELECT TO service_role USING (true);


--
-- Name: pathway_recommendation pathway_recommendation_student_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pathway_recommendation_student_delete_own ON public.pathway_recommendation FOR DELETE TO authenticated USING (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.pathway_check_in
  WHERE ((pathway_check_in.id = pathway_recommendation.check_in_id) AND (pathway_check_in.user_id = auth.uid()))))));


--
-- Name: pathway_recommendation pathway_recommendation_student_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pathway_recommendation_student_insert_own ON public.pathway_recommendation FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.pathway_check_in
  WHERE ((pathway_check_in.id = pathway_recommendation.check_in_id) AND (pathway_check_in.user_id = auth.uid()))))));


--
-- Name: pathway_recommendation pathway_recommendation_student_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pathway_recommendation_student_select_own ON public.pathway_recommendation FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: pathway_recommendation pathway_recommendation_student_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pathway_recommendation_student_update_own ON public.pathway_recommendation FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: person_profile; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.person_profile ENABLE ROW LEVEL SECURITY;

--
-- Name: person_profile person_profile_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY person_profile_admin_all ON public.person_profile TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: person_profile person_profile_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY person_profile_select_own ON public.person_profile FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: person_profile person_profile_select_recruiter; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY person_profile_select_recruiter ON public.person_profile FOR SELECT TO authenticated USING (((is_recruiter_visible = true) AND (EXISTS ( SELECT 1
   FROM public.recruiter_access ra
  WHERE ((ra.accepted_by_user_id = auth.uid()) AND (ra.is_active = true) AND (ra.revoked_at IS NULL))))));


--
-- Name: person_profile person_profile_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY person_profile_update_own ON public.person_profile FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: recruiter_access; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recruiter_access ENABLE ROW LEVEL SECURITY;

--
-- Name: recruiter_access recruiter_access_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recruiter_access_admin_all ON public.recruiter_access USING ((EXISTS ( SELECT 1
   FROM public."user"
  WHERE (("user".id = auth.uid()) AND ("user".role = 'admin'::public."Role")))));


--
-- Name: recruiter_access recruiter_access_read_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recruiter_access_read_own ON public.recruiter_access FOR SELECT USING (((accepted_by_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public."user"
  WHERE (("user".id = auth.uid()) AND ("user".role = 'admin'::public."Role"))))));


--
-- Name: recruiter_access recruiter_access_read_token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recruiter_access_read_token ON public.recruiter_access FOR SELECT USING (((invite_token IS NOT NULL) AND (revoked_at IS NULL) AND ((invite_expires_at IS NULL) OR (invite_expires_at > now()))));


--
-- Name: resume; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.resume ENABLE ROW LEVEL SECURITY;

--
-- Name: resume resume_all_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY resume_all_admin ON public.resume USING ((EXISTS ( SELECT 1
   FROM public."user"
  WHERE (("user".id = auth.uid()) AND ("user".role = 'admin'::public."Role")))));


--
-- Name: resume resume_all_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY resume_all_own ON public.resume USING ((student_id = auth.uid()));


--
-- Name: resume_download_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.resume_download_log ENABLE ROW LEVEL SECURITY;

--
-- Name: resume_download_log resume_download_log_insert_recruiter; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY resume_download_log_insert_recruiter ON public.resume_download_log FOR INSERT WITH CHECK (((recruiter_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public."user"
  WHERE (("user".id = auth.uid()) AND ("user".role = 'recruiter'::public."Role"))))));


--
-- Name: resume_download_log resume_download_log_read_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY resume_download_log_read_admin ON public.resume_download_log FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public."user"
  WHERE (("user".id = auth.uid()) AND ("user".role = 'admin'::public."Role")))));


--
-- Name: resume_download_log resume_download_log_read_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY resume_download_log_read_own ON public.resume_download_log FOR SELECT USING ((recruiter_id = auth.uid()));


--
-- Name: resume resume_read_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY resume_read_admin ON public.resume FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public."user"
  WHERE (("user".id = auth.uid()) AND ("user".role = 'admin'::public."Role")))));


--
-- Name: resume resume_read_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY resume_read_own ON public.resume FOR SELECT USING ((student_id = auth.uid()));


--
-- Name: resume resume_read_recruiter_visible; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY resume_read_recruiter_visible ON public.resume FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.student_profile sp
  WHERE ((sp.user_id = resume.student_id) AND (sp.is_recruiter_visible = true) AND (sp.approval_status = 'approved'::public.approval_status)))) AND (EXISTS ( SELECT 1
   FROM public."user"
  WHERE (("user".id = auth.uid()) AND ("user".role = 'recruiter'::public."Role"))))));


--
-- Name: saved_student; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_student ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_student saved_student_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY saved_student_admin_all ON public.saved_student USING ((EXISTS ( SELECT 1
   FROM public."user"
  WHERE (("user".id = auth.uid()) AND ("user".role = 'admin'::public."Role")))));


--
-- Name: saved_student saved_student_recruiter_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY saved_student_recruiter_all ON public.saved_student USING (((recruiter_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public."user"
  WHERE (("user".id = auth.uid()) AND ("user".role = 'recruiter'::public."Role"))))));


--
-- Name: saved_student saved_student_recruiter_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY saved_student_recruiter_read ON public.saved_student FOR SELECT USING (((recruiter_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public."user"
  WHERE (("user".id = auth.uid()) AND ("user".role = 'recruiter'::public."Role"))))));


--
-- Name: student_profile; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_profile ENABLE ROW LEVEL SECURITY;

--
-- Name: student_profile student_profile_block_inserts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_profile_block_inserts ON public.student_profile FOR INSERT WITH CHECK (false);


--
-- Name: student_profile student_profile_read_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_profile_read_admin ON public.student_profile FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public."user"
  WHERE (("user".id = auth.uid()) AND ("user".role = 'admin'::public."Role")))));


--
-- Name: student_profile student_profile_read_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_profile_read_own ON public.student_profile FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: student_profile student_profile_read_recruiter_visible; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_profile_read_recruiter_visible ON public.student_profile FOR SELECT USING (((is_recruiter_visible = true) AND (approval_status = 'approved'::public.approval_status) AND (EXISTS ( SELECT 1
   FROM public."user"
  WHERE (("user".id = auth.uid()) AND ("user".role = 'recruiter'::public."Role"))))));


--
-- Name: student_profile student_profile_update_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_profile_update_admin ON public.student_profile USING ((EXISTS ( SELECT 1
   FROM public."user"
  WHERE (("user".id = auth.uid()) AND ("user".role = 'admin'::public."Role")))));


--
-- Name: student_profile student_profile_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_profile_update_own ON public.student_profile FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: user; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;

--
-- Name: user user_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_insert_own ON public."user" FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));


--
-- Name: user user_insert_service_role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_insert_service_role ON public."user" FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: user user_read_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_read_admin ON public."user" FOR SELECT USING (public.is_admin());


--
-- Name: user user_read_all_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_read_all_authenticated ON public."user" FOR SELECT TO authenticated USING (true);


--
-- Name: user user_read_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_read_own ON public."user" FOR SELECT USING ((id = auth.uid()));


--
-- Name: user user_update_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_update_admin ON public."user" FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: user user_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_update_own ON public."user" FOR UPDATE USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));


--
-- PostgreSQL database dump complete
--

\unrestrict YxJigqzXOOJqeiOdo5Z2z8prb0Igp8ar5cAy2ih3uAXF4cLFi0W9HVZGKwnW3mi

