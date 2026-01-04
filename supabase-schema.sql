-- Fast! App Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'cancelled', 'expired')),
  subscription_plan TEXT CHECK (subscription_plan IN ('monthly', 'yearly')),
  stripe_customer_id TEXT,
  fasts_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fasting sessions table
CREATE TABLE fasting_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  target_hours INTEGER NOT NULL DEFAULT 24,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fasting notes table
CREATE TABLE fasting_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fasting_id UUID NOT NULL REFERENCES fasting_sessions(id) ON DELETE CASCADE,
  hour_mark INTEGER NOT NULL,
  mood TEXT NOT NULL CHECK (mood IN ('great', 'good', 'okay', 'tough', 'difficult')),
  energy_level INTEGER NOT NULL CHECK (energy_level BETWEEN 1 AND 5),
  hunger_level INTEGER NOT NULL CHECK (hunger_level BETWEEN 1 AND 5),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_notes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Fasting sessions policies
CREATE POLICY "Users can view own sessions"
  ON fasting_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON fasting_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON fasting_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Fasting notes policies
CREATE POLICY "Users can view own notes"
  ON fasting_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fasting_sessions
      WHERE fasting_sessions.id = fasting_notes.fasting_id
      AND fasting_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own notes"
  ON fasting_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fasting_sessions
      WHERE fasting_sessions.id = fasting_notes.fasting_id
      AND fasting_sessions.user_id = auth.uid()
    )
  );

-- Service role policy for webhook updates
CREATE POLICY "Service role can update profiles"
  ON profiles FOR UPDATE
  USING (TRUE)
  WITH CHECK (TRUE);

-- Indexes for performance
CREATE INDEX idx_fasting_sessions_user_id ON fasting_sessions(user_id);
CREATE INDEX idx_fasting_sessions_start_time ON fasting_sessions(start_time DESC);
CREATE INDEX idx_fasting_notes_fasting_id ON fasting_notes(fasting_id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, subscription_status, fasts_completed)
  VALUES (NEW.id, NEW.email, 'free', 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
