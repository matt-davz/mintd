-- ============================================================
-- 0006_item_type_column.sql
-- Add item_type enum column to items
-- Nullable — existing rows will be back-filled via the admin UI
-- ============================================================

alter table public.items
  add column item_type public.item_type_enum;

comment on column public.items.item_type is 'Primary type of the memorabilia item — drives which detail table is populated';

create index idx_items_item_type on public.items(item_type);
