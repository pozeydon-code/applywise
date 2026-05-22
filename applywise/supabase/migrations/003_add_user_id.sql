-- Migration 003: add user_id to analyses and real per-user RLS policies
-- Run this in the Supabase SQL Editor after 002_rls_policies.sql

-- ============================================================
-- Add user_id column
-- ============================================================

ALTER TABLE analyses
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- ============================================================
-- Drop the generic deny-all policy (replaced by per-user policies)
-- ============================================================

DROP POLICY IF EXISTS "anon_no_access" ON analyses;

-- ============================================================
-- Per-user RLS policies — anon still has zero access (no policy = deny)
-- Authenticated users can only read/insert their own rows.
-- The service-role key (server admin) bypasses RLS entirely.
-- ============================================================

CREATE POLICY "users_read_own"
  ON analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own"
  ON analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Index for per-user listing
-- ============================================================

CREATE INDEX IF NOT EXISTS analyses_user_id_idx ON analyses (user_id);
