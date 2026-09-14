-- Add anonymous posting, recovery status, and user blocks

-- Add is_anonymous and recovery_status to community_posts
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS recovery_status text DEFAULT NULL CHECK (recovery_status IN ('still_dealing', 'improving', 'resolved'));

-- Create user_blocks table
CREATE TABLE IF NOT EXISTS user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS on user_blocks
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_blocks" ON user_blocks FOR SELECT
  TO authenticated USING (auth.uid() = blocker_id);

CREATE POLICY "insert_own_blocks" ON user_blocks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "delete_own_blocks" ON user_blocks FOR DELETE
  TO authenticated USING (auth.uid() = blocker_id);
