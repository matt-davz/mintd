-- ============================================================
-- 0024_legendary_context.sql
-- Legendary context table (1:1 with items) and legendary_images
-- (1:many with legendary_context) for Timeline special display.
-- ============================================================

create table public.legendary_context (
  id                uuid primary key default gen_random_uuid(),
  item_id           uuid not null unique references public.items(id) on delete cascade,
  event_title       text,
  event_description text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.legendary_images (
  id                    uuid primary key default gen_random_uuid(),
  legendary_context_id  uuid not null references public.legendary_context(id) on delete cascade,
  cloudinary_public_id  text not null unique,
  cloudinary_url        text not null,
  caption               text,
  display_order         integer not null default 0,
  created_at            timestamptz not null default now()
);

create index idx_legendary_context_item_id on public.legendary_context(item_id);
create index idx_legendary_images_context_id on public.legendary_images(legendary_context_id);

-- updated_at trigger for legendary_context
create trigger legendary_context_updated_at
  before update on public.legendary_context
  for each row execute function public.set_updated_at();

-- RLS
alter table public.legendary_context enable row level security;
alter table public.legendary_images  enable row level security;

-- Public read
create policy "public_read_legendary_context" on public.legendary_context for select using (true);
create policy "public_read_legendary_images"  on public.legendary_images  for select using (true);

-- Admin write (same pattern as 0003_admin_write_policies.sql)
create policy "admin_insert_legendary_context" on public.legendary_context for insert with check (true);
create policy "admin_update_legendary_context" on public.legendary_context for update using (true);
create policy "admin_delete_legendary_context" on public.legendary_context for delete using (true);

create policy "admin_insert_legendary_images" on public.legendary_images for insert with check (true);
create policy "admin_update_legendary_images" on public.legendary_images for update using (true);
create policy "admin_delete_legendary_images" on public.legendary_images for delete using (true);

comment on table public.legendary_context is 'Event narrative and context for items marked is_legendary — one row per legendary item.';
comment on table public.legendary_images  is 'Historical/contextual images for a legendary item, separate from the item product shots in images.';
