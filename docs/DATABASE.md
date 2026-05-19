## Database — Supabase

Schema: `supabase/migrations/`. Full reference: `docs/DATABASE_SCHEMA.md`.

### Tables

- `sets` — named groupings of items (e.g. "Mickey Mantle WS Home Runs")
- `items` — core collection items (everything hangs off this)
- `game_context` — structured game metadata (date, teams, venue, game type, score); linked from detail tables
- `signatories` — one row per signer per item; `is_featured = true` drives card display
- `certifications` — PSA, PSA/DNA, BGS, JSA, SGC, Steiner, CGC etc. — one row per cert per item
- `population_snapshots` — append-only PSA pop report history, hangs off `certifications`
- `tags` + `item_tags` — many-to-many tag system
- `images` — Cloudinary references; unique constraint enforces one `is_primary = true` per item
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

Tables with game context (tickets, baseballs, bats, jerseys, photos, programs, bases, gloves) have a `game_context_id` FK → `game_context`.

### Key item fields

- `title` — display name (not `name`)
- `item_type` — `item_type_enum` — drives which detail table is populated (nullable; back-fill via admin UI)
- `is_visible` — draft flag; false hides from public
- `is_baseball` — false hides from public (non-baseball items stored but not shown)
- `for_sale` — drives "For Sale" badge
- `acquisition_type` — `purchased` | `gifted` | `inherited` | `consignment` | `unknown`
- `item_total` / `auto_total` — cost breakdown fields

> Game context (game date, venue, teams, WS/clinch flags) lives in the `game_context` table, linked from detail tables via `game_context_id`. These fields were removed from `items` in migration `0009`.

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

- `item_gallery` — denormalised gallery view; one row per item with primary image, featured signer, tag slugs, set name, primary cert. Filtered to `is_visible = true AND is_baseball = true`. Previously named `item_cards` — renamed in migration `0011` (`item_cards` is now the trading card detail table).
- `latest_population` — most recent population snapshot per cert

### RLS

- Public: read `items` where `is_visible = true AND is_baseball = true`; related data follows same rule
- Public: read `game_context`, `tags`, `sets` freely (shared lookups)
- Public: can INSERT `inquiries` but cannot read them
- Admin: full access via anon key (Clerk guards `/admin/*` routes — security boundary is at the route layer)
- Never expose service role key in the browser; use it in Edge Functions only

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

### Edge Functions (`supabase/functions/`)

- `psa-sync` — fetches PSA population data for PSA/PSA-DNA certs, inserts `population_snapshots` rows. Called by `pg_cron` weekly (Mondays 9am UTC), manually from admin panel (full batch), or per-item from the `ItemViewerModal` sync button. Accepts optional `{ cert_ids: string[] }` body to sync specific certs instead of the full batch.
