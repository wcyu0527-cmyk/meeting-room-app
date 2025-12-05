-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create index for faster role queries
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);

-- Update RLS policies to allow admins to manage everything
-- Drop existing policies first
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;

-- Recreate policies
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile." ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update rooms policies to allow admin management
DROP POLICY IF EXISTS "Rooms are viewable by everyone." ON rooms;

CREATE POLICY "Rooms are viewable by everyone." ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert rooms." ON rooms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update rooms." ON rooms
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete rooms." ON rooms
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update bookings policies to allow admin management
DROP POLICY IF EXISTS "Bookings are viewable by everyone." ON bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings." ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings." ON bookings;

CREATE POLICY "Bookings are viewable by everyone." ON bookings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create bookings." ON bookings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own bookings." ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookings." ON bookings
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any booking." ON bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete any booking." ON bookings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Set first user as admin (update this email to your admin email)
-- UPDATE profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com');
