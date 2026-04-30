CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- We use "user" in lowercase and quotes to match your schema
  INSERT INTO public."user" (
    id,
    email,
    name,
    role,
    created_at, -- Matches your schema's snake_case
    updated_at  -- Matches your schema's snake_case
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'member', -- This must exist in your "Role" enum
    now(),
    now()
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Prevents the Auth signup from failing if this insert hits a snag
  RETURN NEW;
END;
$$;