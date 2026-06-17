-- ============================================================
-- 0017_teams.sql
-- Teams table + item_teams junction, seed Yankees,
-- update item_gallery view to include team_slugs
-- ============================================================

create table public.teams (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

create table public.item_teams (
  item_id uuid not null references public.items(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  primary key (item_id, team_id)
);

insert into public.teams (name, slug) values ('New York Yankees', 'yankees');

alter table public.teams    enable row level security;
alter table public.item_teams enable row level security;

create policy "Public read teams"      on public.teams      for select using (true);
create policy "Public read item_teams" on public.item_teams for select using (true);

-- Recreate item_gallery with team_slugs aggregated
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
    i.id, i.item_type, img.cloudinary_url, s.name, st.name,
    c.cert_service, c.cert_id, c.item_grade, c.auto_grade;

comment on view public.item_gallery is 'Denormalised view for the public gallery — one row per item with tag_slugs and team_slugs aggregated.';
