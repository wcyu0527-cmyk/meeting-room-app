-- Add alias column to profiles table
alter table public.profiles 
add column if not exists alias text;

-- Update the handle_new_user function to include alias if it's in metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, alias)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'alias'
  );
  return new;
end;
$$ language plpgsql security definer;
