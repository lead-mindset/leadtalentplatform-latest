CREATE OR REPLACE VIEW public.published_event_listing AS
SELECT
  e.id,
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
  COUNT(er.id)::integer AS registrations_count
FROM public.event e
LEFT JOIN public.chapter c ON c.id = e.chapter_id
LEFT JOIN public.event_registration er
  ON er.event_id = e.id
  AND er.status = 'registered'
WHERE e.is_published = true
GROUP BY
  e.id,
  c.id;

ALTER VIEW public.published_event_listing OWNER TO postgres;

GRANT SELECT ON TABLE public.published_event_listing TO anon;
GRANT SELECT ON TABLE public.published_event_listing TO authenticated;
GRANT SELECT ON TABLE public.published_event_listing TO service_role;
