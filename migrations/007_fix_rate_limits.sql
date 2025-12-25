-- Migration: Fix rate_limits table schema
-- Add reset_at column (replaces window_start)

ALTER TABLE rate_limits ADD COLUMN reset_at INTEGER;

-- Copy data from window_start to reset_at
UPDATE rate_limits SET reset_at = window_start WHERE reset_at IS NULL;

-- Drop old column (SQLite doesn't support DROP COLUMN directly, need to recreate)
CREATE TABLE rate_limits_new (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at INTEGER NOT NULL
);

INSERT INTO rate_limits_new (key, count, reset_at)
SELECT key, count, COALESCE(reset_at, window_start) FROM rate_limits;

DROP TABLE rate_limits;
ALTER TABLE rate_limits_new RENAME TO rate_limits;

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
