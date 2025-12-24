DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS analytics_events;
DROP TABLE IF EXISTS analytics_summary;
DROP TABLE IF EXISTS rate_limits;
DROP TABLE IF EXISTS nonces;
DROP TABLE IF EXISTS seals;

CREATE TABLE seals (
  id TEXT PRIMARY KEY,
  unlock_time INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  is_dms INTEGER NOT NULL DEFAULT 0,
  pulse_interval INTEGER,
  last_pulse INTEGER,
  pulse_token TEXT,
  key_b TEXT NOT NULL,
  iv TEXT NOT NULL,
  encrypted_blob TEXT,
  blob_hash TEXT,
  unlock_message TEXT,
  is_ephemeral INTEGER NOT NULL DEFAULT 0,
  max_views INTEGER,
  view_count INTEGER NOT NULL DEFAULT 0,
  first_viewed_at INTEGER,
  first_viewer_fingerprint TEXT,
  access_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  seal_id TEXT,
  ip TEXT,
  user_agent TEXT,
  metadata TEXT
);

CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  window_start INTEGER NOT NULL
);

CREATE TABLE nonces (
  nonce TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);

CREATE TABLE analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  path TEXT,
  referrer TEXT,
  country TEXT,
  timestamp INTEGER NOT NULL
);

CREATE TABLE analytics_summary (
  date TEXT PRIMARY KEY,
  total_page_views INTEGER NOT NULL DEFAULT 0,
  total_seals_created INTEGER NOT NULL DEFAULT 0,
  total_seals_unlocked INTEGER NOT NULL DEFAULT 0,
  total_pulses_received INTEGER NOT NULL DEFAULT 0,
  unique_countries INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_seals_unlock_time ON seals(unlock_time);
CREATE INDEX idx_seals_expires_at ON seals(expires_at);
CREATE INDEX idx_seals_dms_pulse ON seals(last_pulse);
CREATE INDEX idx_seals_ephemeral ON seals(id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_seal_id ON audit_logs(seal_id);
CREATE INDEX idx_audit_event_type ON audit_logs(event_type, timestamp);
CREATE INDEX idx_analytics_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_analytics_type_time ON analytics_events(event_type, timestamp);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);
CREATE INDEX idx_nonces_created ON nonces(created_at);

CREATE TRIGGER IF NOT EXISTS track_seal_created
AFTER INSERT ON seals
BEGIN
  INSERT INTO analytics_events (event_type, timestamp)
  VALUES ('seal_created', NEW.created_at);
END;
