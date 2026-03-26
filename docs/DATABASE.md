## Database — Supabase

Schema: `supabase/migrations/0001_initial_schema.sql`

### Tables

- `sets` — named groupings of items (e.g. "Mickey Mantle WS Home Runs")
- `items` — core collection items (everything hangs off this)
- `signatories` — one row per signer per item; `is_featured = true` drives card display
- `certifications` — PSA, PSA/DNA, BGS, JSA, SGC, Steiner, CGC etc. — one row per cert per item
- `population_snapshots` — append-only PSA pop report history, hangs off `certifications`
- `tags` + `item_tags` — many-to-many tag system
- `images` — Cloudinary references; unique constraint enforces one `is_primary = true` per item
- `inquiries` — visitor contact form submissions; stored in DB and emailed via Edge Function

### Key item fields

- `title` — display name (not `name`)
- `is_visible` — draft flag; false hides from public
- `is_baseball` — false hides from public (non-baseball items stored but not shown)
- `for_sale` — drives "For Sale" badge
- `acquisition_type` — `purchased` | `gifted` | `inherited` | `consignment` | `unknown`
- `item_total` / `auto_total` — cost breakdown fields
- `is_world_series_game`, `ws_game_number`, `is_clinch_game`, `clinch_number` — game context

### Certifications fields

- `cert_service` — `PSA` | `PSA/DNA` | `BGS` | `JSA` | `SGC` | `Steiner` | `CGC` | `MLB Auth` | `Beckett` | `K&D`
- `cert_id` — the cert/serial number
- `item_grade` — card/item grade e.g. `NM-MT 8`, `Authentic`
- `auto_grade` — autograph grade e.g. `GEM MT 10` (null if not an auto cert)
- `is_autograph_cert` — true for PSA/DNA, JSA etc.; false for card graders

### Population snapshots fields

- `snapshot_type` — `psa_grade` | `psa_dna`
- `total`, `higher`, `same`, `lower` — population counts

### Views (always use these in queries, not raw tables)

- `item_cards` — denormalised gallery view; one row per item with primary image, featured signer, tag slugs, set name. Already filtered to `is_visible = true AND is_baseball = true`
- `latest_population` — most recent population snapshot per cert

### RLS

- Public: read `items` where `is_visible = true AND is_baseball = true`; related data follows same rule
- Public: can INSERT `inquiries` but cannot read them
- Admin: full access via service role key in Edge Functions only — never expose service role key in browser

### Images — Cloudinary

- Upload preset: `mintd` (unsigned); all uploads go into the `mintd` folder
- Store `cloudinary_public_id` + `cloudinary_url` in `images` table
- One image per item must have `is_primary = true` (enforced by unique partial index)
- Use Cloudinary URL transformation API for responsive sizes — never store multiple sizes

### Edge Functions (`supabase/functions/`)

- `psa-sync` — fetches PSA population data for all PSA/PSA-DNA certs, inserts `population_snapshots` rows. Called by `pg_cron` weekly (Mondays 9am UTC) and manually from admin panel
