-- ============================================================
-- 0013_fix_gallery_duplicate_signers.sql
-- Fix: items with multiple featured signatories produced
-- duplicate rows in item_gallery. Switch the signatories join
-- from a plain LEFT JOIN to a LATERAL subquery (LIMIT 1) and
-- add signatory_count so the frontend can show "+ N others".
-- ============================================================

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
    i.purchase_date,
    i.for_sale,
    i.is_part_of_set,
    i.set_id,
    i.notes,
    i.created_at,

    -- Primary image
    img.cloudinary_url as primary_image_url,

    -- Featured signer (single row, no duplicates)
    s.name as featured_signer,

    -- Total signatory count for "+ N others" display
    coalesce(sig_count.cnt, 0) as signatory_count,

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
    i.id, i.item_type, img.cloudinary_url, s.name, sig_count.cnt, st.name,
    c.cert_service, c.cert_id, c.item_grade, c.auto_grade;
