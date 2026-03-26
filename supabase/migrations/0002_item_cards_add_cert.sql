-- ============================================================
-- Add certification fields to item_cards view
-- Uses a lateral subquery to grab the primary grade cert per
-- item (PSA/BGS/SGC preferred, then any cert with a grade).
-- ============================================================

create or replace view public.item_cards as
  select
    i.id,
    i.title,
    i.description,
    i.reference_link,
    i.price,
    i.acquisition_type,
    i.is_autographed,
    i.is_world_series_game,
    i.ws_game_number,
    i.is_clinch_game,
    i.clinch_number,
    i.game_date,
    i.purchase_date,
    i.for_sale,
    i.is_part_of_set,
    i.set_id,
    i.notes,
    i.created_at,

    -- Primary image
    img.cloudinary_url as primary_image_url,

    -- Featured signer (for card display)
    s.name as featured_signer,

    -- All tags as array
    coalesce(
      array_agg(distinct t.slug) filter (where t.slug is not null),
      '{}'
    ) as tag_slugs,

    -- Set name
    st.name as set_name,

    -- Primary certification (grade cert preferred over autograph cert)
    c.cert_service,
    c.cert_id,
    c.item_grade  as cert_grade,
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
    i.id, img.cloudinary_url, s.name, st.name,
    c.cert_service, c.cert_id, c.item_grade, c.auto_grade;

comment on view public.item_cards is 'Denormalised view for the public gallery — one row per item with all display data including primary cert';
