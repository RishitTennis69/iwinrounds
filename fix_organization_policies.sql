-- Fix organization creation policies
-- This script should be run in your Supabase SQL editor

-- Ensure organizations table allows all operations for now
DROP POLICY IF EXISTS "Users can read organizations" ON organizations;
CREATE POLICY "Users can read organizations" ON organizations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert organizations" ON organizations;
CREATE POLICY "Users can insert organizations" ON organizations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update organizations" ON organizations;
CREATE POLICY "Users can update organizations" ON organizations
  FOR UPDATE USING (true);

-- Ensure organization_members table allows organization creators to add themselves
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

-- Also allow general inserts for now to debug
DROP POLICY IF EXISTS "Allow all organization member inserts" ON organization_members;
CREATE POLICY "Allow all organization member inserts" ON organization_members
  FOR INSERT WITH CHECK (true);

-- Ensure profiles table allows profile creation
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
CREATE POLICY "Users can read their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id); 