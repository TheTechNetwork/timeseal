-- Migration: Add Ephemeral Seals Support
-- Self-destructing seals that auto-delete after N views

ALTER TABLE seals ADD COLUMN is_ephemeral INTEGER DEFAULT 0;
ALTER TABLE seals ADD COLUMN max_views INTEGER DEFAULT NULL;
ALTER TABLE seals ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE seals ADD COLUMN first_viewed_at INTEGER DEFAULT NULL;
ALTER TABLE seals ADD COLUMN first_viewer_fingerprint TEXT DEFAULT NULL;

-- Index for ephemeral seal queries
CREATE INDEX IF NOT EXISTS idx_seals_ephemeral ON seals(is_ephemeral) WHERE is_ephemeral = 1;
CREATE INDEX IF NOT EXISTS idx_seals_exhausted ON seals(is_ephemeral, view_count, max_views) WHERE is_ephemeral = 1;
