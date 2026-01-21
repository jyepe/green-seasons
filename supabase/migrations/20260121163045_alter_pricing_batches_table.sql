-- 1) Allow pricing batches with no creator
alter table public.pricing_batches
  alter column finalized_by drop not null;

-- 2) Replace the FK to clear creator when the user is deleted
alter table public.pricing_batches
  drop constraint if exists pricing_batches_finalized_by_fkey;

alter table public.pricing_batches
  add constraint pricing_batches_finalized_by_fkey
  foreign key (finalized_by)
  references public.profiles (id)
  on delete set null;