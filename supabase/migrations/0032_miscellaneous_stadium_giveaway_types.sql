-- ============================================================
-- 0032_miscellaneous_stadium_giveaway_types.sql
-- Adds two new item types: 'miscellaneous' and 'stadium_giveaway'.
-- item_miscellaneous has no game context (misc items don't have one).
-- item_stadium_giveaways has game_context_id like other game-linked types.
-- Rebuilds item_gallery to include item_stadium_giveaways in the
-- game_context lateral join. Everything else matches migration 0027.
-- ============================================================

-- ── Enum values ───────────────────────────────────────────────────────────────

alter type public.item_type_enum add value 'miscellaneous';
alter type public.item_type_enum add value 'stadium_giveaway';

-- ── item_miscellaneous ────────────────────────────────────────────────────────

create table public.item_miscellaneous (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null references public.items(id) on delete cascade,
  category     text,
  description  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.item_miscellaneous is 'Miscellaneous item-specific detail data (no game context)';
create unique index idx_item_miscellaneous_item_id on public.item_miscellaneous(item_id);
create trigger item_miscellaneous_updated_at
  before update on public.item_miscellaneous
  for each row execute function public.set_updated_at();

alter table public.item_miscellaneous enable row level security;

create policy "public_read_item_miscellaneous" on public.item_miscellaneous
  for select using (
    exists (
      select 1 from public.items
      where items.id = item_miscellaneous.item_id
        and items.is_visible = true and items.is_baseball = true
    )
  );

create policy "admin_read_all_item_miscellaneous" on public.item_miscellaneous
  for select using (true);

create policy "admin_insert_item_miscellaneous" on public.item_miscellaneous
  for insert with check (true);

create policy "admin_update_item_miscellaneous" on public.item_miscellaneous
  for update using (true);

create policy "admin_delete_item_miscellaneous" on public.item_miscellaneous
  for delete using (true);

-- ── item_stadium_giveaways ────────────────────────────────────────────────────

create table public.item_stadium_giveaways (
  id                   uuid primary key default gen_random_uuid(),
  item_id              uuid not null references public.items(id) on delete cascade,
  event_name           text,
  event_date           date,
  giveaway_item_type   text,
  manufacturer         text,
  game_context_id      uuid references public.game_context(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table public.item_stadium_giveaways is 'Stadium giveaway-specific detail data';
create unique index idx_item_stadium_giveaways_item_id on public.item_stadium_giveaways(item_id);
create trigger item_stadium_giveaways_updated_at
  before update on public.item_stadium_giveaways
  for each row execute function public.set_updated_at();

alter table public.item_stadium_giveaways enable row level security;

create policy "public_read_item_stadium_giveaways" on public.item_stadium_giveaways
  for select using (
    exists (
      select 1 from public.items
      where items.id = item_stadium_giveaways.item_id
        and items.is_visible = true and items.is_baseball = true
    )
  );

create policy "admin_read_all_item_stadium_giveaways" on public.item_stadium_giveaways
  for select using (true);

create policy "admin_insert_item_stadium_giveaways" on public.item_stadium_giveaways
  for insert with check (true);

create policy "admin_update_item_stadium_giveaways" on public.item_stadium_giveaways
  for update using (true);

create policy "admin_delete_item_stadium_giveaways" on public.item_stadium_giveaways
  for delete using (true);

-- ── item_gallery view — add item_stadium_giveaways to game_context lateral join ─

drop view if exists public.item_gallery;

create view public.item_gallery as
  select
    i.id,
    i.title,
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

    -- Single featured signer (LATERAL prevents duplicates when multiple is_featured rows exist)
    s.name as featured_signer,

    -- Total signatory count for "+ N others" display
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
      select game_context_id from public.item_tickets            where item_id = i.id
      union all
      select game_context_id from public.item_baseballs          where item_id = i.id
      union all
      select game_context_id from public.item_bats               where item_id = i.id
      union all
      select game_context_id from public.item_jerseys            where item_id = i.id
      union all
      select game_context_id from public.item_photos             where item_id = i.id
      union all
      select game_context_id from public.item_programs           where item_id = i.id
      union all
      select game_context_id from public.item_bases              where item_id = i.id
      union all
      select game_context_id from public.item_gloves             where item_id = i.id
      union all
      select game_context_id from public.item_stadium_giveaways  where item_id = i.id
    ) d
    join public.game_context gc2 on gc2.id = d.game_context_id
    where d.game_context_id is not null
    limit 1
  ) gc on true
  left join public.legendary_context lc on lc.item_id = i.id
  where i.is_visible = true and i.is_baseball = true
  group by
    i.id, i.item_type, i.season_year, img.cloudinary_url, s.name, sig_count.cnt, st.name,
    c.cert_service, c.cert_id, c.item_grade, c.auto_grade,
    gc.game_date, gc.series_game_number,
    lc.event_title;

comment on view public.item_gallery is 'Denormalised view for the public gallery — one row per item with tag_slugs, team_slugs, season_year, signatory_count, primary cert, is_legendary, game_date, series_game_number, and legendary_event_title aggregated.';
