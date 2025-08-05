-- Add trigger to automatically create profile when user signs up
-- This ensures profiles are always created, even if the frontend fails

-- NOTE: Temporarily disabled due to user creation issues
-- The frontend will handle profile creation instead

-- Create function to handle new user signup (commented out for now)
/*
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to insert the profile, but don't fail if there's an error
  BEGIN
    INSERT INTO profiles (id, email, first_name, last_name, user_type, organization_id)
    VALUES (
      NEW.id,
      NEW.email,
      NULL, -- first_name will be updated later if available
      NULL, -- last_name will be updated later if available
      'individual', -- default user_type, will be updated later if available
      NULL -- organization_id will be set later if available
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add policy to allow the trigger function to insert profiles
DROP POLICY IF EXISTS "Allow trigger to insert profiles" ON profiles;
CREATE POLICY "Allow trigger to insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);
*/

-- Instead, ensure the profiles table has proper policies for frontend creation
CREATE POLICY IF NOT EXISTS "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id); 