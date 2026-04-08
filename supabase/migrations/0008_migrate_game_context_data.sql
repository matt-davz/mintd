-- ============================================================
-- 0008_migrate_game_context_data.sql
-- Copy game context data from items into the new game_context
-- table and back-fill items.game_context_id.
--
-- Only migrates items where at least one meaningful game field
-- is set (game_date, is_world_series_game, is_clinch_game).
-- The location column is mapped to venue only when one of the
-- above triggers a context row — it is NOT used alone as a
-- trigger since it may represent a storage location, not a venue.
-- ============================================================

do $$
declare
  r          record;
  new_gc_id  uuid;
begin
  for r in
    select
      id,
      game_date,
      location,
      case when is_world_series_game
        then 'world_series'::public.game_type_enum
      end as game_type,
      ws_game_number as series_game_number,
      case when is_clinch_game
        then 'Clinch game' || coalesce(' #' || clinch_number::text, '')
      end as notes
    from public.items
    where game_date is not null
       or is_world_series_game = true
       or is_clinch_game = true
  loop
    insert into public.game_context (game_date, venue, game_type, series_game_number, notes)
    values (r.game_date, r.location, r.game_type, r.series_game_number, r.notes)
    returning id into new_gc_id;

    update public.items
    set game_context_id = new_gc_id
    where id = r.id;
  end loop;
end;
$$;
