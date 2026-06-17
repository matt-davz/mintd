-- ============================================================
-- 0019_backfill_teams.sql
-- Seed all teams found in game_context, then backfill
-- item_teams from home_team/away_team on all detail tables.
-- Matches on abbreviation OR full name to handle the mixed
-- format stored in game_context.
-- ============================================================

-- Seed teams (skip any slug or abbreviation conflicts)
insert into public.teams (name, slug, abbreviation) values
  ('Arizona Diamondbacks',   'arizona-diamondbacks',   'AZ'),
  ('Atlanta Braves',         'atlanta-braves',         'ATL'),
  ('Baltimore Orioles',      'baltimore-orioles',      'BAL'),
  ('Boston Red Sox',         'boston-red-sox',         'BOS'),
  ('Brooklyn Dodgers',       'brooklyn-dodgers',       'BRK'),
  ('California Angels',      'california-angels',      'CAL'),
  ('Chicago Cubs',           'chicago-cubs',           'CHC'),
  ('Chicago White Sox',      'chicago-white-sox',      'CWS'),
  ('Cincinnati Reds',        'cincinnati-reds',        'CIN'),
  ('Cleveland Indians',      'cleveland-indians',      'CLE'),
  ('Colorado Rockies',       'colorado-rockies',       'COL'),
  ('Florida Marlins',        'florida-marlins',        'FLA'),
  ('Kansas City Royals',     'kansas-city-royals',     'KC'),
  ('Los Angeles Angels',     'los-angeles-angels',     'LAA'),
  ('Los Angeles Dodgers',    'los-angeles-dodgers',    'LAD'),
  ('Milwaukee Braves',       'milwaukee-braves',       'MLN'),
  ('New York Giants',        'new-york-giants',        'NYG'),
  ('New York Mets',          'new-york-mets',          'NYM'),
  ('Oakland Athletics',      'oakland-athletics',      'OAK'),
  ('Philadelphia Athletics', 'philadelphia-athletics', 'PHA'),
  ('Philadelphia Phillies',  'philadelphia-phillies',  'PHI'),
  ('Pittsburgh Pirates',     'pittsburgh-pirates',     'PIT'),
  ('San Francisco Giants',   'san-francisco-giants',   'SF'),
  ('Seattle Mariners',       'seattle-mariners',       'SEA'),
  ('St. Louis Cardinals',    'st-louis-cardinals',     'STL'),
  ('Tampa Bay Devil Rays',   'tampa-bay-devil-rays',   'TBD'),
  ('Tampa Bay Rays',         'tampa-bay-rays',         'TB'),
  ('Texas Rangers',          'texas-rangers',          'TEX'),
  ('Toronto Blue Jays',      'toronto-blue-jays',      'TOR'),
  ('Washington Senators',    'washington-senators',    'WSH')
on conflict do nothing;

-- Backfill item_teams from all detail tables that carry game_context_id.
-- Handles both abbreviation-style (NYY) and full-name-style (New York Yankees)
-- stored in game_context.home_team / away_team.
-- Non-MLB values (A/S, Central, etc.) simply won't match and are silently skipped.

with game_items as (
  select item_id, gc.home_team, gc.away_team
  from public.item_tickets d
  join public.game_context gc on gc.id = d.game_context_id
  where d.game_context_id is not null

  union all

  select item_id, gc.home_team, gc.away_team
  from public.item_baseballs d
  join public.game_context gc on gc.id = d.game_context_id
  where d.game_context_id is not null

  union all

  select item_id, gc.home_team, gc.away_team
  from public.item_bats d
  join public.game_context gc on gc.id = d.game_context_id
  where d.game_context_id is not null

  union all

  select item_id, gc.home_team, gc.away_team
  from public.item_jerseys d
  join public.game_context gc on gc.id = d.game_context_id
  where d.game_context_id is not null

  union all

  select item_id, gc.home_team, gc.away_team
  from public.item_photos d
  join public.game_context gc on gc.id = d.game_context_id
  where d.game_context_id is not null

  union all

  select item_id, gc.home_team, gc.away_team
  from public.item_programs d
  join public.game_context gc on gc.id = d.game_context_id
  where d.game_context_id is not null

  union all

  select item_id, gc.home_team, gc.away_team
  from public.item_bases d
  join public.game_context gc on gc.id = d.game_context_id
  where d.game_context_id is not null

  union all

  select item_id, gc.home_team, gc.away_team
  from public.item_gloves d
  join public.game_context gc on gc.id = d.game_context_id
  where d.game_context_id is not null
),
team_values as (
  select item_id, home_team as team_value from game_items where home_team is not null and home_team <> ''
  union all
  select item_id, away_team as team_value from game_items where away_team is not null and away_team <> ''
)
insert into public.item_teams (item_id, team_id)
select distinct tv.item_id, t.id
from team_values tv
join public.teams t on t.abbreviation = tv.team_value or t.name = tv.team_value
on conflict do nothing;
