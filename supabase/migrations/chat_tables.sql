-- Create tables for chat system and tutorials in Supabase
-- Run this in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. First create Groups table (no dependencies)
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    members TEXT[] NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tutorials table (no dependencies)
CREATE TABLE IF NOT EXISTS tutorials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    youtube_url TEXT NOT NULL,
    module_id TEXT,
    topic TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Conversations table (references groups)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
    group_id UUID REFERENCES groups(id),
    participants TEXT[] NOT NULL,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Messages table (references conversations)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    shared_resource JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tutorials_user_id ON tutorials(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON groups(invite_code);

-- Enable Row Level Security
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tutorials
CREATE POLICY "tutorials_select" ON tutorials FOR SELECT USING (true);
CREATE POLICY "tutorials_insert" ON tutorials FOR INSERT WITH CHECK (true);
CREATE POLICY "tutorials_update" ON tutorials FOR UPDATE USING (true);
CREATE POLICY "tutorials_delete" ON tutorials FOR DELETE USING (true);

-- RLS Policies for conversations
CREATE POLICY "conversations_select" ON conversations FOR SELECT USING (true);
CREATE POLICY "conversations_insert" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "conversations_update" ON conversations FOR UPDATE USING (true);

-- RLS Policies for messages
CREATE POLICY "messages_select" ON messages FOR SELECT USING (true);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (true);

-- RLS Policies for groups
CREATE POLICY "groups_select" ON groups FOR SELECT USING (true);
CREATE POLICY "groups_insert" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "groups_update" ON groups FOR UPDATE USING (true);
