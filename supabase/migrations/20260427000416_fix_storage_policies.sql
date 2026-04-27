-- Migration: Fix storage bucket policies — remove broad SELECT on storage.objects
-- For public buckets, files are accessible via direct URL without RLS.
-- Broad SELECT policies allow listing ALL filenames, which is an info leak.

-- ─────────────────────────────────────────────────────────────────
-- event-covers bucket
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read event covers" ON storage.objects;

-- ─────────────────────────────────────────────────────────────────
-- resumes bucket
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow authenticated read resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can read resumes" ON storage.objects;

-- Add a targeted resume-read policy: users can only read their own resume
CREATE POLICY "Users can read own resume"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add a targeted event-cover read policy: authenticated users can read event covers
-- (event covers are meant to be public, but we restrict listing)
CREATE POLICY "Authenticated can read event covers"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'event-covers');
