-- Exercícios favoritos de cada pessoa.
create table if not exists public.exercise_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

alter table public.exercise_favorites enable row level security;

drop policy if exists "own exercise favorites" on public.exercise_favorites;
create policy "own exercise favorites" on public.exercise_favorites
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Mesmo limite das outras tabelas (ver 20261011120000_abuse_protection.sql).
drop trigger if exists throttle_writes on public.exercise_favorites;
create trigger throttle_writes before insert or update on public.exercise_favorites
  for each row execute function private.throttle_writes('60', '2000', 'user_id');
