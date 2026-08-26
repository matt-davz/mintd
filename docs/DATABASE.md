## Database — Supabase

Schema: `supabase/migrations/`. Full reference: `docs/DATABASE_SCHEMA.md`.

### Tables

- `sets` — named groupings of items (e.g. "Mickey Mantle WS Home Runs"). See set membership rules below.
- `items` — core collection items (everything hangs off this)
- `game_context` — structured game metadata (date, teams, venue, game type, score, box score); linked from detail tables
- `signatories` — one row per signer per item; `is_featured = true` drives card display
- `certifications` — PSA, PSA/DNA, BGS, JSA, SGC, Steiner, CGC etc. — one row per cert per item
- `population_snapshots` — append-only PSA pop report history, hangs off `certifications`
- `psa_price_snapshots` — append-only PSA price estimate + recent sales history, hangs off `certifications`. Sourced from parse.bot.
- `tags` + `item_tags` — many-to-many tag system
- `teams` + `item_teams` — MLB team associations; many-to-many. Auto-populated from `game_context.home_team` / `away_team` on item save. Drives the Teams filter in the gallery and admin advanced search.
- `images` — Cloudinary references; unique constraint enforces one `is_primary = true` per item
- `legendary_context` — 1:1 with `items` (only for `is_legendary = true` items); holds `event_title` and `event_description` for the Timeline legendary display
- `legendary_images` — contextual/historical images for a legendary item; hangs off `legendary_context`. Separate from product shots in `images`. Named `legendary/{itemId_first8}/image_{n}` in Cloudinary.
- `item_loas` — Letters of Authenticity per item; multiple per item, supports images and PDFs. Cloudinary path: `mintd/loas/{itemId_first8}/{filename}`
- `item_duplicates` — join table linking duplicate items together (one-direction: `item_id` → `duplicate_of_id`, query both columns to find an item's duplicates). Managed by `DuplicatesSection` (admin); auto-syncs `items.is_duplicate` on both linked items
- `inquiries` — visitor contact form submissions; stored in DB and emailed via Edge Function

### Item detail tables (one row per item, linked by `item_id`)

Each type-specific table holds fields that only apply to that item type. Populated when `items.item_type` is set.

| Table | Item type |
|---|---|
| `item_tickets` | Ticket / stub |
| `item_cards` | Trading card |
| `item_baseballs` | Baseball |
| `item_bats` | Bat |
| `item_jerseys` | Jersey |
| `item_photos` | Photo / print |
| `item_magazines` | Magazine |
| `item_programs` | Game program |
| `item_books` | Book |
| `item_bases` | Base |
| `item_gloves` | Glove |
| `item_miscellaneous` | Miscellaneous |
| `item_stadium_giveaways` | Stadium giveaway |

Tables with game context (tickets, baseballs, bats, jerseys, photos, programs, bases, gloves, stadium giveaways) have a `game_context_id` FK → `game_context`. `item_miscellaneous` has no game context.

### Key item fields

- `title` — display name (not `name`)
- `item_type` — `item_type_enum` — drives which detail table is populated (nullable; back-fill via admin UI)
- `is_visible` — draft flag; false hides from public
- `is_baseball` — false hides from public (non-baseball items stored but not shown)
- `for_sale` — drives "For Sale" badge
- `is_legendary` — flags item for special display treatment on the Yankees Museum Timeline; triggers the Legendary Context section in the admin editor
- `acquisition_type` — `purchased` | `gifted` | `inherited` | `consignment` | `unknown`
- `item_total` / `auto_total` — cost breakdown fields

### Set membership rules

Two distinct roles an item can have relative to a set:

| Role | `is_part_of_set` | `set_id` | Example |
|---|---|---|---|
| Member item | `true` | set UUID | Individual 1956 Topps card |
| Master set item | `false` | set UUID | "1956 Topps Baseball Complete Set (340)" — the original lot purchase |

**The `SetMembersAccordion` checks only `set_id` (not `is_part_of_set`).** Both member items and master items show the carousel. This means:
- Each individual card's detail page shows the other cards + the master lot item
- The master lot item's detail page shows all individualized cards

When a purchased lot is broken into individual items, set up the set like this:
1. Create the set record in `sets`
2. Set `set_id` + `is_part_of_set = true` on each individual item
3. Set `set_id` + `is_part_of_set = false` on the master lot item

> Game context (game date, venue, teams, WS/clinch flags, box score) lives in the `game_context` table, linked from detail tables via `game_context_id`. These fields were removed from `items` in migration `0009`.
>
> `box_score` is a JSONB column storing inning-by-inning linescore + R/H/E totals. Shape: `{ innings: [{inning, away, home}], home: {r, h, e}, away: {r, h, e} }`. Auto-populated from the MLB Stats API via `hydrate=linescore` when using the Game Lookup Toolbar in admin.

### Certifications fields

- `cert_service` — `PSA` | `PSA/DNA` | `BGS` | `JSA` | `SGC` | `Steiner` | `CGC` | `MLB Auth` | `Beckett` | `K&D`
- `cert_id` — the cert/serial number
- `cert_link` — verification URL; auto-populated on blur for supported services (see below)
- `item_grade` — card/item grade e.g. `NM-MT 8`, `Authentic`
- `auto_grade` — autograph grade e.g. `GEM MT 10` (null if not an auto cert)
- `is_autograph_cert` — true for PSA/DNA, JSA etc.; false for card graders

#### Cert link autofill

When a cert ID is entered in the admin form, `CertForm.jsx` auto-generates `cert_link` on blur for supported services via a `CERT_LINK_BUILDERS` config map. Currently supported:

| Service | URL pattern |
|---|---|
| PSA | `https://www.psacard.com/cert/{id}/psa` |
| PSA/DNA | `https://www.psacard.com/cert/{id}/dna` |
| JSA | `https://www.spenceloa.com/verify-authenticity/results?certificateNumber={id}` |

To add a new service, add an entry to `CERT_LINK_BUILDERS` in `src/components/admin/CertForm.jsx`.

> **Backfill (2026-05-19):** 160 existing PSA, PSA/DNA, and JSA certs were backfilled with auto-generated `cert_link` values. The remaining ~20 certs without links are services without URL templates (BGS, SGC, Steiner, MLB Auth, Beckett, etc.).

### Population snapshots fields

- `snapshot_type` — `psa_grade` | `psa_dna`
- `total`, `higher`, `same`, `lower` — population counts

### Views (always use these in queries, not raw tables)

- `item_gallery` — denormalised gallery view; one row per item with primary image, featured signer, `signatory_count integer`, `tag_slugs text[]`, `team_slugs text[]`, `season_year`, set name, primary cert, `is_legendary`, `is_duplicate`, `game_date date`, `series_game_number integer`, and `legendary_event_title text`. Filtered to `is_visible = true AND is_baseball = true`. Featured signer uses `LATERAL LIMIT 1` to prevent duplicate rows when multiple `is_featured` signatories exist — `signatory_count` carries the total for "+ N others" display. Previously named `item_cards` — renamed in migration `0011` (`item_cards` is now the trading card detail table). This is the data source for all client-side filtering and sorting in the gallery. `game_date` and `series_game_number` are `NULL` for items without game context (e.g. cards).
- `latest_population` — most recent population snapshot per cert
- `latest_psa_price` — most recent price snapshot per cert. **Always query this instead of `psa_price_snapshots` directly.**

### RLS

- Public: read `items` where `is_visible = true AND is_baseball = true`; related data follows same rule
- Public: read `game_context`, `tags`, `sets` freely (shared lookups)
- Public: can INSERT `inquiries` but cannot read them
- Admin: full access via anon key (Clerk guards `/admin/*` routes — security boundary is at the route layer)
- Never expose service role key in the browser; use it in Edge Functions only

### Cloudinary — folder structure

Two root folders exist in the account:

```
mintd/                         ← all item-related assets
  import/                      ← product shot images (auto-created by naming convention)
  loas/                        ← Letters of Authenticity (PDFs and scans)
    {first 8 chars of item UUID}/
      {filename}               ← e.g. jsa_loa.pdf, psa_dna_loa.jpg
  legendary/                   ← contextual/historical images for legendary items
    {first 8 chars of item UUID}/
      image_{n}
decade_pics/                   ← decade background images for the Yankees Museum timeline
```

#### Folder rules

| Folder | Resource types | Naming |
|---|---|---|
| `mintd/import/` | images only | `import/{itemId_first8}/image_{n}` |
| `mintd/loas/` | images + PDFs | `mintd/loas/{itemId_first8}/{descriptive_name}` |
| `mintd/legendary/` | images only | `legendary/{itemId_first8}/image_{n}` |
| `decade_pics/` | images only | flat — no subfolders |

---

### Images — Cloudinary

- Upload preset: `mintd` (unsigned)
- Store `cloudinary_public_id` + `cloudinary_url` in `images` table
- One image per item must have `is_primary = true` (enforced by unique partial index)
- Use Cloudinary URL transformation API for responsive sizes — never store multiple sizes

#### Naming convention

```
import/{first 8 chars of item UUID}/image_{n}
```

Examples:
```
import/af557e5a/image_0   ← primary image
import/af557e5a/image_1
```

`n` is zero-indexed; `display_order` matches.

#### Upload pipeline

1. User picks image files — local blob URLs shown as previews immediately
2. User submits form — item inserted into Supabase, DB-generated UUID returned
3. Images uploaded to Cloudinary via `uploadToCloudinary(file, publicId)` in `src/lib/cloudinary.js`
4. After all uploads succeed, rows inserted into `images` table
5. If no image marked primary, first image is automatically promoted
6. If upload fails, error surfaces visibly — item already exists and images can be added later

---

### LOAs — Letters of Authenticity

LOAs live in `mintd/loas/` in Cloudinary. Each item gets its own subfolder keyed by the first 8 characters of its UUID.

#### Naming convention

```
mintd/loas/{itemId_first8}/{descriptive_name}.{ext}
```

Examples:
```
mintd/loas/af557e5a/jsa_loa.pdf
mintd/loas/af557e5a/psa_dna_loa.jpg
mintd/loas/af557e5a/steiner_loa.pdf
```

#### Notes

- `resource_type: 'image'` for both image scans and PDFs (allows Cloudinary transformations and page access on PDFs via `pg_1`, `pg_2`, etc.)
- No `is_primary` concept — all LOAs for an item are peers, ordered by `display_order`
- LOA records stored in a dedicated `item_loas` table (to be migrated), not the `images` table

### Edge Functions (`supabase/functions/`)

- `psa-sync` — fetches PSA population data for PSA/PSA-DNA certs, inserts `population_snapshots` rows. Called by `pg_cron` weekly (Mondays 9am UTC), manually from admin panel (full batch), or per-item from the `ItemViewerModal` sync button. Accepts optional `{ cert_ids: string[] }` body to sync specific certs instead of the full batch.
