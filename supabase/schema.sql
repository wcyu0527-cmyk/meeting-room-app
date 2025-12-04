-- Enable necessary extensions
create extension if not exists "btree_gist";

-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Meeting Rooms
create table rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  capacity int not null,
  equipment text[], -- e.g. ['Projector', 'Whiteboard']
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table rooms enable row level security;

create policy "Rooms are viewable by everyone." on rooms
  for select using (true);

-- Bookings
create table bookings (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) not null,
  user_id uuid references auth.users(id) not null,
  title text not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint bookings_time_check check (end_time > start_time)
);

alter table bookings enable row level security;

create policy "Bookings are viewable by everyone." on bookings
  for select using (true);

create policy "Authenticated users can create bookings." on bookings
  for insert with check (auth.role() = 'authenticated');

create policy "Users can delete their own bookings." on bookings
  for delete using (auth.uid() = user_id);

-- Prevent overlapping bookings
alter table bookings add constraint no_overlap exclude using gist (
  room_id with =,
  tstzrange(start_time, end_time) with &&
);

-- Insert some sample rooms
insert into rooms (name, capacity, equipment, image_url) values
('Conference Room A', 10, ARRAY['Projector', 'Whiteboard', 'Video Conf'], 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'),
('Meeting Room B', 4, ARRAY['TV', 'Whiteboard'], 'https://images.unsplash.com/photo-1517502884422-41e157d2ed22?auto=format&fit=crop&w=800&q=80'),
('Phone Booth', 1, ARRAY['Phone'], 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80');
