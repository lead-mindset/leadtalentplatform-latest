-- LEAD-004: Repair legacy auth helpers to match the actual public."user" table.
-- The base schema creates public."user", but older functions reference public."User".

BEGIN;

CREATE OR REPLACE FUNCTION public.call_welcome_email_function()
RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT u.role::text
  FROM public."user" u
  WHERE u.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

COMMIT;
