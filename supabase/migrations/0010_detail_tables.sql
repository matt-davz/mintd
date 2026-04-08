-- ============================================================
-- 0010_detail_tables.sql
-- Item-type-specific detail tables
-- Each has:
--   item_id  — FK to items (ON DELETE CASCADE)
--   unique index on item_id — one detail row per item
--   updated_at trigger using existing set_updated_at()
-- Tables with game context get game_context_id FK
-- ============================================================

-- ── Tickets ───────────────────────────────────────────────────────────────────

create table public.item_tickets (
  id               uuid primary key default gen_random_uuid(),
  item_id          uuid not null references public.items(id) on delete cascade,
  is_full_ticket   boolean not null default false,
  section          text,
  row              text,
  seat             text,
  face_value       numeric(10, 2),
  game_result      public.ticket_game_result_enum,
  printer          text,
  game_context_id  uuid references public.game_context(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.item_tickets is 'Ticket and stub-specific detail data';
create unique index idx_item_tickets_item_id on public.item_tickets(item_id);
create trigger item_tickets_updated_at
  before update on public.item_tickets
  for each row execute function public.set_updated_at();

-- ── Cards ─────────────────────────────────────────────────────────────────────

create table public.item_cards (
  id                  uuid primary key default gen_random_uuid(),
  item_id             uuid not null references public.items(id) on delete cascade,
  card_set_name       text,
  card_number         text,
  manufacturer        text,
  year_issued         integer,
  parallel_variation  text,
  is_rookie_card      boolean not null default false,
  serial_number       integer,
  print_run           integer,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.item_cards is 'Trading card-specific detail data';
create unique index idx_item_cards_item_id on public.item_cards(item_id);
create trigger item_cards_updated_at
  before update on public.item_cards
  for each row execute function public.set_updated_at();

-- ── Baseballs ─────────────────────────────────────────────────────────────────

create table public.item_baseballs (
  id               uuid primary key default gen_random_uuid(),
  item_id          uuid not null references public.items(id) on delete cascade,
  is_game_used     boolean not null default false,
  game_used_type   public.game_used_type_enum,
  manufacturer     text,
  league_stamp     text,
  is_team_signed   boolean not null default false,
  inscription      text,
  game_context_id  uuid references public.game_context(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.item_baseballs is 'Baseball-specific detail data';
create unique index idx_item_baseballs_item_id on public.item_baseballs(item_id);
create trigger item_baseballs_updated_at
  before update on public.item_baseballs
  for each row execute function public.set_updated_at();

-- ── Bats ──────────────────────────────────────────────────────────────────────

create table public.item_bats (
  id               uuid primary key default gen_random_uuid(),
  item_id          uuid not null references public.items(id) on delete cascade,
  manufacturer     text,
  model_number     text,
  length_inches    numeric(4, 1),
  weight_oz        numeric(4, 1),
  is_game_used     boolean not null default false,
  year_used        integer,
  is_cracked       boolean not null default false,
  has_pine_tar     boolean not null default false,
  inscription      text,
  game_context_id  uuid references public.game_context(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.item_bats is 'Bat-specific detail data';
create unique index idx_item_bats_item_id on public.item_bats(item_id);
create trigger item_bats_updated_at
  before update on public.item_bats
  for each row execute function public.set_updated_at();

-- ── Jerseys ───────────────────────────────────────────────────────────────────

create table public.item_jerseys (
  id                  uuid primary key default gen_random_uuid(),
  item_id             uuid not null references public.items(id) on delete cascade,
  player_number       text,
  team                text,
  year_worn           integer,
  is_game_worn        boolean not null default false,
  size                text,
  manufacturer        text,
  jersey_type         public.jersey_type_enum,
  has_special_patch   boolean not null default false,
  patch_description   text,
  game_context_id     uuid references public.game_context(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.item_jerseys is 'Jersey-specific detail data';
create unique index idx_item_jerseys_item_id on public.item_jerseys(item_id);
create trigger item_jerseys_updated_at
  before update on public.item_jerseys
  for each row execute function public.set_updated_at();

-- ── Photos ────────────────────────────────────────────────────────────────────

create table public.item_photos (
  id              uuid primary key default gen_random_uuid(),
  item_id         uuid not null references public.items(id) on delete cascade,
  photo_type      public.photo_type_enum,
  photo_size      text,
  photo_format    public.photo_format_enum,
  photo_era       public.photo_era_enum,
  photographer    text,
  agency_source   text,
  event_subject   text,
  photo_date      date,
  game_context_id uuid references public.game_context(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.item_photos is 'Photo-specific detail data';
create unique index idx_item_photos_item_id on public.item_photos(item_id);
create trigger item_photos_updated_at
  before update on public.item_photos
  for each row execute function public.set_updated_at();

-- ── Magazines ─────────────────────────────────────────────────────────────────

create table public.item_magazines (
  id               uuid primary key default gen_random_uuid(),
  item_id          uuid not null references public.items(id) on delete cascade,
  publication_name text,
  issue_date       date,
  volume           text,
  issue_number     text,
  publisher        text,
  cover_subject    text,
  is_cover_signed  boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.item_magazines is 'Magazine-specific detail data';
create unique index idx_item_magazines_item_id on public.item_magazines(item_id);
create trigger item_magazines_updated_at
  before update on public.item_magazines
  for each row execute function public.set_updated_at();

-- ── Programs ──────────────────────────────────────────────────────────────────

create table public.item_programs (
  id               uuid primary key default gen_random_uuid(),
  item_id          uuid not null references public.items(id) on delete cascade,
  game_type        public.game_type_enum,
  publisher        text,
  game_context_id  uuid references public.game_context(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.item_programs is 'Program-specific detail data';
create unique index idx_item_programs_item_id on public.item_programs(item_id);
create trigger item_programs_updated_at
  before update on public.item_programs
  for each row execute function public.set_updated_at();

-- ── Books ─────────────────────────────────────────────────────────────────────

create table public.item_books (
  id                  uuid primary key default gen_random_uuid(),
  item_id             uuid not null references public.items(id) on delete cascade,
  author              text,
  publisher           text,
  year_published      integer,
  edition             text,
  isbn                text,
  is_first_edition    boolean not null default false,
  is_signed_by_author boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.item_books is 'Book-specific detail data';
create unique index idx_item_books_item_id on public.item_books(item_id);
create trigger item_books_updated_at
  before update on public.item_books
  for each row execute function public.set_updated_at();

-- ── Bases ─────────────────────────────────────────────────────────────────────

create table public.item_bases (
  id                      uuid primary key default gen_random_uuid(),
  item_id                 uuid not null references public.items(id) on delete cascade,
  base_position           public.base_position_enum,
  is_game_used            boolean not null default false,
  manufacturer            text,
  has_mlb_authentication  boolean not null default false,
  game_context_id         uuid references public.game_context(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table public.item_bases is 'Base-specific detail data';
create unique index idx_item_bases_item_id on public.item_bases(item_id);
create trigger item_bases_updated_at
  before update on public.item_bases
  for each row execute function public.set_updated_at();

-- ── Gloves ────────────────────────────────────────────────────────────────────

create table public.item_gloves (
  id               uuid primary key default gen_random_uuid(),
  item_id          uuid not null references public.items(id) on delete cascade,
  manufacturer     text,
  model            text,
  player_position  public.player_position_enum,
  handedness       public.handedness_enum,
  year_used        integer,
  is_game_used     boolean not null default false,
  game_context_id  uuid references public.game_context(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.item_gloves is 'Glove-specific detail data';
create unique index idx_item_gloves_item_id on public.item_gloves(item_id);
create trigger item_gloves_updated_at
  before update on public.item_gloves
  for each row execute function public.set_updated_at();
