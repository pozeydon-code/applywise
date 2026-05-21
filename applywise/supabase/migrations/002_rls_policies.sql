-- Migration 002: explicit RLS policies for analyses table
-- Run this in the Supabase SQL Editor after 001_analyses.sql

-- ============================================================
-- Deny all direct access from anonymous clients.
-- The app uses the service-role key (server-only), which bypasses
-- RLS and retains full access. This policy makes the security
-- intent explicit and visible in the Supabase dashboard.
-- ============================================================

CREATE POLICY "anon_no_access"
  ON analyses
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- ============================================================
-- Future-ready: authenticated users can only read their own
-- analyses. Requires adding a user_id column and wiring Supabase
-- Auth — uncomment when login is implemented.
-- ============================================================

-- ALTER TABLE analyses ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
--
-- CREATE POLICY "users_read_own"
--   ON analyses
--   FOR SELECT
--   TO authenticated
--   USING (auth.uid() = user_id);
--
-- CREATE POLICY "users_insert_own"
--   ON analyses
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (auth.uid() = user_id);
