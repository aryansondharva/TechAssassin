-- Enable real-time replication on tables
-- This allows clients to subscribe to database changes via WebSocket

DO $$
BEGIN
  -- Ensure publication exists
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add tables safely
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE events;
  EXCEPTION WHEN others THEN RAISE NOTICE '%', SQLERRM; END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE registrations;
  EXCEPTION WHEN others THEN RAISE NOTICE '%', SQLERRM; END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
  EXCEPTION WHEN others THEN RAISE NOTICE '%', SQLERRM; END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;
  EXCEPTION WHEN others THEN RAISE NOTICE '%', SQLERRM; END;
END $$;
