-- ==========================================
-- OFF REZ CONNECT - SUPABASE SCHEMA
-- Complete Database Setup (Optimized)
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABLES
-- ==========================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('student', 'owner', 'admin')),
  verification_status TEXT DEFAULT 'none' CHECK (verification_status IN ('none', 'pending', 'verified')),
  avatar TEXT,
  id_document_url TEXT,
  bio TEXT,
  phone_number TEXT,
  expo_push_token TEXT,
  student_id_verified BOOLEAN DEFAULT false,
  boost_credits INTEGER DEFAULT 0,
  life_tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1b. Create Auto-Profile Trigger Function (Secure)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, verification_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    'none'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1c. Create Admin Check Function (Secure)
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1d. Apply Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. LISTINGS
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  owner_name TEXT,
  owner_phone TEXT,
  owner_avatar TEXT,
  property_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  location TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'mixed')),
  max_occupancy INTEGER DEFAULT 1,
  amenities TEXT[], 
  images TEXT[], 
  is_verified BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  boost_expiry TIMESTAMP WITH TIME ZONE,
  boost_status TEXT DEFAULT 'none', 
  boost_period TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  ecocash_number TEXT,
  is_priority_verification BOOLEAN DEFAULT false,
  full_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT,
  rating NUMERIC CHECK (rating >= 0 AND rating <= 5),
  comment TEXT,
  cleanliness_rating INTEGER,
  location_rating INTEGER,
  value_rating INTEGER,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'cancelled')),
  total_price NUMERIC,
  payment_reference TEXT,
  listing_title TEXT,
  student_name TEXT,
  student_phone TEXT,
  owner_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. RENT PAYMENTS
CREATE TABLE IF NOT EXISTS rent_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  month_year TEXT NOT NULL, 
  status TEXT DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'late')),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. MAINTENANCE REQUESTS
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'resolved', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. LEASES
CREATE TABLE IF NOT EXISTS leases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  house_rules TEXT,
  deposit_terms TEXT,
  rent_schedule TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'expired', 'cancelled')),
  pdf_url TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. UTILITY BILLS
CREATE TABLE IF NOT EXISTS utility_bills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  bill_type TEXT CHECK (bill_type IN ('electricity', 'water', 'internet', 'other')),
  total_amount NUMERIC NOT NULL,
  split_amount NUMERIC NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'paid')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. VISITOR PASSES
CREATE TABLE IF NOT EXISTS visitor_passes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  visit_date DATE NOT NULL,
  qr_code_content TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'scanned', 'expired', 'cancelled')),
  scanned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. CONVERSATIONS (for Chat)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  participant_ids UUID[] NOT NULL,
  participant_names JSONB,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. MESSAGES (for Chat)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. BOOKMARKS
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, listing_id)
);

-- 13. ANALYTICS (Views and Saves)
CREATE TABLE IF NOT EXISTS analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT CHECK (event_type IN ('view', 'save')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- OPTIMIZED RLS POLICIES
-- Using (select auth.uid()) pattern for performance
-- ==========================================

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users and Admins can update profiles" ON profiles FOR UPDATE USING ((select auth.uid()) = id OR is_admin());
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- Listings
CREATE POLICY "Listings are viewable by everyone" ON listings FOR SELECT USING (true);
CREATE POLICY "Owners can insert listings" ON listings FOR INSERT WITH CHECK ((select auth.uid()) = owner_id);
CREATE POLICY "Owners and Admins can update listings" ON listings FOR UPDATE USING ((select auth.uid()) = owner_id OR is_admin());
CREATE POLICY "Owners can delete their listings" ON listings FOR DELETE USING ((select auth.uid()) = owner_id);

-- Reviews
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON reviews FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own reviews" ON reviews FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete their own reviews" ON reviews FOR DELETE USING ((select auth.uid()) = user_id);

-- Bookings
CREATE POLICY "Users can see their own bookings" ON bookings FOR SELECT USING ((select auth.uid()) = student_id OR (select auth.uid()) = owner_id);
CREATE POLICY "Students can create bookings" ON bookings FOR INSERT WITH CHECK ((select auth.uid()) = student_id);
CREATE POLICY "Owners can update booking status" ON bookings FOR UPDATE USING ((select auth.uid()) = owner_id OR (select auth.uid()) = student_id);

-- Rent Payments
CREATE POLICY "Users can see their own rent history" ON rent_payments FOR SELECT USING ((select auth.uid()) = student_id OR (select auth.uid()) = owner_id);
CREATE POLICY "Owners can log payments" ON rent_payments FOR INSERT WITH CHECK ((select auth.uid()) = owner_id);

-- Maintenance Requests
CREATE POLICY "Users can see their own requests" ON maintenance_requests FOR SELECT USING ((select auth.uid()) = student_id OR (select auth.uid()) = owner_id);
CREATE POLICY "Students can create requests" ON maintenance_requests FOR INSERT WITH CHECK ((select auth.uid()) = student_id);
CREATE POLICY "Owners/Students can update status" ON maintenance_requests FOR UPDATE USING ((select auth.uid()) = owner_id OR (select auth.uid()) = student_id);

-- Leases
CREATE POLICY "Users can see their own leases" ON leases FOR SELECT USING ((select auth.uid()) = student_id OR (select auth.uid()) = owner_id);
CREATE POLICY "Owners can create leases" ON leases FOR INSERT WITH CHECK ((select auth.uid()) = owner_id);
CREATE POLICY "Owners/Students can update signed status" ON leases FOR UPDATE USING ((select auth.uid()) = owner_id OR (select auth.uid()) = student_id);

-- Utility Bills
CREATE POLICY "Users can see utility bills for their listings" ON utility_bills FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.listing_id = utility_bills.listing_id 
    AND (bookings.student_id = (select auth.uid()) OR bookings.owner_id = (select auth.uid()))
  )
);
CREATE POLICY "Owners can create utility bills" ON utility_bills FOR INSERT WITH CHECK ((select auth.uid()) = owner_id);

-- Visitor Passes
CREATE POLICY "Students can manage their visitors" ON visitor_passes FOR ALL USING ((select auth.uid()) = student_id);
CREATE POLICY "Owners can see visitors for their properties" ON visitor_passes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM listings 
    WHERE listings.id = visitor_passes.listing_id 
    AND listings.owner_id = (select auth.uid())
  )
);

-- Conversations
CREATE POLICY "Users can see their conversations" ON conversations FOR SELECT USING ((select auth.uid()) = ANY(participant_ids));
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK ((select auth.uid()) = ANY(participant_ids));
CREATE POLICY "Users can update their conversations" ON conversations FOR UPDATE USING ((select auth.uid()) = ANY(participant_ids));

-- Messages
CREATE POLICY "Users can see messages in their conversations" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (select auth.uid()) = ANY(conversations.participant_ids)
  )
);
CREATE POLICY "Users can send messages to their conversations" ON messages FOR INSERT WITH CHECK (
  (select auth.uid()) = sender_id AND
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (select auth.uid()) = ANY(conversations.participant_ids)
  )
);

-- Bookmarks
CREATE POLICY "Users can see their bookmarks" ON bookmarks FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can add bookmarks" ON bookmarks FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can remove bookmarks" ON bookmarks FOR DELETE USING ((select auth.uid()) = user_id);

-- Analytics
CREATE POLICY "Public can track views" ON analytics FOR INSERT WITH CHECK ((select auth.role()) = 'anon' OR (select auth.role()) = 'authenticated');
CREATE POLICY "Public can see view counts" ON analytics FOR SELECT USING ((select auth.role()) = 'anon' OR (select auth.role()) = 'authenticated');

-- ==========================================
-- STORAGE SETUP
-- ==========================================

-- Create Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('user-assets', 'user-assets', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('verifications', 'verifications', false) ON CONFLICT DO NOTHING;

-- Storage Policies (Optimized)

-- 1. listing-images
CREATE POLICY "Public Access Listing Images" ON storage.objects FOR SELECT USING (bucket_id = 'listing-images');
CREATE POLICY "Auth Upload Listing Images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listing-images' AND (select auth.role()) = 'authenticated');
CREATE POLICY "Owner Delete Listing Images" ON storage.objects FOR DELETE USING (bucket_id = 'listing-images' AND (select auth.uid()) = owner);
CREATE POLICY "Owner Update Listing Images" ON storage.objects FOR UPDATE USING (bucket_id = 'listing-images' AND (select auth.uid()) = owner);

-- 2. user-assets (Avatars)
CREATE POLICY "Public Access User Assets" ON storage.objects FOR SELECT USING (bucket_id = 'user-assets');
CREATE POLICY "Auth Upload User Assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'user-assets' AND (select auth.role()) = 'authenticated');
CREATE POLICY "User Update Own Assets" ON storage.objects FOR UPDATE USING (bucket_id = 'user-assets' AND (select auth.uid()) = owner);
CREATE POLICY "User Delete Own Assets" ON storage.objects FOR DELETE USING (bucket_id = 'user-assets' AND (select auth.uid()) = owner);

-- 3. verifications (Private)
CREATE POLICY "Auth Upload Verifications" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'verifications' AND (select auth.role()) = 'authenticated');
CREATE POLICY "Users can view own verifications" ON storage.objects FOR SELECT USING (bucket_id = 'verifications' AND (select auth.uid()) = owner);

-- ==========================================
-- ENABLE REALTIME
-- ==========================================
-- Run these commands in Supabase SQL Editor to enable realtime:
-- alter publication supabase_realtime add table messages;
-- alter publication supabase_realtime add table conversations;
-- alter publication supabase_realtime add table bookings;
-- alter publication supabase_realtime add table reviews;
-- alter publication supabase_realtime add table listings;

-- ==========================================
-- VIEWS
-- ==========================================

-- Owner Revenue Stats View
CREATE OR REPLACE VIEW owner_revenue_stats AS
SELECT 
  owner_id,
  listing_id,
  month_year,
  SUM(amount) as total_revenue,
  COUNT(id) as payment_count,
  MAX(payment_date) as last_payment_at
FROM rent_payments
WHERE status = 'paid'
GROUP BY owner_id, listing_id, month_year;
