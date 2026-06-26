-- ============================================================
-- 0028_item_loas.sql
-- Letters of Authenticity per item.
-- Multiple LOAs per item, each stored as a Cloudinary asset
-- (images or PDFs via resource_type='image').
-- Cloudinary path: mintd/loas/{itemId_first8}/{filename}
-- ============================================================

create table public.item_loas (
  id                   uuid        primary key default gen_random_uuid(),
  item_id              uuid        not null references public.items(id) on delete cascade,
  cloudinary_url       text        not null,
  cloudinary_public_id text        not null,
  label                text,        -- e.g. 'JSA', 'PSA/DNA', 'Steiner'
  resource_type        text        not null default 'image' check (resource_type in ('image', 'pdf')),
  display_order        integer     not null default 0,
  created_at           timestamptz not null default now()
);

create index item_loas_item_id_idx on public.item_loas (item_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.item_loas enable row level security;

create policy "public_read_item_loas" on public.item_loas
  for select using (
    exists (
      select 1 from public.items
      where items.id = item_loas.item_id
        and items.is_visible = true and items.is_baseball = true
    )
  );

create policy "admin_read_all_item_loas" on public.item_loas
  for select using (true);

create policy "admin_insert_item_loas" on public.item_loas
  for insert with check (true);

create policy "admin_update_item_loas" on public.item_loas
  for update using (true);

create policy "admin_delete_item_loas" on public.item_loas
  for delete using (true);
