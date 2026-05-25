-- QA seed entrypoint for the shared LEAD QA environment.
--
-- Run this intentionally through the "Refresh QA Data" GitHub Action.
-- Normal dev pushes apply migrations only and must not reseed QA data.
--
-- Current baseline: reuse the canonical deterministic seed personas and demo data.
-- Add QA-only fixtures below this include as the shared test environment needs them.
\i supabase/seed.sql
