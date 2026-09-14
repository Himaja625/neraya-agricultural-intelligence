/*
# Velmora Core Schema

## Overview
Creates the complete database schema for Velmora, an agricultural intelligence platform.
This migration creates all tables for farmer profiles, fields, crop assessments,
AI conversations, community features, alerts, and moderation.

## Tables Created

1. **farmer_profiles** - Extends auth.users with farmer-specific info (name, language, location, crops, experience, preferences)
2. **fields** - Individual farm fields with crop info, location, area, growth stage, planting date
3. **crop_assessments** - AI crop analysis results with structured assessment data
4. **conversations** - AI assistant conversation sessions
5. **conversation_messages** - Individual messages in AI conversations
6. **community_posts** - Farmer community posts with crop/region tags
7. **community_comments** - Replies to community posts
8. **community_reactions** - Helpful/like reactions on posts and comments
9. **community_reports** - Moderation reports for flagged content
10. **alerts** - User alerts (weather, crop, community, reminders)
11. **weather_cache** - Cached weather data per location

## Security
- RLS enabled on ALL tables
- Owner-scoped policies for user data (farmer_profiles, fields, crop_assessments, conversations, alerts)
- Community tables: authenticated users can read all, write own, report content
- All policies use auth.uid() for ownership checks
- user_id columns default to auth.uid() for seamless inserts
*/

-- ============================================================
-- FARMER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS farmer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  preferred_language text DEFAULT 'en',
  location_text text,
  latitude double precision,
  longitude double precision,
  crops_grown text[] DEFAULT '{}',
  farming_experience text,
  farm_size text,
  notification_preferences jsonb DEFAULT '{"weather": true, "crop": true, "community": true, "alerts": true}'::jsonb,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE farmer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON farmer_profiles;
CREATE POLICY "select_own_profile" ON farmer_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON farmer_profiles;
CREATE POLICY "insert_own_profile" ON farmer_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON farmer_profiles;
CREATE POLICY "update_own_profile" ON farmer_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profile" ON farmer_profiles;
CREATE POLICY "delete_own_profile" ON farmer_profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- FIELDS
-- ============================================================
CREATE TABLE IF NOT EXISTS fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  crop_type text,
  crop_variety text,
  location_text text,
  latitude double precision,
  longitude double precision,
  area_size text,
  planting_date date,
  growth_stage text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_fields" ON fields;
CREATE POLICY "select_own_fields" ON fields FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_fields" ON fields;
CREATE POLICY "insert_own_fields" ON fields FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_fields" ON fields;
CREATE POLICY "update_own_fields" ON fields FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_fields" ON fields;
CREATE POLICY "delete_own_fields" ON fields FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- CROP ASSESSMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS crop_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id uuid REFERENCES fields(id) ON DELETE SET NULL,
  image_url text,
  image_path text,
  symptoms_description text,
  observations text,
  possible_issue text,
  assessment_confidence text,
  observed_indicators text[] DEFAULT '{}',
  context_factors text[] DEFAULT '{}',
  severity text,
  assessment_explanation text,
  what_to_check text[] DEFAULT '{}',
  what_to_consider text[] DEFAULT '{}',
  environmental_considerations text,
  escalation_guidance text,
  recommendations jsonb DEFAULT '[]'::jsonb,
  is_ai_assessment boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crop_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_assessments" ON crop_assessments;
CREATE POLICY "select_own_assessments" ON crop_assessments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_assessments" ON crop_assessments;
CREATE POLICY "insert_own_assessments" ON crop_assessments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_assessments" ON crop_assessments;
CREATE POLICY "update_own_assessments" ON crop_assessments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_assessments" ON crop_assessments;
CREATE POLICY "delete_own_assessments" ON crop_assessments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id uuid REFERENCES fields(id) ON DELETE SET NULL,
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_conversations" ON conversations;
CREATE POLICY "select_own_conversations" ON conversations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_conversations" ON conversations;
CREATE POLICY "insert_own_conversations" ON conversations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_conversations" ON conversations;
CREATE POLICY "update_own_conversations" ON conversations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_conversations" ON conversations;
CREATE POLICY "delete_own_conversations" ON conversations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- CONVERSATION MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_messages" ON conversation_messages;
CREATE POLICY "select_own_messages" ON conversation_messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_messages" ON conversation_messages;
CREATE POLICY "insert_own_messages" ON conversation_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_messages" ON conversation_messages;
CREATE POLICY "delete_own_messages" ON conversation_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- COMMUNITY POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  crop_tag text,
  region_tag text,
  field_id uuid REFERENCES fields(id) ON DELETE SET NULL,
  image_url text,
  is_question boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Community posts: all authenticated users can read, only owner can modify/delete
DROP POLICY IF EXISTS "select_all_posts" ON community_posts;
CREATE POLICY "select_all_posts" ON community_posts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_posts" ON community_posts;
CREATE POLICY "insert_own_posts" ON community_posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_posts" ON community_posts;
CREATE POLICY "update_own_posts" ON community_posts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_posts" ON community_posts;
CREATE POLICY "delete_own_posts" ON community_posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- COMMUNITY COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_comments" ON community_comments;
CREATE POLICY "select_all_comments" ON community_comments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_comments" ON community_comments;
CREATE POLICY "insert_own_comments" ON community_comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_comments" ON community_comments;
CREATE POLICY "delete_own_comments" ON community_comments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- COMMUNITY REACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS community_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES community_comments(id) ON DELETE CASCADE,
  reaction_type text DEFAULT 'helpful',
  created_at timestamptz DEFAULT now(),
  CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL)
);

ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_reactions" ON community_reactions;
CREATE POLICY "select_all_reactions" ON community_reactions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_reactions" ON community_reactions;
CREATE POLICY "insert_own_reactions" ON community_reactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reactions" ON community_reactions;
CREATE POLICY "delete_own_reactions" ON community_reactions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- COMMUNITY REPORTS (Moderation)
-- ============================================================
CREATE TABLE IF NOT EXISTS community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES community_comments(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('misinformation', 'dangerous_advice', 'spam', 'harassment', 'suspicious_activity', 'other')),
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_note text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL)
);

ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;

-- Reports: reporter can see their own reports; all authenticated can create reports
DROP POLICY IF EXISTS "select_own_reports" ON community_reports;
CREATE POLICY "select_own_reports" ON community_reports FOR SELECT
  TO authenticated USING (auth.uid() = reporter_id OR auth.uid() = resolved_by);

DROP POLICY IF EXISTS "insert_own_reports" ON community_reports;
CREATE POLICY "insert_own_reports" ON community_reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "update_own_reports" ON community_reports;
CREATE POLICY "update_own_reports" ON community_reports FOR UPDATE
  TO authenticated USING (auth.uid() = reporter_id OR auth.uid() = resolved_by) WITH CHECK (auth.uid() = reporter_id OR auth.uid() = resolved_by);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id uuid REFERENCES fields(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('weather', 'crop', 'community', 'reminder', 'system')),
  title text NOT NULL,
  body text,
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'urgent')),
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_alerts" ON alerts;
CREATE POLICY "select_own_alerts" ON alerts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_alerts" ON alerts;
CREATE POLICY "insert_own_alerts" ON alerts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_alerts" ON alerts;
CREATE POLICY "update_own_alerts" ON alerts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_alerts" ON alerts;
CREATE POLICY "delete_own_alerts" ON alerts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- WEATHER CACHE
-- ============================================================
CREATE TABLE IF NOT EXISTS weather_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  weather_data jsonb NOT NULL,
  fetched_at timestamptz DEFAULT now(),
  UNIQUE(latitude, longitude)
);

ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;

-- Weather cache: readable by all authenticated users (it's non-sensitive public data)
DROP POLICY IF EXISTS "select_weather_cache" ON weather_cache;
CREATE POLICY "select_weather_cache" ON weather_cache FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_weather_cache" ON weather_cache;
CREATE POLICY "insert_weather_cache" ON weather_cache FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_weather_cache" ON weather_cache;
CREATE POLICY "update_weather_cache" ON weather_cache FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_fields_user_id ON fields(user_id);
CREATE INDEX IF NOT EXISTS idx_crop_assessments_user_id ON crop_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_crop_assessments_field_id ON crop_assessments(field_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(user_id, is_read);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_farmer_profiles_updated_at ON farmer_profiles;
CREATE TRIGGER trigger_farmer_profiles_updated_at BEFORE UPDATE ON farmer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_fields_updated_at ON fields;
CREATE TRIGGER trigger_fields_updated_at BEFORE UPDATE ON fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_conversations_updated_at ON conversations;
CREATE TRIGGER trigger_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_community_posts_updated_at ON community_posts;
CREATE TRIGGER trigger_community_posts_updated_at BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- HELPFUL COUNT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION increment_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_comment_count ON community_comments;
CREATE TRIGGER trigger_increment_comment_count AFTER INSERT ON community_comments
  FOR EACH ROW EXECUTE FUNCTION increment_comment_count();

DROP TRIGGER IF EXISTS trigger_decrement_comment_count ON community_comments;
CREATE TRIGGER trigger_decrement_comment_count AFTER DELETE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION decrement_comment_count();