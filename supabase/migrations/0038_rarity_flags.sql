-- ============================================================
-- 0038_rarity_flags.sql
-- Add manual rarity flags to items.
-- Badges are admin-curated, not derived from PSA pop data.
--   is_one_of_one — only one known copy exists
--   is_finest     — no known copy has a higher grade
-- Both exposed in item_gallery for public gallery cards.
-- ============================================================

alter table public.items
  add column if not exists is_one_of_one boolean not null default false,
  add column if not exists is_finest     boolean not null default false;

-- Rebuild item_gallery to include the two new flag columns
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
    i.is_one_of_one,
    i.is_finest,
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
    c.pop_higher,
    c.pop_same,

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
    select cert.cert_service, cert.cert_id, cert.item_grade, cert.auto_grade,
           lp.higher as pop_higher, lp.same as pop_same
    from public.certifications cert
    left join public.latest_population lp on lp.cert_id = cert.id
    where cert.item_id = i.id
      and cert.cert_service not ilike 'unknown'
    order by
      case when cert.cert_service in ('PSA', 'BGS', 'SGC', 'PSA/DNA') then 0 else 1 end,
      cert.created_at
    limit 1
  ) c on true
  left join lateral (
    select gc2.game_date, gc2.series_game_number
    from (
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
    ) d
    join public.game_context gc2 on gc2.id = d.game_context_id
    where d.game_context_id is not null
    limit 1
  ) gc on true
  left join public.legendary_context lc on lc.item_id = i.id
  where i.is_visible = true and i.is_baseball = true
  group by
    i.id, i.item_type, i.season_year, img.cloudinary_url, s.name, sig_count.cnt, st.name,
    c.cert_service, c.cert_id, c.item_grade, c.auto_grade, c.pop_higher, c.pop_same,
    gc.game_date, gc.series_game_number,
    lc.event_title;

comment on view public.item_gallery is 'Denormalised view for the public gallery. Rarity badges (is_one_of_one, is_finest) are admin-curated flags on items, not derived from pop data.';
