-- 1) Allow restaurants with no owner
alter table public.restaurants
  alter column owner_id drop not null;

-- 2) Replace the FK to clear owner_id when the user is deleted
alter table public.restaurants
  drop constraint if exists restaurants_owner_id_fkey;

alter table public.restaurants
  add constraint restaurants_owner_id_fkey
  foreign key (owner_id)
  references auth.users (id)
  on delete set null;
