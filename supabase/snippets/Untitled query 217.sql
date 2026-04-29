CREATE OR REPLACE FUNCTION public.call_welcome_email_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- We wrap the email logic so it doesn't kill the signup
  BEGIN
    -- This is where your actual logic lives (Edge Function call, etc.)
    -- Example: perform net.http_post(...) 
    
    -- NOTE: For local dev, make sure your SMTP or Edge Function
    -- environment variables are set in your .env or supabase/config.toml
    
    RAISE NOTICE 'Attempting to send welcome email to %', NEW.email;
  EXCEPTION WHEN OTHERS THEN
    -- If the email fails, we just log it and move on
    RAISE WARNING 'Welcome email failed to send, but user creation continued. Error: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;