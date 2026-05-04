create table public.client_errors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  user_role text,
  error_message text not null,
  error_stack text,
  context jsonb,
  platform text,
  app_version text
);

alter table public.client_errors enable row level security;

-- Authenticated users can insert their own errors
create policy "Authenticated users can insert own errors"
  on public.client_errors
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Anon role can insert pre-login crashes — user_id must be null
create policy "Anon users can insert errors without user_id"
  on public.client_errors
  for insert
  to anon
  with check (user_id is null);

-- Only admins can read errors
create policy "Admins can view all errors"
  on public.client_errors
  for select
  to authenticated
  using (public.fn_is_admin());
