-- Supabase PostgreSQL schema for Ainthamizh AI backend

-- Users table for authenticated profiles
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  display_name TEXT,
  photo_url TEXT,
  preferred_level TEXT,
  native_language TEXT,
  analytics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs table for feature usage tracking
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  count_field TEXT NOT NULL,
  label TEXT NOT NULL,
  amount INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional index for faster user activity queries
CREATE INDEX IF NOT EXISTS activity_logs_user_id_created_at_idx ON activity_logs (user_id, created_at DESC);
