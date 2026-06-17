-- ============================================================
-- 0018_teams_abbreviation.sql
-- Add abbreviation column to teams for matching MLB API values,
-- admin write policies for item_teams
-- ============================================================

alter table public.teams add column abbreviation text unique;

update public.teams set abbreviation = 'NYY' where slug = 'yankees';

-- Admin write policies for item_teams
create policy "admin_insert_item_teams" on public.item_teams
  for insert with check (true);

create policy "admin_delete_item_teams" on public.item_teams
  for delete using (true);
