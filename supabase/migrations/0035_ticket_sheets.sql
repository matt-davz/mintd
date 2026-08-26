-- ============================================================
-- 0035_ticket_sheets.sql
-- Add ticket_sheet item type + supporting tables.
--
-- A ticket sheet is an uncut/intact strip of multiple game
-- tickets sold as a single collectible. Each game on the sheet
-- gets its own game_context record linked via a junction table.
--
-- Changes:
--   1. Add 'ticket_sheet' to item_type_enum
--   2. Create item_ticket_sheets detail table
--   3. Create ticket_sheet_games junction table
--   4. Rebuild item_gallery view to include ticket_sheet game data
--   5. RLS policies for new tables
-- ============================================================

-- 1. Add 'ticket_sheet' to the item_type enum --------------------------------

alter type public.item_type_enum add value if not exists 'ticket_sheet';

-- 2. Create item_ticket_sheets detail table -----------------------------------

create table if not exists public.item_ticket_sheets (
  id                    uuid primary key default gen_random_uuid(),
  item_id               uuid not null references public.items(id) on delete cascade,
  sheet_size            integer not null,          -- number of tickets on the sheet
  is_uncut              boolean default true,      -- whether the sheet is still intact
  printer               text,                      -- ticket printer/manufacturer
  section               text,                      -- shared section (if all same)
  row                   text,                      -- shared row
  seat                  text,                      -- shared seat
  face_value            numeric,                   -- face value per ticket
  includes_phantom_game boolean default false,     -- sheet has a game that was never played
  phantom_game_label    text,                      -- e.g. "Game 6", "Game X"
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  constraint uq_ticket_sheets_item unique (item_id)
);

comment on table public.item_ticket_sheets is
  'Detail table for ticket_sheet items — an intact strip of multiple game tickets.';

-- 3. Create ticket_sheet_games junction table ---------------------------------

create table if not exists public.ticket_sheet_games (
  id                uuid primary key default gen_random_uuid(),
  ticket_sheet_id   uuid not null references public.item_ticket_sheets(id) on delete cascade,
  game_context_id   uuid not null references public.game_context(id) on delete cascade,
  display_order     integer default 0,            -- order on the sheet (left to right)
  is_phantom        boolean default false,        -- true if this game was never played
  game_label        text,                         -- optional label override, e.g. "Game X"
  created_at        timestamptz default now(),
  constraint uq_sheet_game unique (ticket_sheet_id, game_context_id)
);

comment on table public.ticket_sheet_games is
  'Junction table linking a ticket sheet to multiple game_context records (one per game on the sheet).';

-- Indexes
create index if not exists idx_ticket_sheet_games_sheet
  on public.ticket_sheet_games(ticket_sheet_id);
create index if not exists idx_ticket_sheet_games_context
  on public.ticket_sheet_games(game_context_id);
create index if not exists idx_ticket_sheets_item
  on public.item_ticket_sheets(item_id);

-- 4. Rebuild item_gallery view ------------------------------------------------
-- Now includes ticket_sheet game data in the game_context lateral join.
-- For ticket_sheets, picks the earliest (lowest series_game_number) real game
-- so the gallery card shows the first game on the sheet.

drop view if exists public.item_gallery;

create view public.item_gallery as
  select
    i.id,
    i.title,
    i.museum_title,
    i.description,
    i.reference_link,
    i.price,
    i.acquisition_type,
    i.is_autographed,
    i.is_legendary,
    i.item_type,
    i.season_year,
    i.purchase_date,
    i.for_sale,
    i.is_part_of_set,
    i.set_id,
    i.notes,
    i.created_at,

    img.cloudinary_url as primary_image_url,

    s.name as featured_signer,

    coalesce(sig_count.cnt, 0) as signatory_count,

    coalesce(
      array_agg(distinct t.slug) filter (where t.slug is not null),
      '{}'
    ) as tag_slugs,

    coalesce(
      array_agg(distinct tm.slug) filter (where tm.slug is not null),
      '{}'
    ) as team_slugs,

    st.name as set_name,

    c.cert_service,
    c.cert_id,
    c.item_grade as cert_grade,
    c.auto_grade,

    gc.game_date,
    gc.series_game_number,

    i.is_duplicate,

    lc.event_title as legendary_event_title

  from public.items i
  left join public.images img
    on img.item_id = i.id and img.is_primary = true
  left join lateral (
    select name
    from public.signatories
    where item_id = i.id and is_featured = true
    order by display_order
    limit 1
  ) s on true
  left join lateral (
    select count(*)::int as cnt
    from public.signatories
    where item_id = i.id
  ) sig_count on true
  left join public.item_tags it
    on it.item_id = i.id
  left join public.tags t
    on t.id = it.tag_id
  left join public.item_teams itm
    on itm.item_id = i.id
  left join public.teams tm
    on tm.id = itm.team_id
  left join public.sets st
    on st.id = i.set_id
  left join lateral (
    select cert_service, cert_id, item_grade, auto_grade
    from public.certifications
    where item_id = i.id
      and cert_service not ilike 'unknown'
    order by
      case when cert_service in ('PSA', 'BGS', 'SGC', 'PSA/DNA') then 0 else 1 end,
      created_at
    limit 1
  ) c on true
  left join lateral (
    select gc2.game_date, gc2.series_game_number
    from (
      -- Standard single-game item types
      select game_context_id from public.item_tickets           where item_id = i.id
      union all
      select game_context_id from public.item_baseballs         where item_id = i.id
      union all
      select game_context_id from public.item_bats              where item_id = i.id
      union all
      select game_context_id from public.item_jerseys           where item_id = i.id
      union all
      select game_context_id from public.item_photos            where item_id = i.id
      union all
      select game_context_id from public.item_programs          where item_id = i.id
      union all
      select game_context_id from public.item_bases             where item_id = i.id
      union all
      select game_context_id from public.item_gloves            where item_id = i.id
      union all
      select game_context_id from public.item_stadium_giveaways where item_id = i.id
      union all
      -- Ticket sheet games (pick earliest real game)
      select tsg.game_context_id
      from public.item_ticket_sheets its
      join public.ticket_sheet_games tsg on tsg.ticket_sheet_id = its.id
      where its.item_id = i.id and tsg.is_phantom = false
    ) d
    join public.game_context gc2 on gc2.id = d.game_context_id
    where d.game_context_id is not null
    order by gc2.series_game_number nulls last, gc2.game_date
    limit 1
  ) gc on true
  left join public.legendary_context lc on lc.item_id = i.id
  where i.is_visible = true and i.is_baseball = true
  group by
    i.id, i.item_type, i.season_year, img.cloudinary_url, s.name, sig_count.cnt, st.name,
    c.cert_service, c.cert_id, c.item_grade, c.auto_grade,
    gc.game_date, gc.series_game_number,
    lc.event_title;

comment on view public.item_gallery is
  'Denormalised gallery view — now includes ticket_sheet game contexts via junction table.';

-- 5. RLS policies -------------------------------------------------------------

alter table public.item_ticket_sheets enable row level security;
alter table public.ticket_sheet_games enable row level security;

-- Public read
create policy "Public read item_ticket_sheets"
  on public.item_ticket_sheets for select using (true);
create policy "Public read ticket_sheet_games"
  on public.ticket_sheet_games for select using (true);

-- Authenticated write (same pattern as other detail tables)
create policy "Authenticated insert item_ticket_sheets"
  on public.item_ticket_sheets for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update item_ticket_sheets"
  on public.item_ticket_sheets for update using (auth.role() = 'authenticated');
create policy "Authenticated delete item_ticket_sheets"
  on public.item_ticket_sheets for delete using (auth.role() = 'authenticated');

create policy "Authenticated insert ticket_sheet_games"
  on public.ticket_sheet_games for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update ticket_sheet_games"
  on public.ticket_sheet_games for update using (auth.role() = 'authenticated');
create policy "Authenticated delete ticket_sheet_games"
  on public.ticket_sheet_games for delete using (auth.role() = 'authenticated');
