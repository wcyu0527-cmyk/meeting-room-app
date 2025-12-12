-- Add custom_unit_member_name to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS custom_unit_member_name TEXT;
