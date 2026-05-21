-- Migration 001: analyses table with RLS
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- ============================================================
-- Table
-- ============================================================

CREATE TABLE IF NOT EXISTS analyses (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz   NOT NULL DEFAULT now(),
  job_role    text,
  score       smallint      NOT NULL CHECK (score >= 0 AND score <= 100),
  result_snapshot jsonb     NOT NULL
);

-- ============================================================
-- RLS — Row Level Security
-- Enabled on every table as required by rubric.
-- The server uses the service-role key which bypasses RLS.
-- Anon clients (browser) cannot read or write this table directly.
-- ============================================================

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- No anon SELECT policy → anon clients cannot read analyses.
-- No anon INSERT policy → anon clients cannot write analyses.
-- Service-role key (server-only) bypasses RLS and has full access.

-- Optional: expose a read-only view of recent scores for a future
-- public dashboard (uncomment if needed):
--
-- CREATE POLICY "Public can read own score summary"
-- ON analyses FOR SELECT
-- TO anon
-- USING (true);

-- ============================================================
-- Index for listing recent analyses efficiently
-- ============================================================

CREATE INDEX IF NOT EXISTS analyses_created_at_idx ON analyses (created_at DESC);

-- ============================================================
-- Verify setup (run after migration)
-- ============================================================
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'analyses';
-- Expected: tablename=analyses, rowsecurity=true
