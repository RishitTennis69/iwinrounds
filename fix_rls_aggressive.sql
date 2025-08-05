-- Aggressive fix for RLS policies - completely disable RLS to allow operations

-- First, let's see what policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('organization_members', 'organizations');

-- Drop ALL existing policies on both tables (more comprehensive)
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can insert organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can update organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can delete organization members" ON organization_members;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON organization_members;
DROP POLICY IF EXISTS "Simple organization members policy" ON organization_members;

DROP POLICY IF EXISTS "Users can view organizations" ON organizations;
DROP POLICY IF EXISTS "Users can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update organizations" ON organizations;
DROP POLICY IF EXISTS "Enable all operations for organizations" ON organizations;
DROP POLICY IF EXISTS "Simple organizations policy" ON organizations;

-- Completely disable RLS on both tables
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on profiles table to ensure profile updates work
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('organization_members', 'organizations', 'profiles');

-- Show that no policies exist
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename IN ('organization_members', 'organizations', 'profiles'); 