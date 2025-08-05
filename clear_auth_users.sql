-- Clear Auth Users
-- WARNING: This will delete ALL auth users
-- Run this in your Supabase SQL editor

-- Delete all users from auth.users table
DELETE FROM auth.users;

-- Clear all sessions
DELETE FROM auth.sessions;

-- Clear all refresh tokens
DELETE FROM auth.refresh_tokens;

-- Verify auth users are cleared
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'auth.sessions' as table_name, COUNT(*) as count FROM auth.sessions
UNION ALL
SELECT 'auth.refresh_tokens' as table_name, COUNT(*) as count FROM auth.refresh_tokens;

-- All counts should be 0 after running this script 