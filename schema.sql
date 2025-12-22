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
  access_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_seals_unlock_time ON seals(unlock_time);
CREATE INDEX IF NOT EXISTS idx_seals_pulse ON seals(pulse_interval, last_pulse);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);

-- Nonce tracking for replay protection
CREATE TABLE IF NOT EXISTS nonces (
  nonce TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nonces_expires ON nonces(expires_at);
