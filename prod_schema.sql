--
-- PostgreSQL database dump
--

\restrict mOubJzmLgCX9NE9dZRXhG8zKKIZyJZYUK4iV2F2c9Gu3KL8a0uBCt2KI46REqpd

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
    'inactive'
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
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_current_count INTEGER;
  v_capacity INTEGER;
  v_capacity_warning BOOLEAN := false;
  v_capacity_status TEXT := 'ok';
BEGIN
  -- Get current registered count and capacity
  SELECT COUNT(*) INTO v_current_count
  FROM public."EventRegistration"
  WHERE "eventId" = p_event_id
    AND status = 'registered';
  
  SELECT capacity INTO v_capacity
  FROM public."Event"
  WHERE id = p_event_id;
  
  -- Check if this approval would exceed capacity (warning only)
  IF v_capacity IS NOT NULL AND (v_current_count + array_length(p_application_ids, 1)) >= v_capacity THEN
    v_capacity_warning := true;
    v_capacity_status := 
      CASE 
        WHEN (v_current_count + array_length(p_application_ids, 1)) > v_capacity THEN 'over_capacity'
        ELSE 'at_capacity'
      END;
  END IF;
  
  -- Update all applications in a single transaction
  UPDATE public."EventRegistration"
  SET 
    status = 'registered',
    qrToken = gen_random_uuid(),  -- Generate QR token on approval
    "updatedAt" = NOW()
  WHERE id = ANY(p_application_ids)
    AND "eventId" = p_event_id
    AND status = 'pending_review';
  
  -- Return warning info
  RETURN jsonb_build_object(
    'capacity_warning', v_capacity_warning,
    'capacity_status', v_capacity_status
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
BEGIN
  -- Call Edge Function via HTTP
  PERFORM pg_net.http_post(
    'https://sboibxszratyaswwursb.supabase.co/functions/v1/welcome-email',
    json_build_object(
      'userId', NEW.id,
      'email', NEW.email,
      'name', COALESCE(NEW.name, 'there')
    ),
    headers := json_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key'))
  );
  RETURN NEW;
END;
$$;


--
-- Name: check_is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_is_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid()
    AND role = 'admin'
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
  SELECT role::text FROM public."User" WHERE id = auth.uid();
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
-- Name: get_my_chapter_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_chapter_id() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  chapter_id text;
BEGIN
  SELECT sp.chapter_id INTO chapter_id
  FROM public.student_profile sp
  WHERE sp.user_id = auth.uid()
    AND sp.approval_status = 'approved'
  LIMIT 1;
  RETURN chapter_id;
END;
$$;


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(user_id uuid) RETURNS text
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT COALESCE(role::text, 'member')
  FROM public."User"
  WHERE id = user_id;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  INSERT INTO public."User" (
    id,
    email,
    name,
    role,
    "createdAt",
    "updatedAt"
  )
  VALUES (
    NEW.id,
    NEW.email,
    '', -- placeholder until onboarding
    'member', -- ✅ valid enum value
    now(),
    now()
  );

  RETURN NEW;
END;
$$;


--
-- Name: is_event_editor(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_event_editor(event_uuid uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  my_chapter text;
BEGIN
  my_chapter := get_my_chapter_id();
  IF my_chapter IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.event e
    WHERE e.id = event_uuid
    AND (
      e.chapter_id = my_chapter
      OR EXISTS (
        SELECT 1 FROM public.event_chapter ec
        WHERE ec.event_id = event_uuid 
        AND ec.chapter_id = my_chapter
      )
    )
  );
END;
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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


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
    CONSTRAINT event_application_url_required CHECK (((access_model <> 'application'::text) OR (application_form_url IS NOT NULL))),
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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: person_profile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.person_profile (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    university text NOT NULL,
    major_or_interest text NOT NULL,
    graduation_year integer NOT NULL,
    linkedin_url text,
    portfolio_url text,
    skills text[],
    gender text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    consent_recruiter_visibility boolean DEFAULT false NOT NULL,
    consent_date timestamp with time zone
);


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
-- Name: v_user_profile; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_user_profile AS
 SELECT p.user_id,
    p.university,
    p.major_or_interest,
    p.graduation_year,
    p.linkedin_url,
    p.skills,
    p.gender,
    p.consent_recruiter_visibility,
    p.consent_date,
    c.chapter_id,
    c.status AS membership_status,
    c."position" AS membership_position,
    c.approved_by_id,
    c.member_id,
    c.joined_at
   FROM (public.person_profile p
     LEFT JOIN public.chapter_membership c ON ((p.user_id = c.user_id)));


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
-- Name: lead_identity lead_identity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_identity
    ADD CONSTRAINT lead_identity_pkey PRIMARY KEY (id);


--
-- Name: lead_identity lead_identity_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_identity
    ADD CONSTRAINT lead_identity_user_id_key UNIQUE (user_id);


--
-- Name: newsletter_subscription newsletter_subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscription
    ADD CONSTRAINT newsletter_subscription_pkey PRIMARY KEY (id);


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
-- Name: idx_chapter_membership_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chapter_membership_user_id ON public.chapter_membership USING btree (user_id);


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
-- Name: idx_newsletter_subscription_chapter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_subscription_chapter_id ON public.newsletter_subscription USING btree (chapter_id);


--
-- Name: idx_newsletter_subscription_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_subscription_status ON public.newsletter_subscription USING btree (status);


--
-- Name: idx_newsletter_subscription_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_subscription_user_id ON public.newsletter_subscription USING btree (user_id);


--
-- Name: idx_person_profile_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_person_profile_created_at ON public.person_profile USING btree (created_at);


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
-- Name: unique_active_recruiter_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_active_recruiter_email ON public.recruiter_access USING btree (recruiter_email) WHERE ((is_active = true) AND (revoked_at IS NULL));


--
-- Name: unique_active_recruiter_email_per_company; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_active_recruiter_email_per_company ON public.recruiter_access USING btree (company_id, recruiter_email) WHERE ((is_active = true) AND (revoked_at IS NULL));


--
-- Name: user welcome_email_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER welcome_email_trigger AFTER INSERT ON public."user" FOR EACH ROW EXECUTE FUNCTION public.call_welcome_email_function();


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
-- Name: chapter_membership Editors can manage chapter memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors can manage chapter memberships" ON public.chapter_membership USING (((EXISTS ( SELECT 1
   FROM public.chapter_membership cm2
  WHERE ((cm2.user_id = auth.uid()) AND (cm2.chapter_id = chapter_membership.chapter_id) AND (cm2.status = 'approved'::public.membership_status) AND (cm2."position" = ANY (ARRAY['president'::text, 'vice_president'::text, 'secretary'::text, 'treasurer'::text, 'editor'::text]))))) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text)));


--
-- Name: event_application_question Editors can manage event questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors can manage event questions" ON public.event_application_question USING (((EXISTS ( SELECT 1
   FROM (public.event_chapter ec
     JOIN public.chapter_membership cm ON ((ec.chapter_id = cm.chapter_id)))
  WHERE ((ec.event_id = event_application_question.event_id) AND (cm.user_id = auth.uid()) AND (cm.status = 'approved'::public.membership_status) AND (cm."position" = ANY (ARRAY['president'::text, 'vice_president'::text, 'secretary'::text, 'treasurer'::text, 'editor'::text]))))) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text)));


--
-- Name: event_application_answer Editors can read event answers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors can read event answers" ON public.event_application_answer FOR SELECT USING (((EXISTS ( SELECT 1
   FROM ((public.event_chapter ec
     JOIN public.chapter_membership cm ON ((ec.chapter_id = cm.chapter_id)))
     JOIN public.event_registration er ON ((ec.event_id = er.event_id)))
  WHERE ((er.id = event_application_answer.registration_id) AND (cm.user_id = auth.uid()) AND (cm.status = 'approved'::public.membership_status) AND (cm."position" = ANY (ARRAY['president'::text, 'vice_president'::text, 'secretary'::text, 'treasurer'::text, 'editor'::text]))))) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text)));


--
-- Name: event_application_question Public can read event questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read event questions" ON public.event_application_question FOR SELECT USING (true);


--
-- Name: person_profile Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.person_profile USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: chapter_membership Service role full access to memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to memberships" ON public.chapter_membership USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


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
-- Name: chapter_membership Users can insert own membership; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own membership" ON public.chapter_membership FOR INSERT WITH CHECK ((auth.uid() = user_id));


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
-- Name: chapter_membership Users can read own memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own memberships" ON public.chapter_membership FOR SELECT USING ((auth.uid() = user_id));


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
-- Name: chapter chapter_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_admin_all ON public.chapter USING ((EXISTS ( SELECT 1
   FROM public."user"
  WHERE (("user".id = auth.uid()) AND ("user".role = 'admin'::public."Role")))));


--
-- Name: chapter_membership; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chapter_membership ENABLE ROW LEVEL SECURITY;

--
-- Name: chapter chapter_read_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chapter_read_all ON public.chapter FOR SELECT USING (true);


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
-- Name: event_application_question; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_application_question ENABLE ROW LEVEL SECURITY;

--
-- Name: event_chapter; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_chapter ENABLE ROW LEVEL SECURITY;

--
-- Name: event_chapter event_chapter_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_chapter_delete_own ON public.event_chapter FOR DELETE USING (((chapter_id = public.get_my_chapter_id()) OR (event_id IN ( SELECT event.id
   FROM public.event
  WHERE (event.chapter_id = public.get_my_chapter_id())))));


--
-- Name: event_chapter event_chapter_insert_collab_event; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_chapter_insert_collab_event ON public.event_chapter FOR INSERT WITH CHECK ((event_id IN ( SELECT ec.event_id
   FROM public.event_chapter ec
  WHERE (ec.chapter_id = public.get_my_chapter_id()))));


--
-- Name: event_chapter event_chapter_insert_own_event; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_chapter_insert_own_event ON public.event_chapter FOR INSERT WITH CHECK ((event_id IN ( SELECT event.id
   FROM public.event
  WHERE (event.chapter_id = public.get_my_chapter_id()))));


--
-- Name: event_chapter event_chapter_read_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_chapter_read_all ON public.event_chapter FOR SELECT USING (true);


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

CREATE POLICY event_registration_read_editor ON public.event_registration FOR SELECT USING (public.is_event_editor(event_id));


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

CREATE POLICY event_registration_update_editor ON public.event_registration FOR UPDATE USING (public.is_event_editor(event_id)) WITH CHECK (public.is_event_editor(event_id));


--
-- Name: event_registration event_registration_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_registration_update_own ON public.event_registration FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: event events_delete_own_or_collaborative; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_delete_own_or_collaborative ON public.event FOR DELETE USING (public.is_event_editor(id));


--
-- Name: event events_insert_own_chapter; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_insert_own_chapter ON public.event FOR INSERT WITH CHECK ((chapter_id = public.get_my_chapter_id()));


--
-- Name: event events_read_own_chapter; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_read_own_chapter ON public.event FOR SELECT USING (((chapter_id = public.get_my_chapter_id()) OR (id IN ( SELECT event_chapter.event_id
   FROM public.event_chapter
  WHERE (event_chapter.chapter_id = public.get_my_chapter_id())))));


--
-- Name: event events_read_published; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_read_published ON public.event FOR SELECT USING ((is_published = true));


--
-- Name: event events_update_own_or_collaborative; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_update_own_or_collaborative ON public.event FOR UPDATE USING (public.is_event_editor(id)) WITH CHECK (public.is_event_editor(id));


--
-- Name: lead_identity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_identity ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_subscription; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.newsletter_subscription ENABLE ROW LEVEL SECURITY;

--
-- Name: person_profile; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.person_profile ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY user_read_admin ON public."user" FOR SELECT USING (((auth.jwt() ->> 'role'::text) = 'admin'::text));


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

CREATE POLICY user_update_admin ON public."user" FOR UPDATE USING (((auth.jwt() ->> 'role'::text) = 'admin'::text)) WITH CHECK (((auth.jwt() ->> 'role'::text) = 'admin'::text));


--
-- Name: user user_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_update_own ON public."user" FOR UPDATE USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));


--
-- PostgreSQL database dump complete
--

\unrestrict mOubJzmLgCX9NE9dZRXhG8zKKIZyJZYUK4iV2F2c9Gu3KL8a0uBCt2KI46REqpd

