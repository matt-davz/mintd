-- ============================================================
-- 0009_drop_old_view_and_columns.sql
-- 1. Drop the item_cards VIEW — it will be recreated as the
--    item_gallery view in 0011. The name 'item_cards' is needed
--    for the trading card detail table created in 0010.
-- 2. Drop the 6 game context columns that were migrated to the
--    game_context table in 0008.
-- 3. Drop the temporary game_context_id FK from items — game
--    context will live on the detail tables instead.
-- ============================================================

-- Must drop before 0010 creates the item_cards TABLE
drop view if exists public.item_cards;

-- Remove migrated game context columns
alter table public.items
  drop column game_date,
  drop column location,
  drop column is_world_series_game,
  drop column ws_game_number,
  drop column is_clinch_game,
  drop column clinch_number;

-- Remove the temporary migration FK (0005)
alter table public.items
  drop column game_context_id;
