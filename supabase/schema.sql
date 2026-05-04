create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  destination text not null,
  start_date date not null,
  end_date date not null,
  travelers integer not null check (travelers between 1 and 8),
  selected_flight_id text not null,
  selected_stay_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.trips enable row level security;

create policy "Users can read their own trips"
  on public.trips
  for select
  using (auth.uid() = user_id);

create policy "Users can create their own trips"
  on public.trips
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own trips"
  on public.trips
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own trips"
  on public.trips
  for delete
  using (auth.uid() = user_id);

