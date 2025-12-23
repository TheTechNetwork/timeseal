-- TimeSeal Database Schema
CREATE TABLE IF NOT EXISTS seals (
  id TEXT PRIMARY KEY,
  unlock_time INTEGER NOT NULL,
  is_dms INTEGER NOT NULL,
  pulse_interval INTEGER,
  last_pulse INTEGER,
  key_b TEXT NOT NULL,
  iv TEXT NOT NULL,
  encrypted_blob TEXT,
  pulse_token TEXT,
  created_at INTEGER NOT NULL,
  blob_hash TEXT,
  unlock_message TEXT,
  expires_at INTEGER,
  access_count INTEGER DEFAULT 0,
  -- Ephemeral seal fields
  is_ephemeral INTEGER DEFAULT 0,
  max_views INTEGER DEFAULT NULL,
  view_count INTEGER DEFAULT 0,
  first_viewed_at INTEGER DEFAULT NULL,
  first_viewer_fingerprint TEXT DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_seals_unlock_time ON seals(unlock_time);
CREATE INDEX IF NOT EXISTS idx_seals_pulse ON seals(pulse_interval, last_pulse);
CREATE INDEX IF NOT EXISTS idx_seals_pulse_token ON seals(pulse_token);
CREATE INDEX IF NOT EXISTS idx_seals_dms_expired ON seals(is_dms, last_pulse, pulse_interval) WHERE is_dms = 1;
CREATE INDEX IF NOT EXISTS idx_seals_ephemeral ON seals(is_ephemeral) WHERE is_ephemeral = 1;
CREATE INDEX IF NOT EXISTS idx_seals_exhausted ON seals(is_ephemeral, view_count, max_views) WHERE is_ephemeral = 1;

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);

-- Nonce tracking for replay protection
CREATE TABLE IF NOT EXISTS nonces (
  nonce TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nonces_expires ON nonces(expires_at);
CREATE INDEX IF NOT EXISTS idx_nonces_nonce ON nonces(nonce);
