-- Database Cleanup and Role Simplification
-- Run this in your Supabase SQL editor

-- 1. First, let's see what roles we currently have
SELECT DISTINCT user_type FROM profiles;

-- 2. Drop the existing constraint FIRST to avoid conflicts
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- 3. Update existing profiles to use new simplified roles
UPDATE profiles 
SET user_type = CASE 
  WHEN user_type IN ('creator', 'business_admin', 'organizer') THEN 'organizer'
  WHEN user_type = 'coach' THEN 'coach'
  WHEN user_type IN ('student', 'individual') THEN 'student'
  ELSE 'student' -- Default fallback
END
WHERE user_type IS NOT NULL;

-- 4. Now add the new constraint with simplified roles
ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type IN ('organizer', 'coach', 'student'));

-- 5. Verify the update worked
SELECT DISTINCT user_type FROM profiles;

-- 6. Create invite_codes table
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  used_by UUID REFERENCES auth.users(id) DEFAULT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_active BOOLEAN DEFAULT true
);

-- 7. Create index for invite codes
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_organization ON invite_codes(organization_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_active ON invite_codes(is_active) WHERE is_active = true;

-- 8. Ensure organization_members table is properly structured
-- (This should already exist, but let's make sure it's correct)
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Drop the existing constraint if it exists and add the new one
ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE organization_members ADD CONSTRAINT organization_members_role_check 
CHECK (role IN ('organizer', 'coach', 'student'));

-- 9. Create index for organization members
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);

-- 10. Populate organization_members table with existing data
INSERT INTO organization_members (organization_id, user_id, role)
SELECT 
  p.organization_id,
  p.id as user_id,
  p.user_type as role
FROM profiles p
WHERE p.organization_id IS NOT NULL
  AND p.user_type IS NOT NULL
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 11. Create a function to generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR(10) AS $$
DECLARE
  code VARCHAR(10);
  attempts INTEGER := 0;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM invite_codes WHERE code = code) THEN
      RETURN code;
    END IF;
    
    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Could not generate unique invite code after 10 attempts';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 12. Create a function to create invite codes
CREATE OR REPLACE FUNCTION create_invite_code(
  p_organization_id UUID,
  p_created_by UUID
)
RETURNS VARCHAR(10) AS $$
DECLARE
  invite_code VARCHAR(10);
BEGIN
  -- Generate unique code
  invite_code := generate_invite_code();
  
  -- Insert into invite_codes table
  INSERT INTO invite_codes (code, organization_id, created_by)
  VALUES (invite_code, p_organization_id, p_created_by);
  
  RETURN invite_code;
END;
$$ LANGUAGE plpgsql;

-- 13. Create a function to validate and use invite codes
CREATE OR REPLACE FUNCTION use_invite_code(
  p_code VARCHAR(10),
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_organization_id UUID;
BEGIN
  -- Get organization ID and validate code
  SELECT organization_id INTO v_organization_id
  FROM invite_codes
  WHERE code = p_code
    AND is_active = true
    AND expires_at > NOW()
    AND used_by IS NULL;
  
  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;
  
  -- Mark code as used
  UPDATE invite_codes
  SET used_by = p_user_id, used_at = NOW(), is_active = false
  WHERE code = p_code;
  
  -- Add user to organization
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (v_organization_id, p_user_id, 'student')
  ON CONFLICT (organization_id, user_id) DO NOTHING;
  
  -- Update user's profile
  UPDATE profiles
  SET organization_id = v_organization_id, user_type = 'student'
  WHERE id = p_user_id;
  
  RETURN v_organization_id;
END;
$$ LANGUAGE plpgsql;

-- 14. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON invite_codes TO authenticated;
GRANT ALL ON organization_members TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invite_code() TO authenticated;
GRANT EXECUTE ON FUNCTION create_invite_code(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION use_invite_code(VARCHAR(10), UUID) TO authenticated;

-- 15. Create a view for organization members with user details
CREATE OR REPLACE VIEW organization_members_view AS
SELECT 
  om.id,
  om.organization_id,
  om.user_id,
  om.role,
  o.name as organization_name,
  p.email,
  p.first_name,
  p.last_name,
  p.user_type
FROM organization_members om
JOIN organizations o ON om.organization_id = o.id
JOIN profiles p ON om.user_id = p.id;

GRANT SELECT ON organization_members_view TO authenticated;

-- 16. Create a view for active invite codes
CREATE OR REPLACE VIEW active_invite_codes_view AS
SELECT 
  ic.id,
  ic.code,
  ic.organization_id,
  ic.created_by,
  ic.created_at,
  ic.expires_at,
  o.name as organization_name,
  p.email as created_by_email,
  p.first_name as created_by_first_name,
  p.last_name as created_by_last_name
FROM invite_codes ic
JOIN organizations o ON ic.organization_id = o.id
JOIN profiles p ON ic.created_by = p.id
WHERE ic.is_active = true AND ic.expires_at > NOW();

GRANT SELECT ON active_invite_codes_view TO authenticated;

-- 17. Remove the profile creation trigger to let our createProfile function handle it
-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function as well
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Note: We'll handle profile creation in our createProfile function instead
-- This ensures the correct user_type is set based on the signup form

-- Summary of what this migration does:
-- 1. Simplifies user roles to: organizer, coach, student
-- 2. Creates invite_codes table for managing invites
-- 3. Ensures organization_members table is properly structured
-- 4. Creates functions for generating and using invite codes
-- 5. Creates views for easy data access
-- 6. Sets up proper indexes for performance

-- To run this migration:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to SQL Editor
-- 3. Paste this entire script
-- 4. Click "Run" to execute

-- After running this, your database will be ready for the new invite system! 