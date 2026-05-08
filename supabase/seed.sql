INSERT INTO "public"."chapter" ("id", "name", "university", "city", "region", "created_at", "updated_at", "instagram_url", "latitude", "longitude", "location_point") VALUES ('leadpacifico', 'LEAD UP', 'Universidad del Pacífico', 'Lima', 'Lima', '2026-02-01', '2026-04-18 13:46:32.802', 'https://instagram.com/lead_pacifico', '-12.1124', '-77.0278', '0101000020E61000000BB5A679C74153C00B24287E8C3928C0'), ('leadpucp', 'LEAD PUCP', 'Pontificia Universidad Católica del Perú', 'Lima', 'Lima', '2026-02-01', '2026-04-18 13:42:41.973', 'https://instagram.com/lead_pucp', '-12.0696', '-77.0794', '0101000020E61000005BD3BCE3144553C06B9A779CA22328C0'), ('leadtecsup', 'LEAD TECSUP', 'Instituto Tecnológico Superior Tecsup', 'Lima', 'Lima', '2026-02-01', '2026-04-18 13:46:32.307', 'https://instagram.com/lead.tecsup', '-12.1042', '-76.9628', '0101000020E6100000AF25E4839E3D53C0857CD0B3593528C0'), ('leaducsur', 'LEAD UCSUR', 'Universidad Científica del Sur', 'Lima', 'Lima', '2026-02-01', '2026-04-18 13:46:32.991', 'https://instagram.com/lead_ucsur', '-12.1619', '-76.9764', '0101000020E61000001FF46C567D3E53C0DE718A8EE45228C0'), ('leaduni', 'LEAD UNI', 'Universidad Nacional de Ingeniería', 'Lima', 'Lima', '2026-02-01', '2026-04-18 13:42:42.994', 'https://instagram.com/lead_uni', '-12.0247', '-77.0483', '0101000020E61000006519E258174353C0226C787AA50C28C0'), ('leadunmsm', 'LEAD UNMSM', 'Universidad Nacional Mayor de San Marcos', 'Lima', 'Lima', '2026-02-01', '2026-04-18 13:42:43.146', 'https://instagram.com/lead_unmsm', '-12.0561', '-77.0845', '0101000020E6100000C520B072684553C0789CA223B91C28C0'), ('leadunsa', 'LEAD UNSA', 'Universidad Nacional de San Agustin de Arequipa', 'Arequipa', 'Arequipa', '2026-02-01', '2026-04-18 13:48:54.339', 'https://instagram.com/lead_unsa', '-16.3988', '-71.5369', '0101000020E61000003C4ED1915CE251C012A5BDC1176630C0'), ('leadupc', 'LEAD UPC', 'Universidad Peruana de Ciencias Aplicadas', 'Lima', 'Lima', '2026-02-01', '2026-04-18 13:42:42.847', 'https://instagram.com/lead.upc', '-12.1956', '-76.9741', '0101000020E610000027C286A7573E53C0F931E6AE256428C0'), ('leadupn', 'LEAD UPN', 'Universidad Privada del Norte', 'Lima', 'Lima', '2026-02-01', '2026-04-18 13:42:43.205', 'https://instagram.com/lead_upn', '-11.9618', '-77.0679', '0101000020E61000007FD93D79584453C0EA95B20C71EC27C0'), ('leadupntrujillo', 'LEAD UPN TRUJILLO', 'Universidad Privada del Norte', 'Trujillo', 'La Libertad', '2026-02-01', '2026-04-18 13:42:43.283', 'https://instagram.com/leadupn_trujillo', '-8.1074', '-79.0288', '0101000020E6100000FD87F4DBD7C153C0492EFF21FD3620C0'), ('leadusil', 'LEAD USIL', 'Universidad San Ignacio de Loyola', 'Lima', 'Lima', '2026-02-01', '2026-04-18 13:46:33.054', 'https://instagram.com/lead.usil', '-12.1558', '-76.9996', '0101000020E610000039454772F93F53C0006F8104C54F28C0'), ('leadutec', 'LEAD UTEC', 'Universidad de Ingeniería y Tecnología', 'Lima', 'Lima', '2026-02-01', '2026-04-18 14:02:00.967', 'https://instagram.com/lead_utec', '-12.1348', '-77.0224', '0101000020E61000008CDB68006F4153C069006F81044528C0'), ('leadutp', 'LEAD UTP', 'Universidad Tecnológica del Perú', 'Lima', 'Lima', '2026-02-01', '2026-04-18 13:42:43.068', 'https://instagram.com/lead_utp', '-12.0974', '-77.0325', '0101000020E6100000AE47E17A144253C0C442AD69DE3128C0'), ('leadvillareal', 'LEAD VILLAREAL', 'Universidad Nacional Federico Villareal', 'Lima', 'Lima', '2026-02-01', '2026-04-18 13:42:43.349', 'https://instagram.com/lead.villarreal', '-12.0563', '-77.0628', '0101000020E6100000158C4AEA044453C09487855AD31C28C0'), ('other', 'Other', 'Other', null, null, '2026-02-01', '2026-02-18 18:28:51.765', null, null, null, null);


-- Seed Auth Users & Personas for LEAD-004 Test Strategy
-- Note: All passwords are set to "password123" (using standard bcrypt hash for testing)

-- Clean up existing persona users if running seed multiple times
DELETE FROM auth.users WHERE email IN (
  'participant@test.com', 'member@test.com', 'editor@test.com',
  'admin@test.com', 'staff@test.com', 'recruiter@test.com', 'alumni@test.com'
);

-- Insert Users into auth.users (Requires Supabase privileges to inject into auth schema)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'participant@test.com', '$2b$10$d04rJdM2Gfm5OHSN2PpRzeYiXF00LKzkV//rhHDPW2CI07z/t8Wr.', NOW(), NOW(), NOW(), '', '', '', ''),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member@test.com', '$2b$10$d04rJdM2Gfm5OHSN2PpRzeYiXF00LKzkV//rhHDPW2CI07z/t8Wr.', NOW(), NOW(), NOW(), '', '', '', ''),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'editor@test.com', '$2b$10$d04rJdM2Gfm5OHSN2PpRzeYiXF00LKzkV//rhHDPW2CI07z/t8Wr.', NOW(), NOW(), NOW(), '', '', '', ''),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.com', '$2b$10$d04rJdM2Gfm5OHSN2PpRzeYiXF00LKzkV//rhHDPW2CI07z/t8Wr.', NOW(), NOW(), NOW(), '', '', '', ''),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'staff@test.com', '$2b$10$d04rJdM2Gfm5OHSN2PpRzeYiXF00LKzkV//rhHDPW2CI07z/t8Wr.', NOW(), NOW(), NOW(), '', '', '', ''),
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'recruiter@test.com', '$2b$10$d04rJdM2Gfm5OHSN2PpRzeYiXF00LKzkV//rhHDPW2CI07z/t8Wr.', NOW(), NOW(), NOW(), '', '', '', ''),
  ('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alumni@test.com', '$2b$10$d04rJdM2Gfm5OHSN2PpRzeYiXF00LKzkV//rhHDPW2CI07z/t8Wr.', NOW(), NOW(), NOW(), '', '', '', '');

-- Align app-account rows created by public.handle_new_user().
UPDATE public."user" SET name = 'Test Participant', role = 'member' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE public."user" SET name = 'Test Member', role = 'member' WHERE id = '22222222-2222-2222-2222-222222222222';
UPDATE public."user" SET name = 'Test Editor', role = 'editor' WHERE id = '33333333-3333-3333-3333-333333333333';
UPDATE public."user" SET name = 'Test Admin', role = 'admin' WHERE id = '44444444-4444-4444-4444-444444444444';
UPDATE public."user" SET name = 'Test Staff', role = 'admin' WHERE id = '55555555-5555-5555-5555-555555555555';
UPDATE public."user" SET name = 'Test Recruiter', role = 'recruiter' WHERE id = '66666666-6666-6666-6666-666666666666';
UPDATE public."user" SET name = 'Test Alumni', role = 'member' WHERE id = '77777777-7777-7777-7777-777777777777';

-- Insert Person Profiles (using user_id)
INSERT INTO public.person_profile (
  id,
  user_id,
  university,
  major_or_interest,
  graduation_year,
  linkedin_url,
  portfolio_url,
  skills,
  gender,
  is_recruiter_visible
) VALUES
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Universidad Nacional de Ingenieria', 'Data and public policy', 2028, 'https://linkedin.com/in/test-participant', 'https://test-participant.dev', ARRAY['Research', 'Events'], 'prefer_not_to_say', false),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Universidad Nacional de Ingenieria', 'Industrial Engineering', 2027, 'https://linkedin.com/in/test-member', 'https://test-member.dev', ARRAY['Operations', 'Analytics'], 'woman', true),
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Universidad Nacional de Ingenieria', 'Software Engineering', 2026, 'https://linkedin.com/in/test-editor', 'https://test-editor.dev', ARRAY['Leadership', 'React', 'SQL'], 'man', false),
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'LEAD Peru', 'Platform administration', null, 'https://linkedin.com/in/test-admin', null, ARRAY['Governance', 'Operations'], 'prefer_not_to_say', false),
  ('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'LEAD Peru', 'Program operations', null, 'https://linkedin.com/in/test-staff', null, ARRAY['Programs', 'Community'], 'prefer_not_to_say', false),
  ('66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 'Test Company', 'Recruiting', null, 'https://linkedin.com/in/test-recruiter', null, ARRAY['Hiring', 'Talent'], 'prefer_not_to_say', false),
  ('77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', 'Universidad Nacional de Ingenieria', 'Finance', 2024, 'https://linkedin.com/in/test-alumni', 'https://test-alumni.dev', ARRAY['Finance', 'Mentorship'], 'woman', true);

-- Insert Chapter Memberships (using the layered membership model)
INSERT INTO public.chapter_membership (
  user_id,
  chapter_id,
  position,
  status,
  approved_by_id,
  member_id,
  joined_at
) VALUES
  ('22222222-2222-2222-2222-222222222222', 'leaduni', 'member', 'approved', '44444444-4444-4444-4444-444444444444', 'LEAD-UNI-0001', NOW() - INTERVAL '180 days'),
  ('33333333-3333-3333-3333-333333333333', 'leaduni', 'editor', 'approved', '44444444-4444-4444-4444-444444444444', 'LEAD-UNI-0002', NOW() - INTERVAL '210 days'),
  ('77777777-7777-7777-7777-777777777777', 'leaduni', 'member', 'alumni', '55555555-5555-5555-5555-555555555555', 'LEAD-UNI-0003', NOW() - INTERVAL '540 days');

-- Insert Lead Identities (Global and membership-derived roles)
INSERT INTO public.lead_identity (user_id, identity_type, chapter_id, issued_by_id, issued_at) VALUES
  ('22222222-2222-2222-2222-222222222222', 'chapter_member', 'leaduni', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '180 days'),
  ('33333333-3333-3333-3333-333333333333', 'chapter_editor', 'leaduni', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '210 days'),
  ('44444444-4444-4444-4444-444444444444', 'founder', null, null, NOW() - INTERVAL '365 days'),
  ('55555555-5555-5555-5555-555555555555', 'staff', null, '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '300 days'),
  ('77777777-7777-7777-7777-777777777777', 'alumni', 'leaduni', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '540 days');

-- Insert accepted recruiter scope for recruiter persona.
INSERT INTO public.company (id, name, created_by_id) VALUES
  ('88888888-8888-8888-8888-888888888888', 'Test Company', '44444444-4444-4444-4444-444444444444');

INSERT INTO public.recruiter_access (
  recruiter_email,
  is_active,
  granted_by_id,
  invite_token,
  invite_expires_at,
  accepted_at,
  accepted_by_user_id,
  company_id
) VALUES (
  'recruiter@test.com',
  true,
  '44444444-4444-4444-4444-444444444444',
  '99999999-9999-9999-9999-999999999999',
  NOW() + INTERVAL '30 days',
  NOW(),
  '66666666-6666-6666-6666-666666666666',
  '88888888-8888-8888-8888-888888888888'
);

-- Insert Newsletter Subscription Personas
INSERT INTO public.newsletter_subscription (
  user_id,
  scope,
  chapter_id,
  status,
  source,
  subscribed_at,
  unsubscribed_at
) VALUES
  ('11111111-1111-1111-1111-111111111111', 'global', null, 'active', 'onboarding', NOW(), null),
  ('22222222-2222-2222-2222-222222222222', 'chapter', 'leaduni', 'active', 'onboarding', NOW(), null),
  ('77777777-7777-7777-7777-777777777777', 'global', null, 'unsubscribed', 'manual', NOW() - INTERVAL '30 days', NOW());

-- Seed published event catalog for local QA (#92)
-- Past rows preserve realistic LEAD activity history; future rows support registration/application testing.
DELETE FROM public.event_application_question WHERE event_id IN (
  '92000000-0000-4000-8000-000000000001',
  '92000000-0000-4000-8000-000000000002',
  '92000000-0000-4000-8000-000000000003',
  '92000000-0000-4000-8000-000000000004',
  '92000000-0000-4000-8000-000000000005',
  '92000000-0000-4000-8000-000000000006',
  '92000000-0000-4000-8000-000000000007',
  '92000000-0000-4000-8000-000000000008',
  '92000000-0000-4000-8000-000000000009',
  '92000000-0000-4000-8000-000000000010',
  '92000000-0000-4000-8000-000000000011',
  '92000000-0000-4000-8000-000000000012',
  '92000000-0000-4000-8000-000000000013',
  '92000000-0000-4000-8000-000000000014',
  '92000000-0000-4000-8000-000000000015',
  '92000000-0000-4000-8000-000000000016',
  '92000000-0000-4000-8000-000000000017',
  '92000000-0000-4000-8000-000000000018',
  '92000000-0000-4000-8000-000000000019',
  '92000000-0000-4000-8000-000000000020',
  '92000000-0000-4000-8000-000000000021',
  '92000000-0000-4000-8000-000000000022',
  '92000000-0000-4000-8000-000000000023',
  '92000000-0000-4000-8000-000000000024',
  '92000000-0000-4000-8000-000000000025',
  '92000000-0000-4000-8000-000000000026',
  '92000000-0000-4000-8000-000000000027',
  '92000000-0000-4000-8000-000000000028',
  '92000000-0000-4000-8000-000000000029',
  '92000000-0000-4000-8000-000000000030'
);

DELETE FROM public.event WHERE id IN (
  '92000000-0000-4000-8000-000000000001',
  '92000000-0000-4000-8000-000000000002',
  '92000000-0000-4000-8000-000000000003',
  '92000000-0000-4000-8000-000000000004',
  '92000000-0000-4000-8000-000000000005',
  '92000000-0000-4000-8000-000000000006',
  '92000000-0000-4000-8000-000000000007',
  '92000000-0000-4000-8000-000000000008',
  '92000000-0000-4000-8000-000000000009',
  '92000000-0000-4000-8000-000000000010',
  '92000000-0000-4000-8000-000000000011',
  '92000000-0000-4000-8000-000000000012',
  '92000000-0000-4000-8000-000000000013',
  '92000000-0000-4000-8000-000000000014',
  '92000000-0000-4000-8000-000000000015',
  '92000000-0000-4000-8000-000000000016',
  '92000000-0000-4000-8000-000000000017',
  '92000000-0000-4000-8000-000000000018',
  '92000000-0000-4000-8000-000000000019',
  '92000000-0000-4000-8000-000000000020',
  '92000000-0000-4000-8000-000000000021',
  '92000000-0000-4000-8000-000000000022',
  '92000000-0000-4000-8000-000000000023',
  '92000000-0000-4000-8000-000000000024',
  '92000000-0000-4000-8000-000000000025',
  '92000000-0000-4000-8000-000000000026',
  '92000000-0000-4000-8000-000000000027',
  '92000000-0000-4000-8000-000000000028',
  '92000000-0000-4000-8000-000000000029',
  '92000000-0000-4000-8000-000000000030'
);

DELETE FROM public.event WHERE title IN ('fewfafew', '1111fewfew');

INSERT INTO public.event (
  id,
  title,
  description,
  cover_image,
  start_at,
  end_at,
  location,
  meeting_url,
  event_type,
  capacity,
  is_published,
  chapter_id,
  created_by_id,
  access_model,
  application_form_url,
  location_name,
  location_address,
  location_city,
  location_region,
  location_latitude,
  location_longitude,
  location_point
) VALUES
  ('92000000-0000-4000-8000-000000000001', 'Networking Night Lima', 'Noche de networking para estudiantes y profesionales. Conecta con personas de diversas universidades y sectores.', null, '2025-08-16 00:00:00+00', '2025-08-16 03:00:00+00', 'Universidad Nacional Mayor de San Marcos (UNMSM)', null, 'in_person', null, true, 'leadunmsm', '44444444-4444-4444-4444-444444444444', 'open', null, 'Universidad Nacional Mayor de San Marcos (UNMSM)', null, 'Lima', 'Lima', -12.0561, -77.0845, null),
  ('92000000-0000-4000-8000-000000000002', 'Networking Trujillo - Edicion Verano', 'Evento de networking veraniego en Trujillo. Conecta con estudiantes, egresados y profesionales de la region.', null, '2025-06-15 22:00:00+00', '2025-06-16 01:00:00+00', 'Universidad Privada del Norte - Sede Trujillo', null, 'in_person', null, true, 'leadupntrujillo', '44444444-4444-4444-4444-444444444444', 'open', null, 'Universidad Privada del Norte - Sede Trujillo', null, 'Trujillo', 'La Libertad', -8.1074, -79.0288, null),
  ('92000000-0000-4000-8000-000000000003', 'Leadership Workshop Series', 'Serie de talleres de liderazgo. Sesion 1: comunicacion efectiva, trabajo en equipo y toma de decisiones.', null, '2025-07-05 20:00:00+00', '2025-07-05 23:00:00+00', 'Pontificia Universidad Catolica del Peru (PUCP)', null, 'in_person', null, true, 'leadpucp', '44444444-4444-4444-4444-444444444444', 'open', null, 'Pontificia Universidad Catolica del Peru (PUCP)', null, 'Lima', 'Lima', -12.0696, -77.0794, null),
  ('92000000-0000-4000-8000-000000000004', 'AI & Innovation Panel', 'Panel sobre inteligencia artificial e innovacion. Exploramos el impacto de la IA en distintas industrias y oportunidades para estudiantes.', null, '2025-07-22 21:00:00+00', '2025-07-23 00:00:00+00', 'Universidad Nacional de Ingenieria (UNI)', null, 'in_person', null, true, 'leaduni', '33333333-3333-3333-3333-333333333333', 'open', null, 'Universidad Nacional de Ingenieria (UNI)', null, 'Lima', 'Lima', -12.0247, -77.0483, null),
  ('92000000-0000-4000-8000-000000000005', 'LEAD UPN - Finanzas Personales', 'Taller de educacion financiera para aprender a manejar presupuesto, ahorro e inversion desde la universidad.', null, '2025-08-20 19:00:00+00', '2025-08-20 22:00:00+00', 'Universidad Privada del Norte (UPN)', null, 'in_person', null, true, 'leadupn', '44444444-4444-4444-4444-444444444444', 'open', null, 'Universidad Privada del Norte (UPN)', null, 'Lima', 'Lima', -11.9618, -77.0679, null),
  ('92000000-0000-4000-8000-000000000006', 'LEAD Villarreal - Networking Empresarial', 'Evento de networking empresarial organizado por LEAD Villarreal para conectar estudiantes con profesionales y empresas locales.', null, '2025-09-15 23:00:00+00', '2025-09-16 02:00:00+00', 'Universidad Nacional Federico Villarreal', null, 'in_person', null, true, 'leadvillareal', '44444444-4444-4444-4444-444444444444', 'open', null, 'Universidad Nacional Federico Villarreal', null, 'Lima', 'Lima', -12.0563, -77.0628, null),
  ('92000000-0000-4000-8000-000000000007', 'LeadTech Summit', 'Cumbre tecnologica de LEAD con ponentes de la industria, workshops de herramientas emergentes y espacios de networking.', null, '2025-09-20 14:00:00+00', '2025-09-21 23:00:00+00', 'Universidad Tecnologica del Peru (UTP)', null, 'in_person', null, true, 'leadutp', '44444444-4444-4444-4444-444444444444', 'open', null, 'Universidad Tecnologica del Peru (UTP)', null, 'Lima', 'Lima', -12.0974, -77.0325, null),
  ('92000000-0000-4000-8000-000000000008', 'Product Design Sprint', 'Taller intensivo de diseno de productos. Aprende metodologias de design thinking, investigacion y prototipado rapido.', null, '2025-10-10 19:00:00+00', '2025-10-10 23:00:00+00', 'Universidad Privada del Norte (UPN)', null, 'in_person', null, true, 'leadupn', '44444444-4444-4444-4444-444444444444', 'open', null, 'Universidad Privada del Norte (UPN)', null, 'Lima', 'Lima', -11.9618, -77.0679, null),
  ('92000000-0000-4000-8000-000000000009', 'LEAD UPC 1 Year Anniversary', 'Celebracion del primer aniversario de LEAD UPC con networking, charlas inspiradoras y reconocimientos a la comunidad.', null, '2025-11-15 22:00:00+00', '2025-11-16 02:00:00+00', 'Universidad Peruana de Ciencias Aplicadas (UPC)', null, 'in_person', null, true, 'leadupc', '44444444-4444-4444-4444-444444444444', 'open', null, 'Universidad Peruana de Ciencias Aplicadas (UPC)', null, 'Lima', 'Lima', -12.1956, -76.9741, null),
  ('92000000-0000-4000-8000-000000000010', 'AXIS Summit', 'Encuentro anual para reunir lideres, emprendedores y agentes de cambio. Un espacio para conectar, aprender y transformar el futuro.', null, '2025-12-05 14:00:00+00', '2025-12-06 23:00:00+00', 'Universidad Peruana de Ciencias Aplicadas (UPC)', null, 'in_person', null, true, 'leadupc', '44444444-4444-4444-4444-444444444444', 'open', null, 'Universidad Peruana de Ciencias Aplicadas (UPC)', null, 'Lima', 'Lima', -12.1956, -76.9741, null),
  ('92000000-0000-4000-8000-000000000011', 'LEAD Coderhouse - Intro a Programacion', 'Curso introductorio de programacion en colaboracion con Coderhouse. Aprende fundamentos de HTML, CSS y JavaScript.', null, '2026-01-20 20:00:00+00', '2026-01-20 23:00:00+00', 'Universidad Nacional de Ingenieria (UNI)', null, 'in_person', null, true, 'leaduni', '33333333-3333-3333-3333-333333333333', 'open', null, 'Universidad Nacional de Ingenieria (UNI)', null, 'Lima', 'Lima', -12.0247, -77.0483, null),
  ('92000000-0000-4000-8000-000000000012', 'Startup Weekend LEAD', 'Fin de semana intensivo para crear startups. Forma equipo, valida ideas y presenta tu pitch frente a mentores.', null, '2026-02-13 23:00:00+00', '2026-02-16 01:00:00+00', 'Universidad Peruana de Ciencias Aplicadas (UPC)', null, 'in_person', null, true, 'leadupc', '44444444-4444-4444-4444-444444444444', 'open', null, 'Universidad Peruana de Ciencias Aplicadas (UPC)', null, 'Lima', 'Lima', -12.1956, -76.9741, null),
  ('92000000-0000-4000-8000-000000000013', 'LEAD HER - Women in STEM', 'Panel de mujeres lideres en STEM compartiendo experiencias, aprendizajes y consejos para estudiantes de tecnologia, ingenieria y ciencias.', null, '2026-03-25 21:00:00+00', '2026-03-26 00:00:00+00', 'Pontificia Universidad Catolica del Peru (PUCP)', null, 'in_person', null, true, 'leadpucp', '44444444-4444-4444-4444-444444444444', 'open', null, 'Pontificia Universidad Catolica del Peru (PUCP)', null, 'Lima', 'Lima', -12.0696, -77.0794, null),
  ('92000000-0000-4000-8000-000000000014', 'MENTES EN VIVO - Diseno de Interfaces', 'Taller practico de diseno de interfaces con enfoque en UX/UI y decisiones centradas en el usuario.', null, '2026-04-28 21:00:00+00', '2026-04-29 00:00:00+00', 'Pontificia Universidad Catolica del Peru (PUCP)', null, 'in_person', null, true, 'leadpucp', '44444444-4444-4444-4444-444444444444', 'open', null, 'Pontificia Universidad Catolica del Peru (PUCP)', null, 'Lima', 'Lima', -12.0696, -77.0794, null),
  ('92000000-0000-4000-8000-000000000015', 'IBM Integration Day', 'Sesiones de integracion para nuevos miembros de LEAD. Aprende sobre cultura, valores, herramientas y oportunidades de la comunidad.', null, '2026-05-02 19:00:00+00', '2026-05-02 22:00:00+00', 'Pontificia Universidad Catolica del Peru (PUCP)', null, 'in_person', null, true, 'leadpucp', '44444444-4444-4444-4444-444444444444', 'open', null, 'Pontificia Universidad Catolica del Peru (PUCP)', null, 'Lima', 'Lima', -12.0696, -77.0794, null),
  ('92000000-0000-4000-8000-000000000016', 'Taller de Liderazgo para Nuevos Miembros', 'Sesion para fortalecer comunicacion, ownership y colaboracion en equipos universitarios de alto impacto.', null, '2026-06-12 20:00:00+00', '2026-06-12 23:00:00+00', 'Universidad Nacional de Ingenieria (UNI)', null, 'in_person', 80, true, 'leaduni', '33333333-3333-3333-3333-333333333333', 'open', null, 'Universidad Nacional de Ingenieria (UNI)', null, 'Lima', 'Lima', -12.0247, -77.0483, null),
  ('92000000-0000-4000-8000-000000000017', 'Product Sprint LEAD', 'Workshop intensivo para convertir problemas reales en prototipos claros, testeables y centrados en usuarios.', null, '2026-06-20 19:00:00+00', '2026-06-20 23:00:00+00', 'Universidad Peruana de Ciencias Aplicadas (UPC)', null, 'in_person', 45, true, 'leadupc', '44444444-4444-4444-4444-444444444444', 'application', null, 'Universidad Peruana de Ciencias Aplicadas (UPC)', null, 'Lima', 'Lima', -12.1956, -76.9741, null),
  ('92000000-0000-4000-8000-000000000018', 'Foro Mujeres en STEM', 'Conversatorio con estudiantes, egresadas y profesionales sobre rutas de crecimiento en ciencia, tecnologia e ingenieria.', null, '2026-07-02 21:00:00+00', '2026-07-03 00:00:00+00', 'Pontificia Universidad Catolica del Peru (PUCP)', null, 'hybrid', 120, true, 'leadpucp', '44444444-4444-4444-4444-444444444444', 'open', null, 'Pontificia Universidad Catolica del Peru (PUCP)', null, 'Lima', 'Lima', -12.0696, -77.0794, null),
  ('92000000-0000-4000-8000-000000000019', 'Pitch Lab para Emprendedores', 'Laboratorio practico para estructurar una propuesta, contar una historia y presentar una idea con claridad.', null, '2026-07-11 15:00:00+00', '2026-07-11 18:00:00+00', 'Universidad de Ingenieria y Tecnologia (UTEC)', null, 'in_person', 35, true, 'leadutec', '44444444-4444-4444-4444-444444444444', 'application', null, 'Universidad de Ingenieria y Tecnologia (UTEC)', null, 'Lima', 'Lima', -12.1348, -77.0224, null),
  ('92000000-0000-4000-8000-000000000020', 'Data Analytics Bootcamp', 'Bootcamp aplicado para aprender limpieza de datos, metricas, dashboards y storytelling con casos reales.', null, '2026-07-25 14:00:00+00', '2026-07-25 21:00:00+00', 'Universidad Nacional Mayor de San Marcos (UNMSM)', null, 'in_person', 60, true, 'leadunmsm', '44444444-4444-4444-4444-444444444444', 'application', null, 'Universidad Nacional Mayor de San Marcos (UNMSM)', null, 'Lima', 'Lima', -12.0561, -77.0845, null),
  ('92000000-0000-4000-8000-000000000021', 'Networking Intercapitulos Lima', 'Encuentro abierto para conectar estudiantes de distintos capitulos, compartir proyectos y formar nuevas colaboraciones.', null, '2026-08-06 23:00:00+00', '2026-08-07 02:00:00+00', 'Universidad San Ignacio de Loyola (USIL)', null, 'in_person', null, true, 'leadusil', '44444444-4444-4444-4444-444444444444', 'open', null, 'Universidad San Ignacio de Loyola (USIL)', null, 'Lima', 'Lima', -12.1558, -76.9996, null),
  ('92000000-0000-4000-8000-000000000022', 'Career Readiness Clinic', 'Clinica de empleabilidad con revision de CV, simulacion de entrevistas y consejos para procesos de seleccion.', null, '2026-08-15 20:00:00+00', '2026-08-15 23:00:00+00', 'Online', 'https://meet.google.com/lead-career-readiness', 'online', 150, true, 'leaduni', '33333333-3333-3333-3333-333333333333', 'open', null, 'Online', null, null, null, null, null, null),
  ('92000000-0000-4000-8000-000000000023', 'AI for Social Impact', 'Sesion virtual sobre inteligencia artificial aplicada a educacion, inclusion financiera y proyectos de impacto social.', null, '2026-08-28 22:00:00+00', '2026-08-29 00:00:00+00', 'Online', 'https://meet.google.com/lead-ai-impact', 'online', null, true, 'leadutec', '44444444-4444-4444-4444-444444444444', 'open', null, 'Online', null, null, null, null, null, null),
  ('92000000-0000-4000-8000-000000000024', 'Finanzas Personales para Universitarios', 'Taller practico para entender presupuesto, ahorro, deuda saludable e inversion inicial con ejemplos cotidianos.', null, '2026-09-05 19:00:00+00', '2026-09-05 22:00:00+00', 'Universidad Privada del Norte (UPN)', null, 'in_person', 70, true, 'leadupn', '44444444-4444-4444-4444-444444444444', 'open', null, 'Universidad Privada del Norte (UPN)', null, 'Lima', 'Lima', -11.9618, -77.0679, null),
  ('92000000-0000-4000-8000-000000000025', 'LEAD Tech Night', 'Noche de tecnologia con lightning talks, demos de proyectos estudiantiles y networking con invitados de la industria.', null, '2026-09-18 23:00:00+00', '2026-09-19 02:00:00+00', 'Universidad Tecnologica del Peru (UTP)', null, 'hybrid', 100, true, 'leadutp', '44444444-4444-4444-4444-444444444444', 'open', null, 'Universidad Tecnologica del Peru (UTP)', null, 'Lima', 'Lima', -12.0974, -77.0325, null),
  ('92000000-0000-4000-8000-000000000026', 'Public Speaking Lab', 'Laboratorio para practicar presentaciones, recibir feedback y ganar confianza al comunicar ideas.', null, '2026-10-03 15:00:00+00', '2026-10-03 18:00:00+00', 'Universidad Nacional de San Agustin de Arequipa', null, 'in_person', 50, true, 'leadunsa', '44444444-4444-4444-4444-444444444444', 'open', null, 'Universidad Nacional de San Agustin de Arequipa', null, 'Arequipa', 'Arequipa', -16.3988, -71.5369, null),
  ('92000000-0000-4000-8000-000000000027', 'Community Impact Challenge', 'Reto colaborativo para disenar iniciativas de impacto comunitario y presentar una propuesta accionable.', null, '2026-10-17 14:00:00+00', '2026-10-17 22:00:00+00', 'Universidad Cientifica del Sur', null, 'in_person', 40, true, 'leaducsur', '44444444-4444-4444-4444-444444444444', 'application', null, 'Universidad Cientifica del Sur', null, 'Lima', 'Lima', -12.1619, -76.9764, null),
  ('92000000-0000-4000-8000-000000000028', 'UX Research Workshop', 'Workshop aplicado para aprender entrevistas, sintesis de hallazgos y priorizacion de oportunidades de producto.', null, '2026-10-29 21:00:00+00', '2026-10-30 00:00:00+00', 'Universidad de Ingenieria y Tecnologia (UTEC)', null, 'hybrid', 65, true, 'leadutec', '44444444-4444-4444-4444-444444444444', 'open', null, 'Universidad de Ingenieria y Tecnologia (UTEC)', null, 'Lima', 'Lima', -12.1348, -77.0224, null),
  ('92000000-0000-4000-8000-000000000029', 'Founder Stories: Peru', 'Conversatorio con fundadores jovenes sobre primeros clientes, resiliencia y aprendizaje al construir proyectos.', null, '2026-11-12 23:00:00+00', '2026-11-13 01:00:00+00', 'Online', 'https://meet.google.com/lead-founder-stories', 'online', 200, true, 'leadpucp', '44444444-4444-4444-4444-444444444444', 'open', null, 'Online', null, null, null, null, null, null),
  ('92000000-0000-4000-8000-000000000030', 'Simulacion de Entrevistas', 'Sesiones por cupos para practicar entrevistas, recibir feedback directo y mejorar respuestas para procesos profesionales.', null, '2026-11-21 14:00:00+00', '2026-11-21 18:00:00+00', 'Universidad Nacional de Ingenieria (UNI)', null, 'in_person', 30, true, 'leaduni', '33333333-3333-3333-3333-333333333333', 'application', null, 'Universidad Nacional de Ingenieria (UNI)', null, 'Lima', 'Lima', -12.0247, -77.0483, null);

INSERT INTO public.event_application_question (
  id,
  event_id,
  question_type,
  question_text,
  options,
  is_required,
  sort_order
) VALUES
  ('92100000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000017', 'long_text', 'Por que quieres participar en Product Sprint LEAD?', null, true, 0),
  ('92100000-0000-4000-8000-000000000002', '92000000-0000-4000-8000-000000000017', 'single_select', 'Selecciona tu area principal de interes.', ARRAY['Producto', 'Diseno', 'Investigacion', 'Negocio'], true, 1),
  ('92100000-0000-4000-8000-000000000003', '92000000-0000-4000-8000-000000000017', 'url', 'Comparte un enlace a tu LinkedIn o portafolio.', null, false, 2),
  ('92100000-0000-4000-8000-000000000004', '92000000-0000-4000-8000-000000000019', 'short_text', 'Describe brevemente tu idea o proyecto.', null, true, 0),
  ('92100000-0000-4000-8000-000000000005', '92000000-0000-4000-8000-000000000019', 'checkbox', 'Que temas quieres trabajar durante la sesion?', ARRAY['Storytelling', 'Modelo de negocio', 'Validacion', 'Pitch deck'], true, 1),
  ('92100000-0000-4000-8000-000000000006', '92000000-0000-4000-8000-000000000019', 'long_text', 'Que feedback esperas recibir?', null, false, 2),
  ('92100000-0000-4000-8000-000000000007', '92000000-0000-4000-8000-000000000020', 'short_text', 'Que experiencia tienes con datos o analitica?', null, true, 0),
  ('92100000-0000-4000-8000-000000000008', '92000000-0000-4000-8000-000000000020', 'single_select', 'Selecciona tu nivel actual.', ARRAY['Inicial', 'Intermedio', 'Avanzado'], true, 1),
  ('92100000-0000-4000-8000-000000000009', '92000000-0000-4000-8000-000000000020', 'long_text', 'Que problema te gustaria aprender a analizar?', null, false, 2),
  ('92100000-0000-4000-8000-000000000010', '92000000-0000-4000-8000-000000000027', 'long_text', 'Que reto comunitario te interesa abordar y por que?', null, true, 0),
  ('92100000-0000-4000-8000-000000000011', '92000000-0000-4000-8000-000000000027', 'checkbox', 'Que habilidades puedes aportar al equipo?', ARRAY['Investigacion', 'Comunicacion', 'Diseno', 'Operaciones', 'Datos'], true, 1),
  ('92100000-0000-4000-8000-000000000012', '92000000-0000-4000-8000-000000000030', 'short_text', 'Que tipo de entrevista quieres practicar?', null, true, 0),
  ('92100000-0000-4000-8000-000000000013', '92000000-0000-4000-8000-000000000030', 'single_select', 'Selecciona tu foco principal.', ARRAY['Practica general', 'Consultoria', 'Tecnologia', 'Marketing', 'Finanzas'], true, 1);
