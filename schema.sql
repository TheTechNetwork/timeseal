-- Time-Seal Database Schema

CREATE TABLE IF NOT EXISTS seals (
  id TEXT PRIMARY KEY,
  unlock_time INTEGER NOT NULL,
  is_dms INTEGER NOT NULL DEFAULT 0,
  pulse_interval INTEGER,
  last_pulse INTEGER,
  key_b TEXT NOT NULL,
  iv TEXT NOT NULL,
  pulse_token TEXT,
  created_at INTEGER NOT NULL,
  INDEX idx_unlock_time (unlock_time),
  INDEX idx_pulse_token (pulse_token),
  INDEX idx_dms_expired (is_dms, last_pulse, pulse_interval)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  seal_id TEXT NOT NULL,
  ip TEXT NOT NULL,
  metadata TEXT DEFAULT '{}',
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  INDEX idx_audit_seal_id (seal_id),
  INDEX idx_audit_timestamp (timestamp),
  INDEX idx_audit_event_type (event_type)
);

-- R2 Object Lock Configuration
-- Note: Object Lock must be enabled at bucket creation time
-- Use the following Wrangler configuration:

-- wrangler.toml:
-- [[r2_buckets]]
-- binding = "BUCKET"
-- bucket_name = "timeseal-vault"
-- object_lock = true

-- When uploading to R2, use retention mode:
-- await bucket.put(sealId, data, {
--   retention: {
--     mode: 'COMPLIANCE',
--     retainUntilDate: new Date(unlockTime)
--   }
-- });
