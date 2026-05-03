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
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'participant@test.com', '$2a$10$w81D7fEOnqA7n5.y12P9T.iQ1Tj.k/qY69L4B1O/rJ8J8fQ/eY83i', NOW(), NOW(), NOW(), '', '', '', ''),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member@test.com', '$2a$10$w81D7fEOnqA7n5.y12P9T.iQ1Tj.k/qY69L4B1O/rJ8J8fQ/eY83i', NOW(), NOW(), NOW(), '', '', '', ''),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'editor@test.com', '$2a$10$w81D7fEOnqA7n5.y12P9T.iQ1Tj.k/qY69L4B1O/rJ8J8fQ/eY83i', NOW(), NOW(), NOW(), '', '', '', ''),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.com', '$2a$10$w81D7fEOnqA7n5.y12P9T.iQ1Tj.k/qY69L4B1O/rJ8J8fQ/eY83i', NOW(), NOW(), NOW(), '', '', '', ''),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'staff@test.com', '$2a$10$w81D7fEOnqA7n5.y12P9T.iQ1Tj.k/qY69L4B1O/rJ8J8fQ/eY83i', NOW(), NOW(), NOW(), '', '', '', ''),
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'recruiter@test.com', '$2a$10$w81D7fEOnqA7n5.y12P9T.iQ1Tj.k/qY69L4B1O/rJ8J8fQ/eY83i', NOW(), NOW(), NOW(), '', '', '', ''),
  ('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alumni@test.com', '$2a$10$w81D7fEOnqA7n5.y12P9T.iQ1Tj.k/qY69L4B1O/rJ8J8fQ/eY83i', NOW(), NOW(), NOW(), '', '', '', '');

-- Align app-account rows created by public.handle_new_user().
UPDATE public."user" SET name = 'Test Participant', role = 'member' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE public."user" SET name = 'Test Member', role = 'member' WHERE id = '22222222-2222-2222-2222-222222222222';
UPDATE public."user" SET name = 'Test Editor', role = 'editor' WHERE id = '33333333-3333-3333-3333-333333333333';
UPDATE public."user" SET name = 'Test Admin', role = 'admin' WHERE id = '44444444-4444-4444-4444-444444444444';
UPDATE public."user" SET name = 'Test Staff', role = 'admin' WHERE id = '55555555-5555-5555-5555-555555555555';
UPDATE public."user" SET name = 'Test Recruiter', role = 'recruiter' WHERE id = '66666666-6666-6666-6666-666666666666';
UPDATE public."user" SET name = 'Test Alumni', role = 'member' WHERE id = '77777777-7777-7777-7777-777777777777';

-- Insert Person Profiles (using user_id)
INSERT INTO public.person_profile (id, user_id, is_recruiter_visible) VALUES
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', false),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', true),
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', false),
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', false),
  ('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', false),
  ('66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', false),
  ('77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', true);

-- Insert Chapter Memberships (using user_id instead of person_id, role is mapped to position in new schema)
INSERT INTO public.chapter_membership (user_id, chapter_id, position, status) VALUES
  ('22222222-2222-2222-2222-222222222222', 'leaduni', 'member', 'approved'),
  ('33333333-3333-3333-3333-333333333333', 'leaduni', 'editor', 'approved'),
  ('77777777-7777-7777-7777-777777777777', 'leaduni', 'member', 'alumni');

-- Insert Lead Identities (Global Roles) (using user_id)
INSERT INTO public.lead_identity (user_id, identity_type) VALUES
  ('44444444-4444-4444-4444-444444444444', 'founder'),
  ('55555555-5555-5555-5555-555555555555', 'staff');

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
