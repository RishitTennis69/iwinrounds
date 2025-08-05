-- Migration script for existing magic link users
-- Run this in your Supabase SQL editor

-- 1. First, let's check if there are any existing users without passwords
-- (This is just for information, no action needed)
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users 
WHERE encrypted_password IS NULL OR encrypted_password = '';

-- 2. For existing users who used magic links, we need to handle them specially
-- When they try to sign in, we'll need to prompt them to set a password
-- This is handled in the application logic, not in the database

-- 3. Update any existing profiles to ensure they have the correct structure
-- (This is optional, just to ensure data consistency)
UPDATE profiles 
SET 
  updated_at = NOW()
WHERE updated_at IS NULL;

-- 4. Create a function to help with password validation
CREATE OR REPLACE FUNCTION validate_password(password text)
RETURNS boolean AS $$
BEGIN
  -- Password must be at least 8 characters long
  IF length(password) < 8 THEN
    RETURN false;
  END IF;
  
  -- Password must contain at least one uppercase letter, one lowercase letter, and one number
  IF password !~ '[A-Z]' OR password !~ '[a-z]' OR password !~ '[0-9]' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 5. Create a trigger to log password changes (optional, for security auditing)
CREATE TABLE IF NOT EXISTS password_change_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by TEXT DEFAULT 'user'
);

-- 6. Create a function to log password changes
CREATE OR REPLACE FUNCTION log_password_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password THEN
    INSERT INTO password_change_log (user_id, changed_by)
    VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create the trigger (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'log_password_changes'
  ) THEN
    CREATE TRIGGER log_password_changes
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION log_password_change();
  END IF;
END $$;

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON password_change_log TO authenticated;
GRANT EXECUTE ON FUNCTION validate_password(text) TO authenticated;

-- 9. Create a view for user authentication status (useful for debugging)
CREATE OR REPLACE VIEW user_auth_status AS
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  CASE 
    WHEN u.encrypted_password IS NULL OR u.encrypted_password = '' THEN 'magic_link_only'
    ELSE 'password_enabled'
  END as auth_method,
  p.user_type,
  p.first_name,
  p.last_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email_confirmed_at IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON user_auth_status TO authenticated;

-- 10. Create an index for better performance on email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Summary of what this migration does:
-- 1. Checks for users without passwords (magic link only users)
-- 2. Creates password validation function
-- 3. Sets up password change logging for security
-- 4. Creates a view to monitor user authentication status
-- 5. Adds performance indexes

-- To run this migration:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to SQL Editor
-- 3. Paste this entire script
-- 4. Click "Run" to execute

-- After running this, your application will:
-- - Support both new users (with passwords) and existing users (who need to set passwords)
-- - Validate passwords properly
-- - Log password changes for security
-- - Have better performance for email lookups 