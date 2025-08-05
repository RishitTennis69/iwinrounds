-- Apply organization statistics tracking
-- Run this in your Supabase SQL editor

-- Add statistics fields to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS total_students INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_coaches INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_debate_sessions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_time_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP WITH TIME ZONE;

-- Create function to update organization stats when members change
CREATE OR REPLACE FUNCTION update_organization_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update organization stats based on current members
  UPDATE organizations 
  SET 
    total_students = (
      SELECT COUNT(*) 
      FROM organization_members om
      JOIN profiles p ON om.user_id = p.id
      WHERE om.organization_id = COALESCE(NEW.organization_id, OLD.organization_id)
      AND p.user_type = 'student'
    ),
    total_coaches = (
      SELECT COUNT(*) 
      FROM organization_members om
      JOIN profiles p ON om.user_id = p.id
      WHERE om.organization_id = COALESCE(NEW.organization_id, OLD.organization_id)
      AND p.user_type IN ('coach', 'business_admin')
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.organization_id, OLD.organization_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for organization_members changes
DROP TRIGGER IF EXISTS on_organization_members_change ON organization_members;
CREATE TRIGGER on_organization_members_change
  AFTER INSERT OR UPDATE OR DELETE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_stats();

-- Create function to update organization stats when debate sessions change
CREATE OR REPLACE FUNCTION update_organization_debate_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update organization stats when debate sessions are completed
  IF NEW.end_time IS NOT NULL AND OLD.end_time IS NULL THEN
    UPDATE organizations 
    SET 
      total_debate_sessions = total_debate_sessions + 1,
      total_wins = total_wins + CASE 
        WHEN NEW.winner IS NOT NULL AND NEW.winner->>'team' IS NOT NULL THEN 1 
        ELSE 0 
      END,
      total_time_minutes = total_time_minutes + 
        EXTRACT(EPOCH FROM (NEW.end_time::timestamp - NEW.start_time::timestamp)) / 60,
      last_activity_date = NEW.end_time,
      updated_at = NOW()
    WHERE id = (
      SELECT organization_id 
      FROM profiles 
      WHERE id = NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for debate_sessions changes
DROP TRIGGER IF EXISTS on_debate_session_completed ON debate_sessions;
CREATE TRIGGER on_debate_session_completed
  AFTER UPDATE ON debate_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_debate_stats();

-- Initialize stats for existing organizations
UPDATE organizations 
SET 
  total_students = (
    SELECT COUNT(*) 
    FROM organization_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.organization_id = organizations.id
    AND p.user_type = 'student'
  ),
  total_coaches = (
    SELECT COUNT(*) 
    FROM organization_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.organization_id = organizations.id
    AND p.user_type IN ('coach', 'business_admin')
  ),
  total_debate_sessions = (
    SELECT COUNT(*)
    FROM debate_sessions ds
    JOIN profiles p ON ds.user_id = p.id
    WHERE p.organization_id = organizations.id
    AND ds.end_time IS NOT NULL
  ),
  total_wins = (
    SELECT COUNT(*)
    FROM debate_sessions ds
    JOIN profiles p ON ds.user_id = p.id
    WHERE p.organization_id = organizations.id
    AND ds.end_time IS NOT NULL
    AND ds.winner IS NOT NULL
    AND ds.winner->>'team' IS NOT NULL
  ),
  total_time_minutes = (
    SELECT COALESCE(SUM(
      EXTRACT(EPOCH FROM (ds.end_time::timestamp - ds.start_time::timestamp)) / 60
    ), 0)
    FROM debate_sessions ds
    JOIN profiles p ON ds.user_id = p.id
    WHERE p.organization_id = organizations.id
    AND ds.end_time IS NOT NULL
  ),
  last_activity_date = (
    SELECT MAX(ds.end_time)
    FROM debate_sessions ds
    JOIN profiles p ON ds.user_id = p.id
    WHERE p.organization_id = organizations.id
    AND ds.end_time IS NOT NULL
  ); 