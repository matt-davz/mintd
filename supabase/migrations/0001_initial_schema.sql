-- ============================================================
-- Baseball Memorabilia Collection — Database Migration
-- 0001_initial_schema.sql
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- SETS
-- Must exist before items (FK dependency)
-- ============================================================
create table public.sets (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

comment on table public.sets is 'Named groupings of related items e.g. Mickey Mantle WS Home Runs';

-- ============================================================
-- ITEMS
-- Core table — everything hangs off this
-- ============================================================
create table public.items (
  id                  uuid primary key default uuid_generate_v4(),

  -- Display
  title               text not null,
  description         text,
  reference_link      text,

  -- Financials
  price               numeric(12, 2),
  acquisition_type    text not null default 'purchased'
                        check (acquisition_type in ('purchased', 'gifted', 'inherited', 'consignment', 'unknown')),
  item_total          numeric(12, 2),
  auto_total          numeric(12, 2),

  -- Autograph
  is_autographed      boolean not null default false,

  -- Game context
  is_world_series_game  boolean not null default false,
  ws_game_number        integer,
  is_clinch_game        boolean not null default false,
  clinch_number         integer,
  game_date             date,

  -- Ownership
  purchase_date       date,
  location            text,

  -- Visibility & sale
  is_baseball         boolean not null default true,
  for_sale            boolean not null default false,
  is_visible          boolean not null default true,

  -- Set membership
  is_part_of_set      boolean not null default false,
  set_id              uuid references public.sets(id) on delete set null,

  -- Meta
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.items is 'Core memorabilia items in the collection';
comment on column public.items.is_visible is 'Draft flag — false hides from public site';
comment on column public.items.is_baseball is 'False for non-baseball items (hidden from public site)';
comment on column public.items.acquisition_type is 'How the item was acquired — purchased, gifted, inherited, etc.';

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- ============================================================
-- SIGNATORIES
-- One row per signer per item (supports multi-signed items)
-- ============================================================
create table public.signatories (
  id            uuid primary key default uuid_generate_v4(),
  item_id       uuid not null references public.items(id) on delete cascade,
  name          text not null,
  is_featured   boolean not null default false,
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

comment on table public.signatories is 'Individual signers on an item — one row per person';
comment on column public.signatories.is_featured is 'Featured signer shown prominently on public gallery card';

create index idx_signatories_item_id on public.signatories(item_id);

-- ============================================================
-- CERTIFICATIONS
-- Handles PSA, PSA/DNA, BGS, JSA, SGC, Steiner, CGC, etc.
-- One item can have multiple certs (e.g. Griffey bat)
-- ============================================================
create table public.certifications (
  id                uuid primary key default uuid_generate_v4(),
  item_id           uuid not null references public.items(id) on delete cascade,

  cert_service      text not null,   -- 'PSA', 'PSA/DNA', 'BGS', 'JSA', 'SGC', 'Steiner', 'CGC', 'MLB Auth', 'Beckett', 'JSA', 'K&D'
  cert_id           text,            -- The actual cert number
  cert_link         text,            -- URL to verify

  item_grade        text,            -- Card/item grade e.g. 'NM-MT 8', 'VG 3 (MK)', 'Authentic'
  auto_grade        text,            -- Autograph grade e.g. 'GEM MT 10', 'MINT 9' (null if not an auto cert)
  is_autograph_cert boolean not null default false,  -- true = PSA/DNA, JSA etc. | false = card grade

  created_at        timestamptz not null default now()
);

comment on table public.certifications is 'Authentication and grading certificates — one row per cert per item';
comment on column public.certifications.is_autograph_cert is 'True for autograph auth services (PSA/DNA, JSA, Beckett), false for card graders (PSA, BGS, SGC)';

create index idx_certifications_item_id on public.certifications(item_id);
create index idx_certifications_cert_id  on public.certifications(cert_id);

-- ============================================================
-- POPULATION SNAPSHOTS
-- Time-series — hangs off certifications, not items
-- New row per refresh, never overwrite
-- ============================================================
create table public.population_snapshots (
  id             uuid primary key default uuid_generate_v4(),
  cert_id        uuid not null references public.certifications(id) on delete cascade,

  snapshot_type  text not null check (snapshot_type in ('psa_grade', 'psa_dna')),
  total          integer not null default 0,
  higher         integer not null default 0,
  same           integer not null default 0,
  lower          integer not null default 0,

  recorded_at    timestamptz not null default now()
);

comment on table public.population_snapshots is 'PSA population report snapshots — append-only time series';
comment on column public.population_snapshots.snapshot_type is 'psa_grade = card grade pop | psa_dna = autograph auth pop';

create index idx_pop_snapshots_cert_id     on public.population_snapshots(cert_id);
create index idx_pop_snapshots_recorded_at on public.population_snapshots(recorded_at desc);

-- ============================================================
-- TAGS
-- Flexible categorisation system
-- ============================================================
create table public.tags (
  id       uuid primary key default uuid_generate_v4(),
  name     text not null,
  slug     text not null unique,
  category text not null check (category in ('item_type', 'attribute', 'era', 'sport'))
);

comment on table public.tags is 'Filterable tags — drives public gallery filters';
comment on column public.tags.category is 'item_type | attribute | era | sport';

-- Seed tags from the real collection data
insert into public.tags (name, slug, category) values
  -- Item types
  ('Ticket stub',   'ticket-stub',   'item_type'),
  ('Full ticket',   'full-ticket',   'item_type'),
  ('Card',          'card',          'item_type'),
  ('Baseball',      'baseball',      'item_type'),
  ('Bat',           'bat',           'item_type'),
  ('Jersey',        'jersey',        'item_type'),
  ('Photo',         'photo',         'item_type'),
  ('Magazine',      'magazine',      'item_type'),
  ('Program',       'program',       'item_type'),
  ('Book',          'book',          'item_type'),
  ('Base',          'base',          'item_type'),
  ('Glove',         'glove',         'item_type'),
  -- Attributes
  ('Autographed',   'autographed',   'attribute'),
  ('Game used',     'game-used',     'attribute'),
  ('World Series',  'world-series',  'attribute'),
  ('Clinch game',   'clinch-game',   'attribute'),
  ('Rookie card',   'rookie-card',   'attribute'),
  ('Team signed',   'team-signed',   'attribute'),
  ('Proof card',    'proof-card',    'attribute'),
  -- Eras
  ('Pre-1920',      'pre-1920',      'era'),
  ('1920s',         '1920s',         'era'),
  ('1930s',         '1930s',         'era'),
  ('1940s',         '1940s',         'era'),
  ('1950s',         '1950s',         'era'),
  ('1960s',         '1960s',         'era'),
  ('Modern',        'modern',        'era');

-- ============================================================
-- ITEM_TAGS junction
-- ============================================================
create table public.item_tags (
  item_id  uuid not null references public.items(id) on delete cascade,
  tag_id   uuid not null references public.tags(id) on delete cascade,
  primary key (item_id, tag_id)
);

create index idx_item_tags_tag_id  on public.item_tags(tag_id);
create index idx_item_tags_item_id on public.item_tags(item_id);

-- ============================================================
-- IMAGES
-- Cloudinary references only — no binary data in the DB
-- ============================================================
create table public.images (
  id                    uuid primary key default uuid_generate_v4(),
  item_id               uuid not null references public.items(id) on delete cascade,
  cloudinary_public_id  text not null unique,
  cloudinary_url        text not null,
  is_primary            boolean not null default false,
  display_order         integer not null default 0,
  created_at            timestamptz not null default now()
);

comment on table public.images is 'Cloudinary image references — one primary image plus optional gallery images';

create index idx_images_item_id on public.images(item_id);

-- Enforce only one primary image per item
create unique index idx_images_one_primary
  on public.images(item_id)
  where is_primary = true;

-- ============================================================
-- INQUIRIES
-- Stored in DB AND triggers email via Edge Function
-- ============================================================
create table public.inquiries (
  id        uuid primary key default uuid_generate_v4(),
  item_id   uuid references public.items(id) on delete set null,

  name      text not null,
  email     text not null,
  phone     text,
  message   text not null,

  status    text not null default 'new'
              check (status in ('new', 'read', 'replied', 'closed')),

  created_at timestamptz not null default now()
);

comment on table public.inquiries is 'Visitor inquiries — stored here and emailed to client via Edge Function';
comment on column public.inquiries.item_id is 'Nullable — inquiry may be general rather than about a specific item';

create index idx_inquiries_item_id   on public.inquiries(item_id);
create index idx_inquiries_status    on public.inquiries(status);
create index idx_inquiries_created   on public.inquiries(created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- Public: read-only on visible baseball items
-- Admin: full access via service role key
-- ============================================================

alter table public.items               enable row level security;
alter table public.signatories         enable row level security;
alter table public.certifications      enable row level security;
alter table public.population_snapshots enable row level security;
alter table public.tags                enable row level security;
alter table public.item_tags           enable row level security;
alter table public.images              enable row level security;
alter table public.sets                enable row level security;
alter table public.inquiries           enable row level security;

-- Public can read visible baseball items only
create policy "public_read_items" on public.items
  for select using (is_visible = true and is_baseball = true);

-- Public can read related data for visible items
create policy "public_read_signatories" on public.signatories
  for select using (
    exists (
      select 1 from public.items
      where items.id = signatories.item_id
      and items.is_visible = true and items.is_baseball = true
    )
  );

create policy "public_read_certifications" on public.certifications
  for select using (
    exists (
      select 1 from public.items
      where items.id = certifications.item_id
      and items.is_visible = true and items.is_baseball = true
    )
  );

create policy "public_read_pop_snapshots" on public.population_snapshots
  for select using (
    exists (
      select 1 from public.certifications c
      join public.items i on i.id = c.item_id
      where c.id = population_snapshots.cert_id
      and i.is_visible = true and i.is_baseball = true
    )
  );

create policy "public_read_tags"      on public.tags      for select using (true);
create policy "public_read_item_tags" on public.item_tags for select using (true);
create policy "public_read_images"    on public.images    for select using (true);
create policy "public_read_sets"      on public.sets      for select using (true);

-- Public can INSERT inquiries (submit the form)
create policy "public_insert_inquiries" on public.inquiries
  for insert with check (true);

-- Public cannot read inquiries (privacy)
create policy "no_public_read_inquiries" on public.inquiries
  for select using (false);

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Latest population snapshot per cert (avoids client-side filtering)
create or replace view public.latest_population as
  select distinct on (cert_id)
    cert_id,
    snapshot_type,
    total,
    higher,
    same,
    lower,
    recorded_at
  from public.population_snapshots
  order by cert_id, recorded_at desc;

comment on view public.latest_population is 'Most recent population snapshot per cert — use this in queries, not the raw table';

-- Full item card view (joins all related data for the gallery)
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
    st.name as set_name

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
  where i.is_visible = true and i.is_baseball = true
  group by i.id, img.cloudinary_url, s.name, st.name;

comment on view public.item_cards is 'Denormalised view for the public gallery — one row per item with all display data';
