-- migration_v9_fix_tutorial_constraints.sql
-- Fixes 23502 (NOT NULL violation) by relaxing constraints on tutorials table

ALTER TABLE public.tutorials ALTER COLUMN url DROP NOT NULL;
ALTER TABLE public.tutorials ALTER COLUMN youtube_url DROP NOT NULL;
ALTER TABLE public.tutorials ALTER COLUMN title DROP NOT NULL;

-- Ensure all other columns from migration_v8 are also nullable/safe
ALTER TABLE public.tutorials ALTER COLUMN topic DROP NOT NULL;
ALTER TABLE public.tutorials ALTER COLUMN description DROP NOT NULL;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
