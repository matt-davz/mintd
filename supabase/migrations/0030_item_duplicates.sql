-- ============================================================
-- 0030_item_duplicates.sql
-- item_duplicates join table for linking duplicate items together
-- ============================================================

create table public.item_duplicates (
  item_id         uuid not null references public.items(id) on delete cascade,
  duplicate_of_id uuid not null references public.items(id) on delete cascade,
  notes           text,
  created_at      timestamptz not null default now(),
  primary key (item_id, duplicate_of_id),
  check (item_id != duplicate_of_id)
);

alter table public.item_duplicates enable row level security;

create policy "public_read_item_duplicates" on public.item_duplicates
  for select using (true);

create policy "admin_insert_item_duplicates" on public.item_duplicates
  for insert with check (true);

create policy "admin_delete_item_duplicates" on public.item_duplicates
  for delete using (true);
