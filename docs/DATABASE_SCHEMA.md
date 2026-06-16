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
| `item_type_enum` | `ticket`, `card`, `baseball`, `bat`, `jersey`, `photo`, `magazine`, `program`, `book`, `base`, `glove` |
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
| `item_grade` | `text` | | e.g. `NM-MT 8`, `Authentic` |
| `auto_grade` | `text` | | e.g. `GEM MT 10` — null if not autograph cert |
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

### `tags` + `item_tags`

Flexible many-to-many tag system. Drives public gallery filters.

**Seeded values:**

| Category | Slugs |
|---|---|
| `item_type` | `ticket-stub`, `full-ticket`, `card`, `baseball`, `bat`, `jersey`, `photo`, `magazine`, `program`, `book`, `base`, `glove` |
| `attribute` | `autographed`, `game-used`, `world-series`, `clinch-game`, `rookie-card`, `team-signed`, `proof-card` |
| `era` | `pre-1920`, `1920s`, `1930s`, `1940s`, `1950s`, `1960s`, `modern` |

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

Tables with `game_context_id uuid` FK → `game_context(id)` ON DELETE SET NULL: `item_tickets`, `item_baseballs`, `item_bats`, `item_jerseys`, `item_photos`, `item_programs`, `item_bases`, `item_gloves`.

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

---

## Functions

### `set_updated_at()`
Sets `new.updated_at = now()` on update. Used by all tables with `updated_at`.

---

## Views

### `latest_population`
Most recent population snapshot per cert. **Always query this instead of `population_snapshots` directly.**

### `item_gallery`
Denormalised view for the public gallery. One row per item with primary image, featured signer, signatory count, tags array, set name, and primary cert (PSA/BGS/SGC preferred via lateral subquery). Featured signer and cert use `LATERAL LIMIT 1` to guarantee exactly one row per item. Filtered to `WHERE is_visible = true AND is_baseball = true`.

**Columns:** `id`, `title`, `description`, `reference_link`, `price`, `acquisition_type`, `is_autographed`, `item_type`, `purchase_date`, `for_sale`, `is_part_of_set`, `set_id`, `notes`, `created_at`, `primary_image_url`, `featured_signer`, `signatory_count`, `tag_slugs` (array), `set_name`, `cert_service`, `cert_id`, `cert_grade`, `auto_grade`

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
| `tags` | SELECT all | — |
| `item_tags` | SELECT all | INSERT, DELETE |
| `images` | SELECT all | SELECT all, INSERT, UPDATE, DELETE |
| `sets` | SELECT all | — |
| `inquiries` | INSERT only | — |
| `item_tickets` … `item_gloves` | SELECT for visible items | SELECT all, INSERT, UPDATE, DELETE |

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

---

## Edge Functions (`supabase/functions/`)

| Function | Purpose | Trigger |
|---|---|---|
| `psa-sync` | Fetches PSA population data for all PSA/PSA-DNA certs, inserts `population_snapshots` rows | `pg_cron` weekly (Mondays 9am UTC) + manual from admin panel |
