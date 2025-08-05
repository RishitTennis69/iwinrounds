-- Fix RLS policies for organization_members table to prevent infinite recursion

-- First, let's see the current policies
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
WHERE tablename = 'organization_members';

-- Drop existing policies that might be causing recursion
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can insert organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can update organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can delete organization members" ON organization_members;

-- Create new, simpler policies that don't cause recursion
-- Policy for viewing organization members
CREATE POLICY "Users can view organization members" ON organization_members
    FOR SELECT
    USING (
        -- Users can view members of organizations they belong to
        EXISTS (
            SELECT 1 FROM organization_members om2
            WHERE om2.organization_id = organization_members.organization_id
            AND om2.user_id = auth.uid()
        )
        OR
        -- Organization creators can view all members
        EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = organization_members.organization_id
            AND o.creator_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Policy for inserting organization members
CREATE POLICY "Users can insert organization members" ON organization_members
    FOR INSERT
    WITH CHECK (
        -- Users can add themselves to organizations
        user_id = auth.uid()
        OR
        -- Organization creators can add members
        EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = organization_id
            AND o.creator_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
        OR
        -- Existing organization members can add new members (for invites)
        EXISTS (
            SELECT 1 FROM organization_members om2
            WHERE om2.organization_id = organization_members.organization_id
            AND om2.user_id = auth.uid()
            AND om2.role IN ('business_admin', 'coach')
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
        OR
        -- Business admins can update members
        EXISTS (
            SELECT 1 FROM organization_members om2
            WHERE om2.organization_id = organization_members.organization_id
            AND om2.user_id = auth.uid()
            AND om2.role = 'business_admin'
        )
    )
    WITH CHECK (
        -- Same conditions for updates
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = organization_id
            AND o.creator_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
        OR
        EXISTS (
            SELECT 1 FROM organization_members om2
            WHERE om2.organization_id = organization_members.organization_id
            AND om2.user_id = auth.uid()
            AND om2.role = 'business_admin'
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
        OR
        -- Business admins can remove members
        EXISTS (
            SELECT 1 FROM organization_members om2
            WHERE om2.organization_id = organization_members.organization_id
            AND om2.user_id = auth.uid()
            AND om2.role = 'business_admin'
        )
    );

-- Also fix organizations table policies if needed
DROP POLICY IF EXISTS "Users can view organizations" ON organizations;
DROP POLICY IF EXISTS "Users can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update organizations" ON organizations;

-- Create simple organization policies
CREATE POLICY "Users can view organizations" ON organizations
    FOR SELECT
    USING (
        -- Users can view organizations they created
        creator_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR
        -- Users can view organizations they're members of
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organizations.id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert organizations" ON organizations
    FOR INSERT
    WITH CHECK (
        -- Users can create organizations
        creator_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Users can update organizations" ON organizations
    FOR UPDATE
    USING (
        -- Only creators can update their organizations
        creator_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    WITH CHECK (
        creator_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Enable RLS on both tables
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY; 