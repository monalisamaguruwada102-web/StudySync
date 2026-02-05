-- migration_v2.sql
-- 1. Create Profiles Table for User Stats
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  xp integer default 0,
  level integer default 1,
  badges text[] default '{}',
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Enable RLS on Profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 3. Trigger: Create Profile on Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, xp, level, badges)
  values (new.id, new.email, 0, 1, '{}');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Enable RLS on all study tables (if not already enabled)
-- Modules
alter table public.modules enable row level security;
drop policy if exists "Users can view own modules" on modules;
create policy "Users can view own modules" on modules for select using (auth.uid()::text = user_id);
drop policy if exists "Users can insert own modules" on modules;
create policy "Users can insert own modules" on modules for insert with check (auth.uid()::text = user_id);
drop policy if exists "Users can update own modules" on modules;
create policy "Users can update own modules" on modules for update using (auth.uid()::text = user_id);
drop policy if exists "Users can delete own modules" on modules;
create policy "Users can delete own modules" on modules for delete using (auth.uid()::text = user_id);

-- Tasks
alter table public.tasks enable row level security;
drop policy if exists "Users can view own tasks" on tasks;
create policy "Users can view own tasks" on tasks for select using (auth.uid()::text = user_id);
drop policy if exists "Users can insert own tasks" on tasks;
create policy "Users can insert own tasks" on tasks for insert with check (auth.uid()::text = user_id);
drop policy if exists "Users can update own tasks" on tasks;
create policy "Users can update own tasks" on tasks for update using (auth.uid()::text = user_id);
drop policy if exists "Users can delete own tasks" on tasks;
create policy "Users can delete own tasks" on tasks for delete using (auth.uid()::text = user_id);

-- Study Logs
alter table public.study_logs enable row level security;
drop policy if exists "Users can view own logs" on study_logs;
create policy "Users can view own logs" on study_logs for select using (auth.uid()::text = user_id);
drop policy if exists "Users can insert own logs" on study_logs;
create policy "Users can insert own logs" on study_logs for insert with check (auth.uid()::text = user_id);

-- Notes
alter table public.notes enable row level security;
drop policy if exists "Users can view own notes" on notes;
create policy "Users can view own notes" on notes for select using (auth.uid()::text = user_id);
drop policy if exists "Users can insert own notes" on notes;
create policy "Users can insert own notes" on notes for insert with check (auth.uid()::text = user_id);
drop policy if exists "Users can update own notes" on notes;
create policy "Users can update own notes" on notes for update using (auth.uid()::text = user_id);
drop policy if exists "Users can delete own notes" on notes;
create policy "Users can delete own notes" on notes for delete using (auth.uid()::text = user_id);

-- Flashcards
alter table public.flashcard_decks enable row level security;
create policy "Users can view own decks" on flashcard_decks for select using (auth.uid()::text = user_id);
create policy "Users can insert own decks" on flashcard_decks for insert with check (auth.uid()::text = user_id);

alter table public.flashcards enable row level security;
create policy "Users can view own cards" on flashcards for select using (auth.uid()::text = user_id);
create policy "Users can insert own cards" on flashcards for insert with check (auth.uid()::text = user_id);
