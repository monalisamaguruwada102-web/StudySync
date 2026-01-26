-- ==========================================
-- PERFORMANCE INDICES FOR OFF REZ CONNECT
-- Run this in Supabase SQL Editor AFTER applying supabase_schema.sql
-- ==========================================

-- Speed up booking queries by student_id
CREATE INDEX IF NOT EXISTS idx_bookings_student_created 
ON bookings(student_id, created_at DESC);

-- Speed up booking queries by owner_id
CREATE INDEX IF NOT EXISTS idx_bookings_owner_created 
ON bookings(owner_id, created_at DESC);

-- Speed up listing queries
CREATE INDEX IF NOT EXISTS idx_listings_owner 
ON listings(owner_id);

CREATE INDEX IF NOT EXISTS idx_listings_premium_created 
ON listings(is_premium DESC, created_at DESC);

-- Speed up review queries
CREATE INDEX IF NOT EXISTS idx_reviews_listing_created 
ON reviews(listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_user 
ON reviews(user_id);

-- Speed up bookmark lookups
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_listing 
ON bookmarks(user_id, listing_id);

-- Speed up conversation queries (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_conversations_participants 
ON conversations USING GIN(participant_ids);

-- Speed up message queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender 
ON messages(sender_id);

-- Speed up analytics
CREATE INDEX IF NOT EXISTS idx_analytics_listing 
ON analytics(listing_id);

-- ==========================================
-- VERIFY INDICES CREATED
-- ==========================================
-- Run this query to see all indices:
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
