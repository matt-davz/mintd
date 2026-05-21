-- Remove game_result from item_tickets — redundant with game_context.game_result.

alter table public.item_tickets
  drop column game_result;
