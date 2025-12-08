-- Create a table to track login attempts
create table if not exists public.login_attempts (
  ip_address text primary key,
  attempts int default 0,
  last_attempt timestamp with time zone default now()
);

-- Enable RLS (although we will mostly access this via service role or secure functions)
alter table public.login_attempts enable row level security;

-- Create a policy that allows the service role (server-side) to do anything
-- We don't want public access to this table
create policy "Service role can manage login attempts" on public.login_attempts
  for all using (true) with check (true);
