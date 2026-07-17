-- ============================================================
-- 0034_legendary_museum_title.sql
-- Add museum_title to legendary_context.
-- Displayed on the Museum/Timeline page instead of the full
-- item title. Follows the short naming convention:
--   non-autographed: [tidbit] — Ticket Stub / Full Ticket / Program / etc.
--   autographed:     [tidbit] — Ticket Stub — Signed by [Name(s)]
-- If NULL, the museum page falls back to items.title.
-- ============================================================

alter table public.legendary_context
  add column if not exists museum_title text;

comment on column public.legendary_context.museum_title is
  'Short title shown on the Museum/Timeline page. Follows the tidbit naming convention. Falls back to items.title when NULL.';

-- Expose in item_gallery view -------------------------------------------------------
-- Re-create item_gallery to include legendary_museum_title alongside existing fields.

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
    s.name             as featured_signer,
    sc.signatory_count,

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

    lc.event_title       as legendary_event_title,
    lc.museum_title      as legendary_museum_title

  from public.items i
  left join public.images img
    on img.item_id = i.id and img.is_primary = true
  left join lateral (
    select name
    from public.signatories
    where item_id = i.id and is_featured = true
    limit 1
  ) s on true
  left join lateral (
    select count(*)::integer as signatory_count
    from public.signatories
    where item_id = i.id
  ) sc on true
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
      select game_context_id from public.item_tickets         where item_id = i.id
      union all
      select game_context_id from public.item_baseballs       where item_id = i.id
      union all
      select game_context_id from public.item_bats            where item_id = i.id
      union all
      select game_context_id from public.item_jerseys         where item_id = i.id
      union all
      select game_context_id from public.item_photos          where item_id = i.id
      union all
      select game_context_id from public.item_programs        where item_id = i.id
      union all
      select game_context_id from public.item_bases           where item_id = i.id
      union all
      select game_context_id from public.item_gloves          where item_id = i.id
    ) d
    join public.game_context gc2 on gc2.id = d.game_context_id
    where d.game_context_id is not null
    limit 1
  ) gc on true
  left join public.legendary_context lc
    on lc.item_id = i.id
  where i.is_visible = true and i.is_baseball = true
  group by
    i.id, i.item_type, i.season_year, img.cloudinary_url, s.name, sc.signatory_count,
    st.name, c.cert_service, c.cert_id, c.item_grade, c.auto_grade,
    gc.game_date, gc.series_game_number,
    lc.event_title, lc.museum_title;

comment on view public.item_gallery is 'Denormalised view for the public gallery — one row per item with tag_slugs, team_slugs, season_year, primary cert, is_legendary, game_date, series_game_number, and legendary_museum_title aggregated.';
