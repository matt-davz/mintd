-- ============================================================
-- 0020_item_season_year.sql
-- Add season_year directly to items, backfill from game_context,
-- update item_gallery view to expose it.
-- ============================================================

alter table public.items add column season_year integer;

-- Backfill from game_context through all detail tables that carry game_context_id
update public.items i
set season_year = subq.season_year
from (
  select d.item_id, gc.season_year
  from (
    select item_id, game_context_id from public.item_tickets
    union all
    select item_id, game_context_id from public.item_baseballs
    union all
    select item_id, game_context_id from public.item_bats
    union all
    select item_id, game_context_id from public.item_jerseys
    union all
    select item_id, game_context_id from public.item_photos
    union all
    select item_id, game_context_id from public.item_programs
    union all
    select item_id, game_context_id from public.item_bases
    union all
    select item_id, game_context_id from public.item_gloves
  ) d
  join public.game_context gc on gc.id = d.game_context_id
  where gc.season_year is not null
) subq
where i.id = subq.item_id;

-- Also backfill cards from item_cards.year_issued
update public.items i
set season_year = c.year_issued
from public.item_cards c
where c.item_id = i.id
  and c.year_issued is not null
  and i.season_year is null;

-- Recreate item_gallery with season_year
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
    i.item_type,
    i.season_year,
    i.purchase_date,
    i.for_sale,
    i.is_part_of_set,
    i.set_id,
    i.notes,
    i.created_at,

    img.cloudinary_url as primary_image_url,
    s.name             as featured_signer,

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
    c.auto_grade

  from public.items i
  left join public.images img
    on img.item_id = i.id and img.is_primary = true
  left join public.signatories s
    on s.item_id = i.id and s.is_featured = true
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
  where i.is_visible = true and i.is_baseball = true
  group by
    i.id, i.item_type, i.season_year, img.cloudinary_url, s.name, st.name,
    c.cert_service, c.cert_id, c.item_grade, c.auto_grade;

comment on view public.item_gallery is 'Denormalised view for the public gallery — one row per item with tag_slugs, team_slugs, season_year, and primary cert aggregated.';
