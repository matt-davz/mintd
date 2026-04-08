-- ============================================================
-- 0004_enums.sql
-- All new enum types for item-type-specific schema
-- Must run before any table that references these types
-- ============================================================

create type public.item_type_enum as enum (
  'ticket',
  'card',
  'baseball',
  'bat',
  'jersey',
  'photo',
  'magazine',
  'program',
  'book',
  'base',
  'glove'
);

-- Shared game type — used by game_context and item_programs
create type public.game_type_enum as enum (
  'regular_season',
  'alds',
  'alcs',
  'nlds',
  'nlcs',
  'world_series',
  'all_star',
  'spring_training',
  'exhibition'
);

-- Game result from the home team perspective — used by game_context
create type public.game_result_enum as enum (
  'home_win',
  'home_loss',
  'tie',
  'unknown'
);

-- Game result from the ticket holder's perspective (win/loss of their team)
create type public.ticket_game_result_enum as enum (
  'win',
  'loss',
  'tie',
  'unknown'
);

-- How a baseball/bat/jersey etc. was used in game context
-- NULL means item is not game-used; 'display' is omitted (use is_game_used = false)
create type public.game_used_type_enum as enum (
  'game',
  'batting_practice',
  'home_run',
  'ceremonial_first_pitch'
);

create type public.jersey_type_enum as enum (
  'home',
  'away',
  'alternate',
  'spring_training',
  'all_star',
  'throwback'
);

create type public.photo_type_enum as enum (
  'type_1',
  'type_2',
  'type_3'
);

create type public.photo_format_enum as enum (
  'original_print',
  'wire_photo',
  'news_service',
  'cabinet_card',
  'cdv',
  'reprint'
);

create type public.photo_era_enum as enum (
  'sepia',
  'black_and_white',
  'color'
);

create type public.base_position_enum as enum (
  'first',
  'second',
  'third',
  'home'
);

create type public.player_position_enum as enum (
  'pitcher',
  'catcher',
  'first_base',
  'second_base',
  'third_base',
  'shortstop',
  'outfield'
);

create type public.handedness_enum as enum (
  'left_hand_throw',
  'right_hand_throw'
);
