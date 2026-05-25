-- QA Test Data for LEAD Talent Platform
-- This file provides test personas for QA/staging environments
-- Legacy fixture only. Routine QA refreshes should run supabase/qa.seed.sql.
--
-- LEAD-010 note:
-- This file is a legacy migration fixture because it still writes
-- public.student_profile rows. Use it only when intentionally testing the
-- student_profile -> person_profile/chapter_membership migration path.
-- Routine QA personas should use supabase/seed.sql, which writes the layered
-- account model directly.

-- ============================================
-- USERS (Test Personas)
-- ============================================

-- Admin user
INSERT INTO "public"."user" ("id", "email", "name", "role") 
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@leadplatform.qa', 'QA Admin', 'admin')
ON CONFLICT DO NOTHING;

-- Chapter Editors
INSERT INTO "public"."user" ("id", "email", "name", "role") 
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'editor-pucp@leadplatform.qa', 'Maria Editor', 'editor'),
  ('00000000-0000-0000-0000-000000000003', 'editor-upc@leadplatform.qa', 'Carlos Editor', 'editor'),
  ('00000000-0000-0000-0000-000000000004', 'editor-uni@leadplatform.qa', 'Ana Editor', 'editor')
ON CONFLICT DO NOTHING;

-- Members (Students)
INSERT INTO "public"."user" ("id", "email", "name", "role") 
VALUES 
  ('00000000-0000-0000-0000-000000000010', 'student-1@uni.edu', 'Juan Student', 'member'),
  ('00000000-0000-0000-0000-000000000011', 'student-2@uni.edu', 'Sofia Student', 'member'),
  ('00000000-0000-0000-0000-000000000012', 'student-3@uni.edu', 'Pedro Student', 'member'),
  ('00000000-0000-0000-0000-000000000013', 'student-4@uni.edu', 'Lucia Student', 'member'),
  ('00000000-0000-0000-0000-000000000014', 'student-5@uni.edu', 'Diego Student', 'member')
ON CONFLICT DO NOTHING;

-- Recruiters
INSERT INTO "public"."user" ("id", "email", "name", "role") 
VALUES 
  ('00000000-0000-0000-0000-000000000020', 'recruiter-tech@company.com', 'Tech Recruiter', 'recruiter'),
  ('00000000-0000-0000-0000-000000000021', 'recruiter-finance@company.com', 'Finance Recruiter', 'recruiter'),
  ('00000000-0000-0000-0000-000000000022', 'recruiter-consulting@company.com', 'Consulting Recruiter', 'recruiter')
ON CONFLICT DO NOTHING;

-- ============================================
-- STUDENT PROFILES
-- ============================================

INSERT INTO "public"."student_profile" ("user_id", "chapter_id", "major", "graduation_year", "linkedin_url", "skills", "is_recruiter_visible", "approval_status", "is_filled") 
VALUES 
  ('00000000-0000-0000-0000-000000000010', 'leadpucp', 'Computer Science', 2027, 'https://linkedin.com/in/juanstudent', ARRAY['Python', 'Machine Learning', 'React'], true, 'approved', true),
  ('00000000-0000-0000-0000-000000000011', 'leadupc', 'Business Administration', 2026, 'https://linkedin.com/in/sofiastudent', ARRAY['Marketing', 'Product Management', 'Data Analysis'], true, 'approved', true),
  ('00000000-0000-0000-0000-000000000012', 'leaduni', 'Engineering', 2025, 'https://linkedin.com/in/pedrostudent', ARRAY['Finance', 'Startups'], false, 'pending', true),
  ('00000000-0000-0000-0000-000000000013', 'leadpucp', 'Data Science', 2027, 'https://linkedin.com/in/luciastudent', ARRAY['Python', 'Data Analysis', 'SQL'], true, 'approved', true),
  ('00000000-0000-0000-0000-000000000014', 'leadunmsm', 'Marketing', 2026, 'https://linkedin.com/in/diegostudent', ARRAY['Digital Marketing', 'Social Media'], false, 'rejected', false)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMPANIES
-- ============================================

INSERT INTO "public"."company" ("id", "name", "created_by_id") 
VALUES 
  ('00000000-0000-0000-0000-000000000100', 'Tech Corp Peru', '00000000-0000-0000-0000-000000000020'),
  ('00000000-0000-0000-0000-000000000101', 'Finance Partners Peru', '00000000-0000-0000-0000-000000000021'),
  ('00000000-0000-0000-0000-000000000102', 'Consulting Group Lima', '00000000-0000-0000-0000-000000000022')
ON CONFLICT DO NOTHING;

-- ============================================
-- RECRUITER ACCESS
-- ============================================

INSERT INTO "public"."recruiter_access" ("user_id", "company_id", "can_download_resume", "can_view_contact", "can_shortlist") 
VALUES 
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000100', true, true, true),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000101', true, false, true),
  ('00000000-0000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000102', true, true, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- CHAPTER MEMBERSHIP (for editors)
-- ============================================

INSERT INTO "public"."chapter_member" ("user_id", "chapter_id", "role") 
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'leadpucp', 'editor'),
  ('00000000-0000-0000-0000-000000000003', 'leadupc', 'editor'),
  ('00000000-0000-0000-0000-000000000004', 'leaduni', 'editor')
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE EVENTS
-- ============================================

INSERT INTO "public"."event" (
  "id", "title", "description", "start_at", "end_at", 
  "location", "event_type", "capacity", "is_published", 
  "chapter_id", "created_by_id", "access_model"
) VALUES (
  '00000000-0000-0000-0000-000000000200',
  'Tech Career Fair 2026',
  'Connect with top tech companies in Peru. Bring your resume!',
  '2026-06-15 10:00:00+00',
  '2026-06-15 18:00:00+00',
  'Centro de Convenciones Lima',
  'in_person',
  150,
  true,
  'leadpucp',
  '00000000-0000-0000-0000-000000000002',
  'open'
), (
  '00000000-0000-0000-0000-000000000201',
  'AI Workshop: Build Your First Model',
  'Hands-on workshop on building machine learning models.',
  '2026-06-20 14:00:00+00',
  '2026-06-20 17:00:00+00',
  'Online (Zoom)',
  'online',
  50,
  true,
  'leadupc',
  '00000000-0000-0000-0000-000000000003',
  'open'
), (
  '00000000-0000-0000-0000-000000000202',
  'Investment Banking Panel',
  'Learn about careers in investment banking from industry professionals.',
  '2026-06-25 16:00:00+00',
  '2026-06-25 18:00:00+00',
  'Universidad de Lima Auditorium',
  'in_person',
  80,
  false,
  'leaduni',
  '00000000-0000-0000-0000-000000000004',
  'application'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- EVENT REGISTRATIONS
-- ============================================

INSERT INTO "public"."event_registration" ("user_id", "event_id", "status", "qr_token") 
VALUES 
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000200', 'registered', gen_random_uuid()),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000200', 'registered', gen_random_uuid()),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000201', 'registered', gen_random_uuid()),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000201', 'registered', gen_random_uuid())
ON CONFLICT DO NOTHING;

-- ============================================
-- APPLICATION-BASED REGISTRATION
-- ============================================

INSERT INTO "public"."event_registration" ("user_id", "event_id", "status", "application_answers", "qr_token") 
VALUES 
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000202', 'pending', '{"why_attend": "Want to learn about investment banking careers", "experience": "Finance club member"}', gen_random_uuid())
ON CONFLICT DO NOTHING;

-- ============================================
-- SAVED STUDENTS (Recruiter Shortlists)
-- ============================================

INSERT INTO "public"."saved_student" ("recruiter_id", "student_id", "company_id", "notes") 
VALUES 
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000100', 'Strong technical background. Interview-ready.'),
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000100', 'Great data science skills.')
ON CONFLICT DO NOTHING;

-- ============================================
-- RESUMES (Stub records - actual files in storage)
-- ============================================

INSERT INTO "public"."resume" ("student_id", "file_name", "file_path", "file_size") 
VALUES 
  ('00000000-0000-0000-0000-000000000010', 'juan-student-resume.pdf', 'resumes/juan-student-resume.pdf', 45000),
  ('00000000-0000-0000-0000-000000000011', 'sofia-student-resume.pdf', 'resumes/sofia-student-resume.pdf', 52000),
  ('00000000-0000-0000-0000-000000000013', 'lucia-student-resume.pdf', 'resumes/lucia-student-resume.pdf', 48000)
ON CONFLICT DO NOTHING;

-- ============================================
-- RESUME DOWNLOAD LOGS
-- ============================================

INSERT INTO "public"."resume_download_log" ("resume_id", "recruiter_id", "downloaded_at") 
VALUES 
  ((SELECT id FROM "public"."resume" WHERE "student_id" = '00000000-0000-0000-0000-000000000010' LIMIT 1), '00000000-0000-0000-0000-000000000020', NOW() - INTERVAL '1 day'),
  ((SELECT id FROM "public"."resume" WHERE "student_id" = '00000000-0000-0000-0000-000000000013' LIMIT 1), '00000000-0000-0000-0000-000000000020', NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;
