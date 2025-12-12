-- Add unit_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL;

-- Enable RLS for the new column if necessary (usually covered by existing policies, but good to check)
-- Existing policies on profiles should allow users to read their own profile.
-- We might want to ensure admins can read/write this column.

-- NOTE: The existing policies for profiles are:
-- 1. "Public profiles are viewable by everyone." (SELECT using true) - This covers the new column.
-- 2. "Users can insert their own profile." (INSERT auth.uid() = id) - This allows users to set their own unit? Maybe not desired. 
--    Usually unit assignment is an admin task. 
--    However, users usually don't INSERT their profile manually with all fields; it's done via trigger.
-- 3. "Users can update own profile." (UPDATE auth.uid() = id) - This allows users to change their unit. 
--    If we want ONLY admins to change units, we might need a specific policy or separate table, 
--    BUT for now, sticking to the request "add a field", we'll assume the basic RLS is fine or that the UI controls it.
--    Ideally, we'd restrict UPDATE on `unit_id` to admins, but column-level security is complex in standard RLS.
--    We will proceed with just adding the column.

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_unit_id ON public.profiles(unit_id);
