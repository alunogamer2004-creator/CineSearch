-- Execute in Supabase SQL Editor.
create table if not exists public.watchlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  media_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  movie jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, media_id, media_type)
);
alter table public.watchlist enable row level security;
create policy read_own_watchlist on public.watchlist for select using (auth.uid() = user_id);
create policy insert_own_watchlist on public.watchlist for insert with check (auth.uid() = user_id);
create policy update_own_watchlist on public.watchlist for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy delete_own_watchlist on public.watchlist for delete using (auth.uid() = user_id);
