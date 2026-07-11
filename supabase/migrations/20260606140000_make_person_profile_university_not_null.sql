-- Make person_profile.university NOT NULL.
-- Backfill existing NULL values with major_or_interest as a reasonable fallback.

UPDATE public.person_profile
SET university = major_or_interest
WHERE university IS NULL;

ALTER TABLE public.person_profile
ALTER COLUMN university SET NOT NULL;
