-- Migration to store API ETags to prevent rate limiting
CREATE TABLE IF NOT EXISTS api_sync_state (
  endpoint text PRIMARY KEY,
  etag text NOT NULL,
  last_sync timestamptz DEFAULT now()
);

-- Protect table
ALTER TABLE api_sync_state ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (used by edge functions)
CREATE POLICY "Service role full access on api_sync_state"
  ON api_sync_state
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
