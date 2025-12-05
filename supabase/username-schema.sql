-- Add email column to profiles table for username login
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for email
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
