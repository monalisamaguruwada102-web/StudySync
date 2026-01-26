-- ==========================================
-- BOOKINGS DIAGNOSTIC QUERIES
-- Run these one by one to diagnose the issue
-- ==========================================

-- 1. Check if bookings table exists and has data
SELECT COUNT(*) as total_bookings FROM bookings;

-- 2. Check if you have any bookings
SELECT * FROM bookings LIMIT 5;

-- 3. Check current user (make sure you're logged in)
SELECT auth.uid() as current_user_id;

-- 4. Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'bookings';

-- 5. Check RLS policies on bookings table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'bookings';

-- 6. Test if you can select from bookings (as current user)
-- This will fail if RLS blocks you
SELECT * FROM bookings WHERE student_id = auth.uid() LIMIT 1;

-- 7. Check if profiles table has your user
SELECT id, email, name, role FROM profiles WHERE id = auth.uid();

-- 8. Raw bookings data (bypassing RLS - only works as postgres/admin)
-- SELECT * FROM bookings;

-- ==========================================
-- COMMON ISSUES & FIXES
-- ==========================================

-- ISSUE 1: No policies found
-- FIX: Run supabase_schema.sql to create policies

-- ISSUE 2: "new row violates row-level security policy"
-- FIX: Check that student_id matches auth.uid()

-- ISSUE 3: "permission denied for table bookings"
-- FIX: RLS is enabled but no policies allow access

-- ISSUE 4: Empty result but bookings exist
-- FIX: Policies are too restrictive, update them

-- ISSUE 5: "jwt expired" or "invalid JWT"
-- FIX: Session expired, log out and log back in
