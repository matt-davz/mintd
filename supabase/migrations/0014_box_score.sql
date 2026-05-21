-- Add box_score JSONB column to game_context for inning-by-inning line scores + R/H/E totals.
-- Existing home_score / away_score columns are kept for items without a full box score.

alter table public.game_context
  add column box_score jsonb
  constraint box_score_shape check (
    box_score is null
    or (
      box_score ? 'innings'
      and box_score ? 'home'
      and box_score ? 'away'
      and jsonb_typeof(box_score -> 'innings') = 'array'
      and jsonb_typeof(box_score -> 'home') = 'object'
      and jsonb_typeof(box_score -> 'away') = 'object'
    )
  );
