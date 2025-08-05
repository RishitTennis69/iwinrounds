-- Clear Auth Users and Related Data
-- WARNING: This will delete ALL auth users and related data
-- Run this in your Supabase SQL editor

-- 1. First clear all related data (profiles, organizations, etc.)
DELETE FROM invite_codes;
DELETE FROM organization_members;
DELETE FROM organizations;
DELETE FROM profiles;

-- 2. Now clear auth data (order matters due to foreign key constraints)
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.users;

-- 3. Reset sequences (optional, but good practice)
ALTER SEQUENCE IF EXISTS invite_codes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS organization_members_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS organizations_id_seq RESTART WITH 1;

-- 4. Verify everything is cleared
SELECT 'invite_codes' as table_name, COUNT(*) as count FROM invite_codes
UNION ALL
SELECT 'organization_members' as table_name, COUNT(*) as count FROM organization_members
UNION ALL
SELECT 'organizations' as table_name, COUNT(*) as count FROM organizations
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'auth.sessions' as table_name, COUNT(*) as count FROM auth.sessions
UNION ALL
SELECT 'auth.refresh_tokens' as table_name, COUNT(*) as count FROM auth.refresh_tokens;

-- All counts should be 0 after running this script 