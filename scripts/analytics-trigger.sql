-- Add trigger to automatically track seal creation in analytics
CREATE TRIGGER IF NOT EXISTS track_seal_created
AFTER INSERT ON seals
BEGIN
  INSERT INTO analytics_events (event_type, timestamp)
  VALUES ('seal_created', NEW.created_at);
END;


-- Trigger for tracking seal deletions
CREATE TRIGGER IF NOT EXISTS track_seal_deleted
AFTER DELETE ON seals
BEGIN
  INSERT INTO analytics_events (event_type, timestamp)
  VALUES ('seal_deleted', unixepoch() * 1000);
END;
