-- 1. ENABLE VECTOR EXTENSION (For AI Semantic Search)
-- This allows us to store "embeddings" of your notes/PDFs and search them by meaning.
create extension if not exists vector;

-- Create a table to store document embeddings
create table if not exists document_embeddings (
  id bigserial primary key,
  content text, -- The actual text chunk
  metadata jsonb, -- e.g., { "pdf_path": "...", "page": 5 }
  embedding vector(1536), -- 1536 dimensions (compatible with OpenAI text-embedding-ada-002)
  user_id text -- For strict privacy
);

-- 2. AUTOMATED GAMIFICATION (XP Trigger)
-- This function runs automatically whenever a task is updated.
create or replace function award_xp_on_completion()
returns trigger as $$
begin
  -- Check if the status changed to 'Completed' from something else
  if new.status = 'Completed' and old.status != 'Completed' then
    -- Award 50 XP to the user
    -- We assume the 'users' table or profile metadata is stored. 
    -- Since we might not have a dedicated 'users' table in public (Supabase uses auth.users),
    -- we might need to update a 'profiles' table or similar.
    -- For this app, let's assume we update a 'profiles' table or do nothing if it doesn't exist yet.
    
    -- NOTE: You need a 'profiles' table for this to work perfectly.
    -- If you store XP in local storage only, this server-side trigger won't update the client immediately
    -- unless you use Realtime.
    
    -- Example logic (commented out until 'profiles' table is confirmed):
    -- update profiles 
    -- set xp = xp + 50 
    -- where id = new.user_id;
    
    null; -- Placeholder
  end if;
  return new;
end;
$$ language plpgsql;

-- Attach the trigger to the tasks table
drop trigger if exists check_task_completion on tasks;
create trigger check_task_completion
after update on tasks
for each row
execute function award_xp_on_completion();

-- 3. ROW LEVEL SECURITY (RLS) - PRIVACY
-- Ensure users can ONLY seeing their own data.
-- We apply this to the 'modules' table as a critical example.

alter table modules enable row level security;

-- Policy: Users can see their own modules
create policy "Users can view own modules"
on modules for select
using ( auth.uid()::text = user_id );

-- Policy: Users can insert their own modules
create policy "Users can insert own modules"
on modules for insert
with check ( auth.uid()::text = user_id );

-- Policy: Users can update their own modules
create policy "Users can update own modules"
on modules for update
using ( auth.uid()::text = user_id );

-- Repeat for other tables (tasks, study_logs, etc.) as needed.
alter table tasks enable row level security;
create policy "Users can view own tasks" on tasks for select using ( auth.uid()::text = user_id );
create policy "Users can insert own tasks" on tasks for insert with check ( auth.uid()::text = user_id );
create policy "Users can update own tasks" on tasks for update using ( auth.uid()::text = user_id );
