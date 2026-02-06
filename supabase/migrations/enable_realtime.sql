-- Enable Realtime for Chat Tables
begin;
  -- Remove existing if any (to avoid duplicates)
  drop publication if exists supabase_realtime;
  
  -- Create publication for all relevant tables
  create publication supabase_realtime for table messages, conversations;
commit;

-- Alternatively, add to existing publication if 'supabase_realtime' already exists
-- alter publication supabase_realtime add table messages;
-- alter publication supabase_realtime add table conversations;
