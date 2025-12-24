-- Add trigger to automatically track seal creation in analytics
CREATE TRIGGER IF NOT EXISTS track_seal_created
AFTER INSERT ON seals
BEGIN
  INSERT INTO analytics_events (event_type, timestamp)
  VALUES ('seal_created', NEW.created_at);
END;
