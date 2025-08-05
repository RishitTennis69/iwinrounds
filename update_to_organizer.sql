-- Update existing user to be an organizer
-- Replace 'krish.s.grover@gmail.com' with your actual email

-- First, let's see what profiles exist
SELECT id, email, user_type, first_name, last_name FROM profiles;

-- Update the profile to be an organizer
UPDATE profiles 
SET user_type = 'organizer'
WHERE email = 'krish.s.grover@gmail.com';

-- Create an organization for this user
INSERT INTO organizations (name, creator_name, creator_email)
VALUES ('Testorg2', 'Krish Grover', 'krish.s.grover@gmail.com')
ON CONFLICT (creator_email) DO NOTHING;

-- Get the organization ID
SELECT id, name FROM organizations WHERE creator_email = 'krish.s.grover@gmail.com';

-- Add the user as an organizer to the organization
-- (Replace the user_id and organization_id with actual values from above queries)
INSERT INTO organization_members (organization_id, user_id, role)
SELECT 
    o.id as organization_id,
    p.id as user_id,
    'organizer' as role
FROM organizations o
JOIN profiles p ON p.email = o.creator_email
WHERE o.creator_email = 'krish.s.grover@gmail.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Verify the changes
SELECT 
    p.id,
    p.email,
    p.user_type,
    p.first_name,
    p.last_name,
    o.name as organization_name,
    om.role as member_role
FROM profiles p
LEFT JOIN organization_members om ON om.user_id = p.id
LEFT JOIN organizations o ON o.id = om.organization_id
WHERE p.email = 'krish.s.grover@gmail.com'; 