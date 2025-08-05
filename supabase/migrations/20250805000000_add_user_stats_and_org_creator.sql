-- Add user statistics fields to profiles table
-- These fields will track user's debate performance and activity

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_debates INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_time_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_hints_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_debate_date TIMESTAMP WITH TIME ZONE;

-- Add creator information to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS creator_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS creator_email VARCHAR(255);

-- Create function to update user statistics after debate completion
CREATE OR REPLACE FUNCTION update_user_stats_after_debate()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if this is a completed debate (has end_time)
  IF NEW.end_time IS NOT NULL AND OLD.end_time IS NULL THEN
    -- Calculate debate duration in minutes
    DECLARE
      debate_duration_minutes INTEGER;
      is_win BOOLEAN;
    BEGIN
      -- Calculate duration
      debate_duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time::timestamp - NEW.start_time::timestamp)) / 60;
      
      -- Determine if user won (check if winner exists and user is on winning team)
      is_win := FALSE;
      IF NEW.winner IS NOT NULL AND NEW.winner->>'team' IS NOT NULL THEN
        -- Check if any of the user's speakers are on the winning team
        -- This is a simplified check - you might want to make this more sophisticated
        is_win := EXISTS (
          SELECT 1 FROM jsonb_array_elements(NEW.speakers) AS speaker
          WHERE speaker->>'team' = NEW.winner->>'team'
        );
      END IF;
      
      -- Update user profile statistics
      UPDATE profiles 
      SET 
        total_debates = total_debates + 1,
        total_wins = total_wins + CASE WHEN is_win THEN 1 ELSE 0 END,
        total_time_minutes = total_time_minutes + debate_duration_minutes,
        total_hints_used = total_hints_used + COALESCE(NEW.hints_used, 0),
        last_debate_date = NEW.end_time,
        updated_at = NOW()
      WHERE id = NEW.user_id;
      
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update user stats
DROP TRIGGER IF EXISTS on_debate_session_completed ON debate_sessions;
CREATE TRIGGER on_debate_session_completed
  AFTER UPDATE ON debate_sessions
  FOR EACH ROW EXECUTE FUNCTION update_user_stats_after_debate();

-- Add policy to allow the trigger function to update profiles
DROP POLICY IF EXISTS "Allow trigger to update profiles" ON profiles;
CREATE POLICY "Allow trigger to update profiles" ON profiles
  FOR UPDATE USING (true);

-- Update RLS policies to allow reading own profile stats
DO $$
BEGIN
  -- Select policy for profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can read their own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can read their own profile" ON profiles 
             FOR SELECT USING (auth.uid() = id)';
  ELSE
    EXECUTE 'ALTER POLICY "Users can read their own profile" ON profiles 
             USING (auth.uid() = id)';
  END IF;
END $$;

-- Add policy for organizations to allow reading organization info
DROP POLICY IF EXISTS "Users can read organizations" ON organizations;
CREATE POLICY "Users can read organizations" ON organizations
  FOR SELECT USING (true);

-- Add policy for organizations to allow inserting (for organization creation)
DROP POLICY IF EXISTS "Users can insert organizations" ON organizations;
CREATE POLICY "Users can insert organizations" ON organizations
  FOR INSERT WITH CHECK (true);

-- Add policy for organizations to allow updating (for organization updates)
DROP POLICY IF EXISTS "Users can update organizations" ON organizations;
CREATE POLICY "Users can update organizations" ON organizations
  FOR UPDATE USING (true);

-- Add policy to allow organization creators to add themselves as first member
DROP POLICY IF EXISTS "Allow organization creators to add themselves" ON organization_members;
CREATE POLICY "Allow organization creators to add themselves" ON organization_members
  FOR INSERT WITH CHECK (
    -- Allow if user is creating themselves as a member and they own the organization
    auth.uid() = user_id AND
    organization_id IN (
      SELECT id FROM organizations 
      WHERE creator_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  ); 