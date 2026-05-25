-- Add LEAD ULIMA as an official chapter for launch preapprovals.

BEGIN;

INSERT INTO public.chapter (
  id,
  name,
  university,
  city,
  region,
  created_at,
  updated_at,
  instagram_url,
  latitude,
  longitude,
  location_point
) VALUES (
  'leadulima',
  'LEAD ULIMA',
  'Universidad de Lima',
  'Lima',
  'Lima',
  current_date,
  now(),
  'https://instagram.com/lead.at.ulima',
  -12.0844624,
  -76.9713278,
  public.ST_SetSRID(public.ST_MakePoint(-76.9713278, -12.0844624), 4326)
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  university = EXCLUDED.university,
  city = EXCLUDED.city,
  region = EXCLUDED.region,
  instagram_url = EXCLUDED.instagram_url,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  location_point = EXCLUDED.location_point,
  updated_at = now();

COMMIT;

SELECT 'LEAD ULIMA chapter available' AS status
WHERE EXISTS (
  SELECT 1
  FROM public.chapter
  WHERE id = 'leadulima'
);
