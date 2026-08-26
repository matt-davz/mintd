# Database Schema

Derived from `supabase/migrations/`. Source of truth is the migration files.

---

## Extensions

| Extension | Purpose |
|---|---|
| `uuid-ossp` | `uuid_generate_v4()` for primary keys (original tables) |

*New tables (0005+) use `gen_random_uuid()` — no extension required.*

---

## Enums

Defined in `0004_enums.sql`.

| Enum | Values |
|---|---|
| `item_type_enum` | `ticket`, `ticket_sheet`, `card`, `baseball`, `bat`, `jersey`, `photo`, `magazine`, `program`, `book`, `base`, `glove`, `miscellaneous`, `stadium_giveaway` |
| `game_type_enum` | `regular_season`, `alds`, `alcs`, `nlds`, `nlcs`, `world_series`, `all_star`, `spring_training`, `exhibition` |
| `game_result_enum` | `home_win`, `home_loss`, `tie`, `unknown` |
| `ticket_game_result_enum` | `win`, `loss`, `tie`, `unknown` — *unused, column dropped in 0015* |
| `game_used_type_enum` | `game`, `batting_practice`, `home_run`, `ceremonial_first_pitch` |
| `jersey_type_enum` | `home`, `away`, `alternate`, `spring_training`, `all_star`, `throwback` |
| `photo_type_enum` | `type_1`, `type_2`, `type_3` |
| `photo_format_enum` | `original_print`, `wire_photo`, `news_service`, `cabinet_card`, `cdv`, `reprint` |
| `photo_era_enum` | `sepia`, `black_and_white`, `color` |
| `base_position_enum` | `first`, `second`, `third`, `home` |
| `player_position_enum` | `pitcher`, `catcher`, `first_base`, `second_base`, `third_base`, `shortstop`, `outfield` |
| `handedness_enum` | `left_hand_throw`, `right_hand_throw` |

---

## Tables

### `sets`

Named groupings of related items (e.g. "Mickey Mantle WS Home Runs").

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, default `uuid_generate_v4()` |
| `name` | `text` | NOT NULL |
| `description` | `text` | |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

---

### `items`

Core table — everything hangs off this.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `uuid_generate_v4()` | |
| `title` | `text` | NOT NULL | |
| `description` | `text` | | |
| `reference_link` | `text` | | |
| `price` | `numeric(12,2)` | | Acquisition cost |
| `acquisition_type` | `text` | NOT NULL, default `'purchased'`, CHECK in (`purchased`, `gifted`, `inherited`, `consignment`, `unknown`) | |
| `item_total` | `numeric(12,2)` | | |
| `auto_total` | `numeric(12,2)` | | |
| `is_autographed` | `boolean` | NOT NULL, default `false` | |
| `item_type` | `item_type_enum` | nullable | Drives which detail table is populated |
| `purchase_date` | `date` | | |
| `is_baseball` | `boolean` | NOT NULL, default `true` | `false` hides from public site |
| `for_sale` | `boolean` | NOT NULL, default `false` | |
| `is_visible` | `boolean` | NOT NULL, default `true` | Draft flag — `false` hides from public |
| `is_part_of_set` | `boolean` | NOT NULL, default `false` | |
| `set_id` | `uuid` | FK → `sets(id)` ON DELETE SET NULL | |
| `notes` | `text` | | |
| `is_duplicate` | `boolean` | NOT NULL, default `false` | |
| `is_legendary` | `boolean` | NOT NULL, default `false` | Marks item for special "legendary" display treatment on the Timeline |
| `museum_title` | `text` | nullable | Short tidbit-style title shown on the Museum/Timeline page. Falls back to `title` when NULL. Full title still shown on item detail page. Convention: `[tidbit] — Ticket Stub / Full Ticket / Program` (non-auto) or `[tidbit] — [type] — Signed by [Name(s)]` (auto). |
| `season_year` | `integer` | nullable | Year of the game/event or card issue year. Backfilled from `game_context.season_year` for game-context items; from `item_cards.year_issued` for cards. Auto-synced from game context on save via `ItemViewerModal`. |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Auto-updated via trigger |

**Triggers:** `items_updated_at` — `BEFORE UPDATE` → `set_updated_at()`

**Indexes:** `idx_items_item_type` on `(item_type)`

> Game context fields (`game_date`, `location`, `is_world_series_game`, `ws_game_number`, `is_clinch_game`, `clinch_number`) were migrated to the `game_context` table in migration `0009`.

---

### `game_context`

Shared structured game metadata. Linked from item detail tables via `game_context_id` FK.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `game_date` | `date` | | |
| `home_team` | `text` | | |
| `away_team` | `text` | | |
| `venue` | `text` | | |
| `city` | `text` | | |
| `season_year` | `integer` | | |
| `game_type` | `game_type_enum` | | |
| `series_game_number` | `integer` | | |
| `game_result` | `game_result_enum` | | From home team perspective |
| `home_score` | `integer` | | |
| `away_score` | `integer` | | |
| `notes` | `text` | | |
| `box_score` | `jsonb` | CHECK `box_score_shape` | Inning-by-inning line score + R/H/E totals. Shape: `{ innings: [{inning, away, home}], home: {r, h, e}, away: {r, h, e} }` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Auto-updated via trigger |

**Indexes:** `idx_game_context_game_date` on `(game_date)`

---

### `signatories`

One row per signer per item. Supports multi-signed items.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `uuid_generate_v4()` | |
| `item_id` | `uuid` | NOT NULL, FK → `items(id)` ON DELETE CASCADE | |
| `name` | `text` | NOT NULL | |
| `is_featured` | `boolean` | NOT NULL, default `false` | Shown prominently on public gallery card |
| `display_order` | `integer` | NOT NULL, default `0` | |
| `signature_location` | `text` | | e.g. sweet spot, barrel, panel |
| `ink_color` | `text` | | e.g. blue, black, silver, gold |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**Indexes:** `idx_signatories_item_id` on `(item_id)`

---

### `certifications`

Authentication and grading certificates. One item can have multiple certs.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `uuid_generate_v4()` | |
| `item_id` | `uuid` | NOT NULL, FK → `items(id)` ON DELETE CASCADE | |
| `cert_service` | `text` | NOT NULL | `PSA`, `PSA/DNA`, `BGS`, `JSA`, `SGC`, `Steiner`, `CGC`, `MLB Auth`, `Beckett`, `K&D` |
| `cert_id` | `text` | | The cert number |
| `cert_link` | `text` | | Verification URL |
| `item_grade` | `text` | | The cert/item grade, e.g. `NM-MT 8`, `AA` (Authentic Altered), `Authentic` |
| `auto_grade` | `text` | | Autograph/signature grade, e.g. `NM-MT 8`, `GEM MT 10` — null if not autograph cert. When both `item_grade` and `auto_grade` are present, display as `[item_grade] / Auto [auto_grade]` |
| `is_autograph_cert` | `boolean` | NOT NULL, default `false` | |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**Indexes:** `idx_certifications_item_id`, `idx_certifications_cert_id`

---

### `population_snapshots`

PSA population report snapshots. Append-only — never overwrite.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `cert_id` | `uuid` | NOT NULL, FK → `certifications(id)` ON DELETE CASCADE | |
| `snapshot_type` | `text` | NOT NULL, CHECK in (`psa_grade`, `psa_dna`) | |
| `total` | `integer` | NOT NULL, default `0` | |
| `higher` | `integer` | NOT NULL, default `0` | |
| `same` | `integer` | NOT NULL, default `0` | |
| `lower` | `integer` | NOT NULL, default `0` | |
| `recorded_at` | `timestamptz` | NOT NULL, default `now()` | |

---

### `psa_price_snapshots`

PSA price estimate + recent sales per cert. Append-only — never overwrite. Sourced from parse.bot (third-party PSA wrapper).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `cert_id` | `uuid` | NOT NULL, FK → `certifications(id)` ON DELETE CASCADE | |
| `psa_estimate` | `text` | | PSA's own value estimate (e.g. `$59.00`), or `—` if unavailable |
| `recent_sales` | `jsonb` | | Array of `{ date_sold, price (float), title, venue, url }` |
| `synced_at` | `timestamptz` | NOT NULL, default `now()` | |

---

### `tags` + `item_tags`

Flexible many-to-many tag system.

**Seeded values:**

| Category | Slugs |
|---|---|
| `item_type` | `ticket-stub`, `full-ticket`, `card`, `baseball`, `bat`, `jersey`, `photo`, `magazine`, `program`, `book`, `base`, `glove` |
| `attribute` | `autographed`, `game-used`, `world-series`, `clinch-game`, `rookie-card`, `team-signed`, `proof-card` |
| `era` | `pre-1920`, `1920s`, `1930s`, `1940s`, `1950s`, `1960s`, `modern` |

---

### `teams`

MLB teams. One row per franchise/era variant. Used to tag items via `item_teams`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `name` | `text` | NOT NULL | e.g. `New York Yankees` |
| `slug` | `text` | NOT NULL, UNIQUE | e.g. `yankees` |
| `abbreviation` | `text` | UNIQUE | MLB abbreviation e.g. `NYY` — used to match `game_context.home_team` / `away_team` |

**Seeded:** 31 franchises covering all teams found in the collection's game context data (current + historical variants). Yankees is pinned first in all filter UIs.

---

### `item_teams`

Many-to-many junction between items and teams.

| Column | Type | Constraints |
|---|---|---|
| `item_id` | `uuid` | NOT NULL, FK → `items(id)` ON DELETE CASCADE |
| `team_id` | `uuid` | NOT NULL, FK → `teams(id)` ON DELETE CASCADE |

**PK:** `(item_id, team_id)`

**Auto-populated:** `ItemViewerModal.handleSave` calls `syncItemTeams` after writing `game_context` — matches `home_team` / `away_team` abbreviations against `teams.abbreviation`, then replaces all `item_teams` rows for that item. Backfilled from existing game context data via migration `0019`.

---

### `item_duplicates`

Join table linking duplicate items together. Stored one-direction only (`item_id` → `duplicate_of_id`, not both directions) — queries must check both columns to find an item's duplicates.

| Column | Type | Constraints |
|---|---|---|
| `item_id` | `uuid` | NOT NULL, FK → `items(id)` ON DELETE CASCADE |
| `duplicate_of_id` | `uuid` | NOT NULL, FK → `items(id)` ON DELETE CASCADE |
| `notes` | `text` | nullable |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

**PK:** `(item_id, duplicate_of_id)`

**CHECK:** `item_id != duplicate_of_id`

**Managed by:** `DuplicatesSection` (admin, in `ItemViewerModal`) — inserts always store the lexicographically smaller UUID as `item_id`. Adding/removing a link auto-syncs `items.is_duplicate` on both linked items (`true` if the item has any remaining link, `false` otherwise).

---

### `item_order`

Gallery display order for curated items. One row per pinned item. Items absent from this table appear after all pinned items in default `created_at DESC` order.

| Column | Type | Constraints |
|---|---|---|
| `item_id` | `uuid` | PK, FK → `items(id)` ON DELETE CASCADE |
| `display_order` | `integer` | NOT NULL |

**Managed via:** `/admin/gallery-order` drag-and-drop page. Save replaces all rows in bulk. Cascade delete ensures no orphan rows when items are deleted.

---

### `images`

Cloudinary image references. No binary data in DB.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `item_id` | `uuid` | NOT NULL, FK → `items(id)` ON DELETE CASCADE | |
| `cloudinary_public_id` | `text` | NOT NULL, UNIQUE | Pattern: `import/{first8charsOfItemId}/image_{n}` |
| `cloudinary_url` | `text` | NOT NULL | |
| `is_primary` | `boolean` | NOT NULL, default `false` | |
| `display_order` | `integer` | NOT NULL, default `0` | |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**Indexes:** Unique partial on `(item_id) WHERE is_primary = true` — enforces exactly one primary per item.

---

### `legendary_context`

Event narrative and context for items marked `is_legendary`. One row per legendary item (1:1 with `items`).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `item_id` | `uuid` | NOT NULL, UNIQUE, FK → `items(id)` ON DELETE CASCADE | |
| `event_title` | `text` | nullable | Short headline shown on Timeline legendary card |
| `event_description` | `text` | nullable | Full historical narrative |

| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Auto-updated via trigger |

---

### `legendary_images`

Historical/contextual images for a legendary item. Separate from product shots in `images`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `legendary_context_id` | `uuid` | NOT NULL, FK → `legendary_context(id)` ON DELETE CASCADE | |
| `cloudinary_public_id` | `text` | NOT NULL, UNIQUE | Pattern: `legendary/{first8charsOfItemId}/image_{n}` |
| `cloudinary_url` | `text` | NOT NULL | |
| `caption` | `text` | nullable | |
| `display_order` | `integer` | NOT NULL, default `0` | |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

---

### `item_loas`

Letters of Authenticity per item. Multiple LOAs allowed per item (e.g. JSA + PSA/DNA). Images and PDFs are both stored with `resource_type = 'image'` in Cloudinary so transformations work on both.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `item_id` | `uuid` | NOT NULL, FK → `items(id)` ON DELETE CASCADE | |
| `cloudinary_url` | `text` | NOT NULL | |
| `cloudinary_public_id` | `text` | NOT NULL | Pattern: `mintd/loas/{first8charsOfItemId}/{filename}` |
| `label` | `text` | nullable | Free text — e.g. `'JSA'`, `'PSA/DNA'`, `'Steiner'` |
| `resource_type` | `text` | NOT NULL, default `'image'`, CHECK in (`image`, `pdf`) | Drives how the frontend renders the asset |
| `display_order` | `integer` | NOT NULL, default `0` | |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

---

### `inquiries`

Visitor contact form submissions.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `item_id` | `uuid` | FK → `items(id)` ON DELETE SET NULL, nullable |
| `name` | `text` | NOT NULL |
| `email` | `text` | NOT NULL |
| `phone` | `text` | |
| `message` | `text` | NOT NULL |
| `status` | `text` | NOT NULL, default `'new'`, CHECK in (`new`, `read`, `replied`, `closed`) |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

---

## Item Detail Tables

Each detail table has:
- `id uuid` PK, `item_id uuid NOT NULL` FK → `items(id)` ON DELETE CASCADE
- `created_at`, `updated_at` timestamps with trigger
- Unique index on `item_id` — one detail row per item

Tables with `game_context_id uuid` FK → `game_context(id)` ON DELETE SET NULL: `item_tickets`, `item_baseballs`, `item_bats`, `item_jerseys`, `item_photos`, `item_programs`, `item_bases`, `item_gloves`, `item_stadium_giveaways`.

`item_miscellaneous` has no `game_context_id` — miscellaneous items don't have game context.

`item_ticket_sheets` has no `game_context_id` — ticket sheets link to **multiple** game contexts via the `ticket_sheet_games` junction table instead of a single FK.

### `item_tickets`
| Column | Type |
|---|---|
| `is_full_ticket` | `boolean NOT NULL default false` |
| `section`, `row`, `seat`, `printer` | `text` |
| `face_value` | `numeric(10,2)` |
| `game_context_id` | `uuid` |

### `item_cards`
| Column | Type |
|---|---|
| `card_set_name`, `card_number`, `manufacturer`, `parallel_variation` | `text` |
| `year_issued`, `serial_number`, `print_run` | `integer` |
| `is_rookie_card` | `boolean NOT NULL default false` |

### `item_baseballs`
| Column | Type |
|---|---|
| `is_game_used` | `boolean NOT NULL default false` |
| `game_used_type` | `game_used_type_enum` |
| `manufacturer`, `league_stamp`, `inscription` | `text` |
| `is_team_signed` | `boolean NOT NULL default false` |
| `game_context_id` | `uuid` |

### `item_bats`
| Column | Type |
|---|---|
| `manufacturer`, `model_number`, `inscription` | `text` |
| `length_inches`, `weight_oz` | `numeric(4,1)` |
| `is_game_used`, `is_cracked`, `has_pine_tar` | `boolean NOT NULL default false` |
| `year_used` | `integer` |
| `game_context_id` | `uuid` |

### `item_jerseys`
| Column | Type |
|---|---|
| `player_number`, `team`, `size`, `manufacturer`, `patch_description` | `text` |
| `year_worn` | `integer` |
| `is_game_worn`, `has_special_patch` | `boolean NOT NULL default false` |
| `jersey_type` | `jersey_type_enum` |
| `game_context_id` | `uuid` |

### `item_photos`
| Column | Type |
|---|---|
| `photo_type` | `photo_type_enum` |
| `photo_format` | `photo_format_enum` |
| `photo_era` | `photo_era_enum` |
| `photo_size`, `photographer`, `agency_source`, `event_subject` | `text` |
| `photo_date` | `date` |
| `game_context_id` | `uuid` |

### `item_magazines`
| Column | Type |
|---|---|
| `publication_name`, `volume`, `issue_number`, `publisher`, `cover_subject` | `text` |
| `issue_date` | `date` |
| `is_cover_signed` | `boolean NOT NULL default false` |

### `item_programs`
| Column | Type |
|---|---|
| `game_type` | `game_type_enum` |
| `publisher` | `text` |
| `game_context_id` | `uuid` |

### `item_books`
| Column | Type |
|---|---|
| `author`, `publisher`, `edition`, `isbn` | `text` |
| `year_published` | `integer` |
| `is_first_edition`, `is_signed_by_author` | `boolean NOT NULL default false` |

### `item_bases`
| Column | Type |
|---|---|
| `base_position` | `base_position_enum` |
| `manufacturer` | `text` |
| `is_game_used`, `has_mlb_authentication` | `boolean NOT NULL default false` |
| `game_context_id` | `uuid` |

### `item_gloves`
| Column | Type |
|---|---|
| `manufacturer`, `model` | `text` |
| `player_position` | `player_position_enum` |
| `handedness` | `handedness_enum` |
| `year_used` | `integer` |
| `is_game_used` | `boolean NOT NULL default false` |
| `game_context_id` | `uuid` |

### `item_miscellaneous`
| Column | Type |
|---|---|
| `category`, `description` | `text` |

*No `game_context_id` — miscellaneous items don't have game context.*

### `item_stadium_giveaways`
| Column | Type |
|---|---|
| `event_name`, `giveaway_item_type`, `manufacturer` | `text` |
| `event_date` | `date` |
| `game_context_id` | `uuid` |

### `item_ticket_sheets`

Detail table for ticket sheet items — an uncut strip of multiple game tickets sold as a single collectible. Unlike other detail tables, this does **not** have a `game_context_id` FK. Instead, games are linked via the `ticket_sheet_games` junction table.

| Column | Type | Notes |
|---|---|---|
| `sheet_size` | `integer NOT NULL` | Number of tickets on the sheet |
| `is_uncut` | `boolean default true` | Whether the sheet is still intact |
| `printer` | `text` | Ticket printer/manufacturer |
| `section`, `row`, `seat` | `text` | Shared seating info (if all tickets same) |
| `face_value` | `numeric` | Face value per ticket |
| `includes_phantom_game` | `boolean default false` | Sheet has a game that was never played |
| `phantom_game_label` | `text` | e.g. "Game 6", "Game X" |

**Unique index** on `item_id` — one detail row per item.

### `ticket_sheet_games`

Junction table linking a ticket sheet to multiple `game_context` records (one per game on the sheet).

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `ticket_sheet_id` | `uuid` | NOT NULL, FK → `item_ticket_sheets(id)` ON DELETE CASCADE |
| `game_context_id` | `uuid` | NOT NULL, FK → `game_context(id)` ON DELETE CASCADE |
| `display_order` | `integer` | default `0` — order on the sheet (left to right) |
| `is_phantom` | `boolean` | default `false` — true if this game was never played |
| `game_label` | `text` | Optional label override, e.g. "Game 3", "Game 6 (never played)" |
| `created_at` | `timestamptz` | default `now()` |

**Unique constraint:** `(ticket_sheet_id, game_context_id)` — prevents linking the same game twice.

**Indexes:** `idx_ticket_sheet_games_sheet`, `idx_ticket_sheet_games_context`

---

## Functions

### `set_updated_at()`
Sets `new.updated_at = now()` on update. Used by all tables with `updated_at`.

---

## Views

### `latest_population`
Most recent population snapshot per cert. **Always query this instead of `population_snapshots` directly.**

### `latest_psa_price`
Most recent price snapshot per cert. **Always query this instead of `psa_price_snapshots` directly.**

### `item_gallery`
Denormalised view for the public gallery. One row per item with primary image, featured signer, tags array, team slugs array, set name, and primary cert (PSA/BGS/SGC preferred via lateral subquery). Featured signer and cert use `LATERAL LIMIT 1` to guarantee exactly one row per item. Filtered to `WHERE is_visible = true AND is_baseball = true`.

**Columns:** `id`, `title`, `museum_title`, `description`, `reference_link`, `price`, `acquisition_type`, `is_autographed`, `is_legendary`, `is_duplicate`, `item_type`, `season_year`, `purchase_date`, `for_sale`, `is_part_of_set`, `set_id`, `notes`, `created_at`, `primary_image_url`, `featured_signer`, `signatory_count integer`, `tag_slugs text[]`, `team_slugs text[]`, `set_name`, `cert_service`, `cert_id`, `cert_grade`, `auto_grade`, `pop_higher integer`, `pop_same integer`, `game_date date`, `series_game_number integer`, `legendary_event_title text`

`pop_higher` and `pop_same` come from `latest_population` joined via the primary cert's UUID (`certifications.id`). Both are `NULL` when no population snapshot exists. The public gallery card shows a **"1/1 FINEST"** amber badge when `pop_higher = 0 AND pop_same = 1` (sole finest-known example at the highest graded level).

**Grade display:** Use `displayGrade()` from `src/utils/gradeColors.js` when rendering `cert_grade` or `auto_grade` in the UI. PSA grade codes are kept as-is (e.g. `AA` stays `AA` — it is Authentic Altered). Only standalone `Authentic`/`Auth`/`AUTH` is shortened to `Auth`. When both `cert_grade` and `auto_grade` are present on an autographed item, display as `[cert_grade] / Auto [auto_grade]` (e.g. `AA / Auto NM-MT 8`). Use `auto_grade` for color-coding when both exist (it’s the numeric grade).

`game_date` and `series_game_number` come from `game_context` via a lateral join across all 9 single-game detail tables (`item_tickets`, `item_baseballs`, `item_bats`, `item_jerseys`, `item_photos`, `item_programs`, `item_bases`, `item_gloves`, `item_stadium_giveaways`) **plus** the `ticket_sheet_games` junction table (for `ticket_sheet` items, picks the earliest non-phantom game by `series_game_number`). Both are `NULL` for items without game context (cards, miscellaneous, non-game items). Used by the Timeline to sort by exact game date rather than `season_year` alone.

> Previously named `item_cards`. Renamed in migration `0011` — `item_cards` is now the trading card detail table.

---

## Row Level Security

All tables have RLS enabled. Security boundary is Clerk route protection — admin uses the anon key from the browser.

| Table | Public (anon) | Admin (anon via Clerk) |
|---|---|---|
| `items` | SELECT where `is_visible AND is_baseball` | SELECT all, INSERT, UPDATE, DELETE |
| `game_context` | SELECT all | INSERT, UPDATE, DELETE |
| `signatories` | SELECT for visible items | SELECT all, INSERT, UPDATE, DELETE |
| `certifications` | SELECT for visible items | SELECT all, INSERT, UPDATE, DELETE |
| `population_snapshots` | SELECT for visible items | SELECT all, INSERT |
| `psa_price_snapshots` | SELECT all | SELECT all, INSERT |
| `tags` | SELECT all | — |
| `item_tags` | SELECT all | INSERT, DELETE |
| `teams` | SELECT all | — |
| `item_teams` | SELECT all | INSERT, DELETE |
| `item_duplicates` | SELECT all | INSERT, UPDATE, DELETE |
| `images` | SELECT all | SELECT all, INSERT, UPDATE, DELETE |
| `sets` | SELECT all | — |
| `inquiries` | INSERT only | — |
| `item_tickets` … `item_gloves`, `item_miscellaneous`, `item_stadium_giveaways` | SELECT for visible items | SELECT all, INSERT, UPDATE, DELETE |
| `item_ticket_sheets` | SELECT all | INSERT, UPDATE, DELETE |
| `ticket_sheet_games` | SELECT all | INSERT, UPDATE, DELETE |

---

## Migrations

| File | Summary |
|---|---|
| `0001_initial_schema.sql` | Full base schema — tables, indexes, RLS, views, seed tags |
| `0002_item_cards_add_cert.sql` | Replaced `item_cards` view to include primary cert via lateral subquery |
| `0003_admin_write_policies.sql` | Admin write RLS policies for anon role |
| `0004_enums.sql` | All 12 item-type enums |
| `0005_game_context.sql` | `game_context` table |
| `0006_item_type_column.sql` | `item_type` column on `items` |
| `0007_signatories_additions.sql` | `signature_location` + `ink_color` on `signatories` |
| `0008_migrate_game_context_data.sql` | Copied game context data from `items` into `game_context` |
| `0009_drop_old_view_and_columns.sql` | Dropped `item_cards` view + 6 stale game columns from `items` |
| `0010_detail_tables.sql` | All 11 `item_*` type-specific detail tables |
| `0011_item_gallery_view.sql` | Gallery view recreated as `item_gallery` |
| `0012_rls_policies.sql` | RLS for `game_context` + all 11 detail tables |
| `0013_fix_gallery_duplicate_signers.sql` | Fix duplicate rows for multi-signer items; lateral subquery for featured signer + `signatory_count` |
| `0014_box_score.sql` | `box_score` JSONB column on `game_context` with CHECK constraint |
| `0015_drop_ticket_game_result.sql` | Drop redundant `game_result` from `item_tickets` (lives in `game_context`) |
| `0016_add_is_duplicate_to_items.sql` | Add `is_duplicate boolean NOT NULL default false` to `items` |
| `0017_teams.sql` | `teams` + `item_teams` tables, seed Yankees, RLS, recreate `item_gallery` with `team_slugs` |
| `0018_teams_abbreviation.sql` | Add `abbreviation` column to `teams`, set `NYY` for Yankees, admin write policies for `item_teams` |
| `0019_backfill_teams.sql` | Seed 31 MLB franchises, backfill `item_teams` from all game context data (281 rows) |
| `0020_item_season_year.sql` | Add `season_year integer` to `items`, backfill from `game_context` + `item_cards.year_issued`, rebuild `item_gallery` view |
| `0021_fix_gallery_duplicate_signers_again.sql` | Restore `LATERAL LIMIT 1` for signatories after `0017`/`0020` reverted the fix |
| `0022_item_order.sql` | Add `item_order` table for gallery curation ordering + RLS |
| `0023_legendary.sql` | Add `is_legendary boolean NOT NULL default false` to `items`; expose in `item_gallery` view |
| `0024_legendary_context.sql` | Add `legendary_context` (1:1 with items) and `legendary_images` tables with RLS |
| `0025_item_gallery_game_date.sql` | Add `game_date date` and `series_game_number integer` to `item_gallery` via lateral join on `game_context` through all 8 detail tables |
| `0026_item_gallery_legendary_event_title.sql` | Add `legendary_event_title text` to `item_gallery` via left join on `legendary_context` |
| `0027_fix_gallery_duplicate_signers.sql` | Restore `LATERAL LIMIT 1` for signatories and `signatory_count` after `0025`/`0026` reverted the fix; preserves `game_date`, `series_game_number`, `is_legendary`, `legendary_event_title` |
| `0028_item_loas.sql` | Add `item_loas` table for Letters of Authenticity; supports images + PDFs, multiple per item, RLS mirrors `images` table |
| `0029_loas_storage_bucket.sql` | Create Supabase Storage bucket for LOA files |
| `0030_item_duplicates.sql` | Add `item_duplicates` join table for linking duplicate items together (one-direction), RLS |
| `0031_item_duplicates_update_policy.sql` | Add UPDATE RLS policy for `item_duplicates` (editing notes) |
| `0032_miscellaneous_stadium_giveaway_types.sql` | Add `miscellaneous` and `stadium_giveaway` values to `item_type_enum`; add `item_miscellaneous` (no game context) and `item_stadium_giveaways` (has `game_context_id`) detail tables with RLS; rebuild `item_gallery` to include `item_stadium_giveaways` in the game_context lateral join |
| `0033_gallery_is_duplicate.sql` | Rebuild `item_gallery` to add `is_duplicate`, powering the "Dupes" filter toggle on the public and admin filter bars |
| `0034_legendary_museum_title.sql` | Add `museum_title text` to `items`; expose directly in `item_gallery`. Used by the Museum/Timeline page to show short tidbit-style titles without modifying `items.title`. Applies to ALL items (not just legendary ones). |
| `0034_populate_museum_titles.sql` | Data migration: populate `museum_title` for all 11 existing legendary items. Run after `0034_legendary_museum_title.sql`. |
| `0035_populate_museum_titles.sql` | Rename of `0034_populate_museum_titles.sql` to resolve version conflict with the two `0034` files. |
| `0036_psa_price_snapshots.sql` | Add `psa_price_snapshots` table (PSA estimate + recent sales per cert, sourced from parse.bot) and `latest_psa_price` view. |
| `0037_gallery_pop_rarity.sql` | Extend `item_gallery` cert lateral to left-join `latest_population`, exposing `pop_higher integer` and `pop_same integer`. Powers the "1/1 FINEST" badge on public gallery cards. |

---

## Edge Functions (`supabase/functions/`)

| Function | Purpose | Trigger |
|---|---|---|
| `psa-sync` | Fetches PSA population data for all PSA/PSA-DNA certs, inserts `population_snapshots` rows | `pg_cron` weekly (Mondays 9am UTC) + manual from admin panel |
| *(none — browser call)* | Price sync calls parse.bot (`get_cert_details` + `get_cert_sales`) directly from the admin browser using `VITE_PARSE_BOT_API_KEY`, then inserts into `psa_price_snapshots`. Triggered per-item from the `sell` icon in `ItemViewerModal`. | Manual only |

