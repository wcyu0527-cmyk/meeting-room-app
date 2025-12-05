-- Add username column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index for faster username queries
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

-- Add constraint to ensure username is lowercase and alphanumeric
ALTER TABLE profiles ADD CONSTRAINT username_format 
  CHECK (username ~ '^[a-z0-9_]{3,20}$');
