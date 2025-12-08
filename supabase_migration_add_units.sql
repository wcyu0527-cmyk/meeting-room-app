-- Create units table
CREATE TABLE IF NOT EXISTS public.units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create unit_members table
CREATE TABLE IF NOT EXISTS public.unit_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS unit_member_id UUID REFERENCES public.unit_members(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_members ENABLE ROW LEVEL SECURITY;

-- Policies for units
CREATE POLICY "Enable read access for all users" ON public.units FOR SELECT USING (true);
CREATE POLICY "Enable insert for admins only" ON public.units FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
CREATE POLICY "Enable update for admins only" ON public.units FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
CREATE POLICY "Enable delete for admins only" ON public.units FOR DELETE USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Policies for unit_members
CREATE POLICY "Enable read access for all users" ON public.unit_members FOR SELECT USING (true);
CREATE POLICY "Enable insert for admins only" ON public.unit_members FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
CREATE POLICY "Enable update for admins only" ON public.unit_members FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
CREATE POLICY "Enable delete for admins only" ON public.unit_members FOR DELETE USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
