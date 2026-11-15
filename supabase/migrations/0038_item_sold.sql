-- ============================================================
-- 0038_item_sold.sql
-- Track sold items. Sold items stay visible in the collection
-- (shown with a "Sold" badge only on the public site; sale_price is
-- admin/DB only, never exposed via item_gallery) but are excluded
-- from active inventory.
--
-- items.price remains ACQUISITION cost and is never touched here.
-- sale_price is the amount received. No sold date is stored: the
-- date of the known sales is unknown, so a column would be empty.
-- ============================================================

alter table public.items
  add column if not exists is_sold    boolean       not null default false,
  add column if not exists sale_price numeric(10,2) check (sale_price is null or sale_price >= 0);

comment on column public.items.is_sold is
  'True when the item has been sold. Sold items remain visible; shown with a Sold badge instead of For Sale. Mutually exclusive with for_sale.';
comment on column public.items.sale_price is
  'Amount the item sold for. Distinct from price (acquisition cost). Admin-only: never shown publicly and not in item_gallery. No P&L is computed.';

-- Backfill: two items from the group-purchased Mickey Mantle ticket lot.
-- price (acquisition) is intentionally left unchanged (NULL for both).
update public.items set is_sold = true, sale_price = 1950.00, for_sale = false
  where id = 'c2886189-9fc5-4231-949e-4f01294d9dc6';
update public.items set is_sold = true, sale_price = 303.00, for_sale = false
  where id = '6f3e56a3-e570-4a2b-b1d9-23c110a193fb';

-- The live titles of these two items were temporarily prefixed with "Sold — "
-- as a stand-in until this migration could be deployed. Now that the Sold badge
-- exists, strip that prefix to restore the original titles. Idempotent: only
-- touches rows whose title still starts with the prefix.
update public.items set title = substr(title, char_length('Sold — ') + 1)
  where id in (
    'c2886189-9fc5-4231-949e-4f01294d9dc6',
    '6f3e56a3-e570-4a2b-b1d9-23c110a193fb'
  )
  and title like 'Sold — %';

-- A sold item is no longer for sale. Normalise any pre-existing rows, then
-- enforce it. (No-op for current data apart from the two backfilled rows.)
-- sale_price only makes sense when sold.
update public.items set for_sale = false where is_sold and for_sale;
update public.items set sale_price = null where not is_sold and sale_price is not null;

alter table public.items
  drop constraint if exists items_sold_not_for_sale,
  drop constraint if exists items_sale_price_requires_sold;
alter table public.items
  add constraint items_sold_not_for_sale check (not (is_sold and for_sale)),
  add constraint items_sale_price_requires_sold check (is_sold or sale_price is null);

-- Rebuild item_gallery (same as 0035 plus is_sold; sale_price deliberately omitted) ----------------

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
    i.is_sold,
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
  'Denormalised gallery view — now includes ticket_sheet game contexts via junction table, plus is_sold (sale_price intentionally excluded — admin only).';
