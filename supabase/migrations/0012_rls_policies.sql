-- ============================================================
-- 0012_rls_policies.sql
-- RLS for game_context and all 11 detail tables
--
-- Security model (matches 0001/0003):
--   Public: read-only, detail tables filtered to visible items
--   Admin: full access via anon key (Clerk guards the routes)
--   game_context is a shared lookup — public read unrestricted
-- ============================================================

-- ── game_context ──────────────────────────────────────────────────────────────

alter table public.game_context enable row level security;

create policy "public_read_game_context" on public.game_context
  for select using (true);

create policy "admin_insert_game_context" on public.game_context
  for insert with check (true);

create policy "admin_update_game_context" on public.game_context
  for update using (true);

create policy "admin_delete_game_context" on public.game_context
  for delete using (true);

-- ── item_tickets ──────────────────────────────────────────────────────────────

alter table public.item_tickets enable row level security;

create policy "public_read_item_tickets" on public.item_tickets
  for select using (
    exists (
      select 1 from public.items
      where items.id = item_tickets.item_id
        and items.is_visible = true and items.is_baseball = true
    )
  );

create policy "admin_read_all_item_tickets" on public.item_tickets
  for select using (true);

create policy "admin_insert_item_tickets" on public.item_tickets
  for insert with check (true);

create policy "admin_update_item_tickets" on public.item_tickets
  for update using (true);

create policy "admin_delete_item_tickets" on public.item_tickets
  for delete using (true);

-- ── item_cards ────────────────────────────────────────────────────────────────

alter table public.item_cards enable row level security;

create policy "public_read_item_cards" on public.item_cards
  for select using (
    exists (
      select 1 from public.items
      where items.id = item_cards.item_id
        and items.is_visible = true and items.is_baseball = true
    )
  );

create policy "admin_read_all_item_cards" on public.item_cards
  for select using (true);

create policy "admin_insert_item_cards" on public.item_cards
  for insert with check (true);

create policy "admin_update_item_cards" on public.item_cards
  for update using (true);

create policy "admin_delete_item_cards" on public.item_cards
  for delete using (true);

-- ── item_baseballs ────────────────────────────────────────────────────────────

alter table public.item_baseballs enable row level security;

create policy "public_read_item_baseballs" on public.item_baseballs
  for select using (
    exists (
      select 1 from public.items
      where items.id = item_baseballs.item_id
        and items.is_visible = true and items.is_baseball = true
    )
  );

create policy "admin_read_all_item_baseballs" on public.item_baseballs
  for select using (true);

create policy "admin_insert_item_baseballs" on public.item_baseballs
  for insert with check (true);

create policy "admin_update_item_baseballs" on public.item_baseballs
  for update using (true);

create policy "admin_delete_item_baseballs" on public.item_baseballs
  for delete using (true);

-- ── item_bats ─────────────────────────────────────────────────────────────────

alter table public.item_bats enable row level security;

create policy "public_read_item_bats" on public.item_bats
  for select using (
    exists (
      select 1 from public.items
      where items.id = item_bats.item_id
        and items.is_visible = true and items.is_baseball = true
    )
  );

create policy "admin_read_all_item_bats" on public.item_bats
  for select using (true);

create policy "admin_insert_item_bats" on public.item_bats
  for insert with check (true);

create policy "admin_update_item_bats" on public.item_bats
  for update using (true);

create policy "admin_delete_item_bats" on public.item_bats
  for delete using (true);

-- ── item_jerseys ──────────────────────────────────────────────────────────────

alter table public.item_jerseys enable row level security;

create policy "public_read_item_jerseys" on public.item_jerseys
  for select using (
    exists (
      select 1 from public.items
      where items.id = item_jerseys.item_id
        and items.is_visible = true and items.is_baseball = true
    )
  );

create policy "admin_read_all_item_jerseys" on public.item_jerseys
  for select using (true);

create policy "admin_insert_item_jerseys" on public.item_jerseys
  for insert with check (true);

create policy "admin_update_item_jerseys" on public.item_jerseys
  for update using (true);

create policy "admin_delete_item_jerseys" on public.item_jerseys
  for delete using (true);

-- ── item_photos ───────────────────────────────────────────────────────────────

alter table public.item_photos enable row level security;

create policy "public_read_item_photos" on public.item_photos
  for select using (
    exists (
      select 1 from public.items
      where items.id = item_photos.item_id
        and items.is_visible = true and items.is_baseball = true
    )
  );

create policy "admin_read_all_item_photos" on public.item_photos
  for select using (true);

create policy "admin_insert_item_photos" on public.item_photos
  for insert with check (true);

create policy "admin_update_item_photos" on public.item_photos
  for update using (true);

create policy "admin_delete_item_photos" on public.item_photos
  for delete using (true);

-- ── item_magazines ────────────────────────────────────────────────────────────

alter table public.item_magazines enable row level security;

create policy "public_read_item_magazines" on public.item_magazines
  for select using (
    exists (
      select 1 from public.items
      where items.id = item_magazines.item_id
        and items.is_visible = true and items.is_baseball = true
    )
  );

create policy "admin_read_all_item_magazines" on public.item_magazines
  for select using (true);

create policy "admin_insert_item_magazines" on public.item_magazines
  for insert with check (true);

create policy "admin_update_item_magazines" on public.item_magazines
  for update using (true);

create policy "admin_delete_item_magazines" on public.item_magazines
  for delete using (true);

-- ── item_programs ─────────────────────────────────────────────────────────────

alter table public.item_programs enable row level security;

create policy "public_read_item_programs" on public.item_programs
  for select using (
    exists (
      select 1 from public.items
      where items.id = item_programs.item_id
        and items.is_visible = true and items.is_baseball = true
    )
  );

create policy "admin_read_all_item_programs" on public.item_programs
  for select using (true);

create policy "admin_insert_item_programs" on public.item_programs
  for insert with check (true);

create policy "admin_update_item_programs" on public.item_programs
  for update using (true);

create policy "admin_delete_item_programs" on public.item_programs
  for delete using (true);

-- ── item_books ────────────────────────────────────────────────────────────────

alter table public.item_books enable row level security;

create policy "public_read_item_books" on public.item_books
  for select using (
    exists (
      select 1 from public.items
      where items.id = item_books.item_id
        and items.is_visible = true and items.is_baseball = true
    )
  );

create policy "admin_read_all_item_books" on public.item_books
  for select using (true);

create policy "admin_insert_item_books" on public.item_books
  for insert with check (true);

create policy "admin_update_item_books" on public.item_books
  for update using (true);

create policy "admin_delete_item_books" on public.item_books
  for delete using (true);

-- ── item_bases ────────────────────────────────────────────────────────────────

alter table public.item_bases enable row level security;

create policy "public_read_item_bases" on public.item_bases
  for select using (
    exists (
      select 1 from public.items
      where items.id = item_bases.item_id
        and items.is_visible = true and items.is_baseball = true
    )
  );

create policy "admin_read_all_item_bases" on public.item_bases
  for select using (true);

create policy "admin_insert_item_bases" on public.item_bases
  for insert with check (true);

create policy "admin_update_item_bases" on public.item_bases
  for update using (true);

create policy "admin_delete_item_bases" on public.item_bases
  for delete using (true);

-- ── item_gloves ───────────────────────────────────────────────────────────────

alter table public.item_gloves enable row level security;

create policy "public_read_item_gloves" on public.item_gloves
  for select using (
    exists (
      select 1 from public.items
      where items.id = item_gloves.item_id
        and items.is_visible = true and items.is_baseball = true
    )
  );

create policy "admin_read_all_item_gloves" on public.item_gloves
  for select using (true);

create policy "admin_insert_item_gloves" on public.item_gloves
  for insert with check (true);

create policy "admin_update_item_gloves" on public.item_gloves
  for update using (true);

create policy "admin_delete_item_gloves" on public.item_gloves
  for delete using (true);
