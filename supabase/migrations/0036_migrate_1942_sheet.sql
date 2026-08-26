-- ============================================================
-- 0036_migrate_1942_sheet.sql
-- Convert the 1942 WS ticket sheet from item_type 'ticket'
-- to 'ticket_sheet' and populate the new tables.
--
-- Item: 40cab7ff-ec96-556f-9723-e3ca71f7e35a
-- "1942 World Series Full Tickets Sheet of 4 Signed by Joe DiMaggio"
--
-- Sheet contains Games 3, 4, 5, and a phantom Game 6 (never played).
-- All Yankee Stadium home games.
--
-- Existing game_context records:
--   Game 3: 9d5b6cba-15bd-4a35-aae1-d8ec2b57fe19 (from this item)
--   Game 5: c66c1205-5629-4775-900d-0feadec85f56 (from separate Game 5 stub item)
--
-- New game_context records needed:
--   Game 4: Oct 4, 1942 — Cardinals 9, Yankees 6
--   Game 6: phantom — never played
-- ============================================================

-- 1. Change item_type from 'ticket' to 'ticket_sheet' ------------------------

update public.items
set item_type = 'ticket_sheet',
    season_year = 1942,
    updated_at = now()
where id = '40cab7ff-ec96-556f-9723-e3ca71f7e35a';

-- 2. Create Game 4 game_context -----------------------------------------------

insert into public.game_context (
  id, game_date, home_team, away_team, venue, city,
  season_year, game_type, series_game_number,
  game_result, home_score, away_score, notes
) values (
  'a4f2c8d1-1942-4004-b000-000000000004',
  '1942-10-04',
  'New York Yankees',
  'St. Louis Cardinals',
  'Yankee Stadium',
  'New York',
  1942,
  'world_series',
  4,
  'home_loss',
  6,
  9,
  'Cardinals take 3-1 series lead. Largest comeback in WS history at the time — Cardinals trailed 1-0 after 3 innings.'
);

-- 3. Create phantom Game 6 game_context ---------------------------------------

insert into public.game_context (
  id, game_date, home_team, away_team, venue, city,
  season_year, game_type, series_game_number,
  game_result, home_score, away_score, notes
) values (
  'a4f2c8d1-1942-4006-b000-000000000006',
  null,
  'New York Yankees',
  'St. Louis Cardinals',
  'Yankee Stadium',
  'New York',
  1942,
  'world_series',
  6,
  'unknown',
  null,
  null,
  'Pre-printed Game 6 — never played. Cardinals won the series in 5 games.'
);

-- 4. Create item_ticket_sheets detail record ----------------------------------

insert into public.item_ticket_sheets (
  id, item_id, sheet_size, is_uncut, printer,
  section, row, seat, face_value,
  includes_phantom_game, phantom_game_label
) values (
  'b5e3d9e2-1942-4000-a000-000000000001',
  '40cab7ff-ec96-556f-9723-e3ca71f7e35a',
  4,
  true,
  null,
  null,
  null,
  null,
  null,
  true,
  'Game 6 (never played)'
);

-- 5. Link all 4 games via ticket_sheet_games ----------------------------------

insert into public.ticket_sheet_games (ticket_sheet_id, game_context_id, display_order, is_phantom, game_label)
values
  -- Game 3: existing context from this item
  ('b5e3d9e2-1942-4000-a000-000000000001', '9d5b6cba-15bd-4a35-aae1-d8ec2b57fe19', 1, false, 'Game 3'),
  -- Game 4: newly created
  ('b5e3d9e2-1942-4000-a000-000000000001', 'a4f2c8d1-1942-4004-b000-000000000004', 2, false, 'Game 4'),
  -- Game 5: existing context from separate Game 5 stub (shared reference)
  ('b5e3d9e2-1942-4000-a000-000000000001', 'c66c1205-5629-4775-900d-0feadec85f56', 3, false, 'Game 5'),
  -- Game 6: phantom
  ('b5e3d9e2-1942-4000-a000-000000000001', 'a4f2c8d1-1942-4006-b000-000000000006', 4, true, 'Game 6 (never played)');

-- 6. Remove old item_tickets record (no longer a single ticket) ---------------

delete from public.item_tickets
where item_id = '40cab7ff-ec96-556f-9723-e3ca71f7e35a';

-- 7. Update the old game_context (Game 3) venue for consistency ---------------
-- The Game 5 context says "Yankee Stadium I" but Game 3 says "Yankee Stadium"
-- Normalize to "Yankee Stadium" since that's what it was called in 1942.

update public.game_context
set venue = 'Yankee Stadium', city = 'New York'
where id = 'c66c1205-5629-4775-900d-0feadec85f56'
  and venue = 'Yankee Stadium I';
