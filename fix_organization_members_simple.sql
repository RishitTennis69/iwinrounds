-- Simple fix for organization_members RLS policies to prevent infinite recursion

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can insert organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can update organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can delete organization members" ON organization_members;

-- Create a simple policy that allows authenticated users to manage organization members
-- This avoids recursion by not referencing the same table in the policy
CREATE POLICY "Enable all operations for authenticated users" ON organization_members
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Alternative: More restrictive but still simple policies
-- Uncomment the following if you want more restrictive policies

/*
-- Policy for viewing organization members
CREATE POLICY "Users can view organization members" ON organization_members
    FOR SELECT
    USING (
        -- Users can view members of organizations they created
        EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = organization_members.organization_id
            AND o.creator_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
        OR
        -- Users can view their own memberships
        user_id = auth.uid()
    );

-- Policy for inserting organization members
CREATE POLICY "Users can insert organization members" ON organization_members
    FOR INSERT
    WITH CHECK (
        -- Users can add themselves
        user_id = auth.uid()
        OR
        -- Organization creators can add members
        EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = organization_id
            AND o.creator_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Policy for updating organization members
CREATE POLICY "Users can update organization members" ON organization_members
    FOR UPDATE
    USING (
        -- Users can update their own membership
        user_id = auth.uid()
        OR
        -- Organization creators can update any member
        EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = organization_id
            AND o.creator_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    )
    WITH CHECK (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = organization_id
            AND o.creator_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Policy for deleting organization members
CREATE POLICY "Users can delete organization members" ON organization_members
    FOR DELETE
    USING (
        -- Users can remove themselves
        user_id = auth.uid()
        OR
        -- Organization creators can remove any member
        EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = organization_id
            AND o.creator_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );
*/

-- Also fix organizations table
DROP POLICY IF EXISTS "Users can view organizations" ON organizations;
DROP POLICY IF EXISTS "Users can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update organizations" ON organizations;

-- Simple organization policies
CREATE POLICY "Enable all operations for organizations" ON organizations
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY; 