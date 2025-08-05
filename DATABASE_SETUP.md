# Database Setup Guide

## Supabase Configuration

1. **Create a Supabase project** at https://supabase.com
2. **Get your project URL and anon key** from the project settings
3. **Create a `.env` file** in the root directory with:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

## Database Schema

Run these SQL commands in your Supabase SQL editor:

### 1. Create Tables

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('individual', 'business_admin', 'coach', 'student')),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations table
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization members table
CREATE TABLE organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Invites table
CREATE TABLE invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('coach', 'student')),
  code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Debate sessions table
CREATE TABLE debate_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  topic TEXT NOT NULL,
  speakers JSONB NOT NULL,
  points JSONB NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  hints_used INTEGER DEFAULT 0,
  first_speaker TEXT NOT NULL CHECK (first_speaker IN ('affirmative', 'negative')),
  summary TEXT,
  winner JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Create Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Organizations policies
CREATE POLICY "Organization members can view their organization" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Business admins can create organizations" ON organizations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'business_admin'
    )
  );

-- Organization members policies
CREATE POLICY "Organization members can view other members" ON organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om2
      WHERE om2.organization_id = organization_members.organization_id
      AND om2.user_id = auth.uid()
    )
  );

CREATE POLICY "Business admins and coaches can add members" ON organization_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type IN ('business_admin', 'coach')
      AND organization_id = organization_members.organization_id
    )
  );

-- Invites policies
CREATE POLICY "Organization members can view invites" ON invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = invites.organization_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Business admins and coaches can create invites" ON invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type IN ('business_admin', 'coach')
      AND organization_id = invites.organization_id
    )
  );

-- Debate sessions policies
CREATE POLICY "Users can view their own sessions" ON debate_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organization members can view organization sessions" ON debate_sessions
  FOR SELECT USING (
    organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = debate_sessions.organization_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own sessions" ON debate_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON debate_sessions
  FOR UPDATE USING (user_id = auth.uid());
```

### 3. Create Functions and Triggers

```sql
-- Function to handle new user signup (updated with better error handling)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
    INSERT INTO profiles (id, email, user_type, organization_id)
    VALUES (NEW.id, NEW.email, 'individual', NULL);
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Troubleshooting

If you encounter "Database error saving new user" errors, run this fix in your Supabase SQL editor:

```sql
-- Fix for trigger issues
-- 1. Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the function
DROP FUNCTION IF EXISTS handle_new_user();

-- 3. Recreate the function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
    INSERT INTO profiles (id, email, user_type, organization_id)
    VALUES (NEW.id, NEW.email, 'individual', NULL);
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. Test by checking if the trigger is working
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

## Features Implemented

### ✅ Authentication
- Supabase Magic Link authentication
- User profile creation on signup
- Session management

### ✅ User Types
- `individual` - Independent users
- `business_admin` - Organization owners
- `coach` - Coaches within organizations
- `student` - Students within organizations

### ✅ Dashboards
- **Student Dashboard** - For individual users and students
- **Coach Dashboard** - For business admins and coaches

### ✅ Data Structure
- Organizations and members
- Debate sessions with user association
- Invite system (ready for implementation)

## Next Steps

1. **Set up Supabase project** and run the SQL commands above
2. **Configure environment variables** in `.env` file
3. **Test authentication** by running the development server
4. **Implement invite system** for adding coaches and students
5. **Add organization management** features

## Testing

1. Start the development server: `npm run dev`
2. Sign in with any email (magic link will be sent)
3. Test the different user types and dashboards
4. Verify that debate sessions are properly associated with users 