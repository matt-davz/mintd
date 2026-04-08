-- ============================================================
-- 0005_game_context.sql
-- Shared game context table — linked from item detail tables
-- Also adds a temporary game_context_id FK to items for the
-- data migration in 0008 (dropped again in 0009)
-- ============================================================

create table public.game_context (
  id                  uuid primary key default gen_random_uuid(),
  game_date           date,
  home_team           text,
  away_team           text,
  venue               text,
  city                text,
  season_year         integer,
  game_type           public.game_type_enum,
  series_game_number  integer,
  game_result         public.game_result_enum,
  home_score          integer,
  away_score          integer,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.game_context is 'Structured game metadata — shared across item detail tables';

create trigger game_context_updated_at
  before update on public.game_context
  for each row execute function public.set_updated_at();

create index idx_game_context_game_date on public.game_context(game_date);

-- Temporary FK on items — used only during the data migration in 0008.
-- Dropped in 0009 once game_context_id moves to the detail tables.
alter table public.items
  add column game_context_id uuid references public.game_context(id) on delete set null;
