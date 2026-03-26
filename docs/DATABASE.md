## Database — Supabase

### Tables
- `items` — core collection items
- `signatories` — one row per signer per item
- `certifications` — PSA, BGS, JSA, SGC etc. — one row per cert per item
- `population_snapshots` — append-only PSA pop report history, hangs off certifications
- `tags` + `item_tags` — many-to-many tag system
- `sets` — named groupings of items
- `images` — Cloudinary references, one primary per item

### Views (use these in queries, not raw tables)
- `item_cards` — denormalised gallery view, one row per item with all display data
- `latest_population` — most recent population snapshot per cert

### RLS
- Public can only read items where `is_visible = true` AND `is_baseball = true`
- Admin bypasses RLS via service role key in Edge Functions
- Never disable RLS on any table

### Key item fields to know
- `is_visible` — draft flag, false hides from public
- `is_baseball` — false hides from public (non-baseball items stored but not shown)
- `for_sale` — drives the "For Sale" badge on gallery cards
- `acquisition_type` — 'purchased' | 'gifted' | 'inherited' | 'consignment' | 'unknown'

## Supabase Edge Functions

Located in `supabase/functions/`:

- `psa-sync` — fetches PSA population data for all PSA/PSA-DNA certs and inserts snapshot rows. Called by pg_cron weekly (Mondays 9am UTC) and manually from admin panel

## Images - Cloudinary 

- Upload preset name: `mintd` (unsigned)
- All uploads go into the `mintd` folder
- Store `cloudinary_public_id` and `cloudinary_url` in the `images` table
- One image per item must have `is_primary = true` — this is the gallery thumbnail
- Use Cloudinary's URL transformation API for responsive sizes — never store multiple sizes