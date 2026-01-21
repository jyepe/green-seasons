-- 1) Allow orders with no creator
alter table public.orders
  alter column created_by drop not null;

-- 2) Replace the FK to clear creator when the user is deleted
alter table public.orders
  drop constraint if exists orders_created_by_fkey;

alter table public.orders
  add constraint orders_created_by_fkey
  foreign key (created_by)
  references public.profiles (id)
  on delete set null;