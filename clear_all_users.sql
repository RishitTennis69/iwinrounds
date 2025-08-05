-- Clear All Users and Data
-- WARNING: This will delete ALL users, profiles, organizations, and related data
-- Run this in your Supabase SQL editor

-- 1. Clear all invite codes
DELETE FROM invite_codes;

-- 2. Clear all organization members
DELETE FROM organization_members;

-- 3. Clear all organizations
DELETE FROM organizations;

-- 4. Clear all profiles
DELETE FROM profiles;

-- 5. Clear all auth users (this will also clear sessions)
-- Note: This requires admin privileges in Supabase
-- You may need to do this through the Supabase dashboard instead

-- 6. Reset sequences (optional, but good practice)
ALTER SEQUENCE IF EXISTS invite_codes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS organization_members_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS organizations_id_seq RESTART WITH 1;

-- 7. Verify everything is cleared
SELECT 'invite_codes' as table_name, COUNT(*) as count FROM invite_codes
UNION ALL
SELECT 'organization_members' as table_name, COUNT(*) as count FROM organization_members
UNION ALL
SELECT 'organizations' as table_name, COUNT(*) as count FROM organizations
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles;

-- All counts should be 0 after running this script 