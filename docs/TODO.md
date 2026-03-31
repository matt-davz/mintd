# mintd — Build Todo

## 1. Project Setup
- [x] Convert project from default Vite template to actual app structure (clean `src/`, add folders)
- [x] Install dependencies: `react-router-dom`, `@supabase/supabase-js`, `@clerk/clerk-react`
- [x] Set up `.env.local` with all required env vars
- [x] Configure `src/lib/supabase.js` (anon key client)
- [x] Configure `src/lib/cloudinary.js` (helpers)
- [x] Set up React Router in `src/main.jsx` with public + admin route structure

## 2. Database (Supabase)
- [x] Create tables: `items`, `signatories`, `certifications`, `population_snapshots`, `tags`, `item_tags`, `sets`, `images`
- [x] Create views: `item_cards`, `latest_population`
- [x] Configure RLS on all tables
- [x] Seed pre-defined tags (item type, attribute, era tags from CLAUDE.md)

## 3. Auth (Clerk)
- [x] Add Clerk provider to `main.jsx`
- [x] Build `<AdminGuard>` component — redirects to Clerk login if not signed in
- [x] Wrap all `/admin/*` routes with `<AdminGuard>`
- [ ] Configure `src/lib/supabase-admin.js` (service role client — admin Edge Functions only)

## 4. Supabase Connection Test
- [x] Add real values to `.env.local`
- [x] Build a temporary test page at `/test` that queries the `tags` table and renders the results
- [x] Verify data returns correctly in the browser
- [x] Remove the test page once confirmed working

## 5. Public Site

### Gallery (`/`)
- [x] `useItems` hook — queries `item_cards` view, supports tag filter + search
- [x] `useTags` hook — fetches all tags
- [x] `<FilterBar>` — item_type tag pills + search input
- [x] `<ItemCard>` — image, for-sale badge, grade badge (muted gold), title, featured signer with multi-signer "+N others" rule, cert ID, price
- [x] `<Gallery>` page — hero heading, filter bar, responsive 1-2-3-4 col grid

### Item Detail (`/item/:id`)
- [x] `useItem` hook — fetches single item with signatories, certs, images
- [x] `<ItemDetail>` page — full item view, PSA population table (from `latest_population`), signatory list, acquisition cost
- [x] PSA population display — Higher / Same / Lower table, monospace numbers, only show if PSA/PSA-DNA cert exists
- [x] Image column — hover magnifier lens (2.5× zoom follows cursor), fullscreen lightbox modal with keyboard nav + multi-image arrow navigation
- [x] Thumbnail row — clicking thumbnails switches the displayed image
- [ ] Add pagination / gallery card grade badge — requires adding cert fields to `item_cards` view
- [ ] `item_cards` view cert data relies on a lateral join added in migration 0002 — verify it works correctly with real data and edge cases (items with no cert, multiple certs)
- Note: each signatory must be a separate row in the `signatories` table — do not store multiple names as a single comma-separated string

### Contact (`/contact`)
- [x] `<Contact>` page — simple form (name, email, phone, message)
- [ ] Decide and implement submission method (Supabase insert → Edge Function email, or Formspree)
- [ ] Replace placeholder email + phone in Footer and Contact page with real client details
- [ ] Prompt injection protection — sanitise all form fields before submission (strip HTML tags, limit length, reject suspicious patterns)

## 6. Admin Panel

### Dashboard (`/admin/dashboard`) — Overview
- [x] `<AdminLayout>` — sidebar nav (Overview, Table View, PSA Sync, Sign Out) + sticky top bar with Add New Asset CTA
- [x] Stats cards — total item count, total acquisition cost
- [ ] Rebuild inventory feed into a full item grid — shows ALL items with photo + minimal info (title, grade, for-sale status)
- [ ] Search bar + tag filter to narrow the grid
- [ ] Each card links to the item editor

### Item List (`/admin/items`) — Table View
- [x] `<ItemList>` page — raw data table, NO images, ALL fields visible (title, cert, grade, cert ID, cost, ask price, for_sale, signed, acq. type, game date, purchase date, location, notes, added)
- [x] Sortable columns (click header to toggle asc/desc)
- [x] Search bar (searches title, cert ID, location, notes)
- [x] **Raw Export** button — exports current filtered/sorted table to CSV with all columns (headers derived dynamically from data keys)
- [x] **Catalog Export** button — exports a curated CSV: title, cert service, grade, cert ID, for sale, acquisition cost, game date, pop total/higher/lower, signatories, tags. Excludes: notes, ask price, auto total, location, purchase date, Cloudinary IDs, reference link

### Item Viewer + Editor (modal from overview + table view)
- [x] `<ItemViewerModal>` — modal triggered by clicking any item row. Photo top-left, all fields displayed, edit icon. Read-only, frontend only.
- [x] Edit mode — clicking the edit icon within the modal switches fields to editable inputs and saves back to Supabase
- [x] `<CertForm>` — add/edit/delete certifications per item inside the modal
- [x] `<SignatoryForm>` — add/edit/delete signatories per item inside the modal
- [x] `<ImageUploader>` — delete + set-primary inside the modal (Cloudinary upload widget deferred)
- [ ] `/admin/items/new` — create mode (blank form, separate page)
- [ ] **URL auto-fill on new item** — user pastes a reference link URL into the new item form, scraping + OpenClaw retrieves item data (title, grade, cert ID, signatories, etc.) and pre-fills the form fields. User reviews and saves. Scraping implementation TBD.

### PSA Sync (`/admin/psa-sync`)
- [x] `<PsaSync>` page — trigger manual PSA population refresh, progress bar (synced/total), pending cert count, est. days remaining, rate-limit handling with "run again tomorrow" messaging
- [x] `supabase/functions/psa-sync` — deployed Edge Function; fetches PSA certs sorted oldest-synced first, calls `GET /cert/GetByCertNumber/{certNumber}` (1 call/cert = 100 certs/day), inserts `population_snapshots` rows, returns synced/remaining/rate_limited
- [x] Edge Function deployed with `--no-verify-jwt` (admin page is Clerk-protected; JWT not needed at function level)
- [x] `PSA_API_KEY` set as Supabase secret via CLI
- [ ] PSA/DNA autograph cert population — `GetByCertNumber` returns `DNACert` shape for these; need to map `DNACert` pop fields and store correctly
- [ ] Configure `pg_cron` to call `psa-sync` weekly (Mondays 9am UTC) — see SQL snippet in conversation

## 7. Deployment
- [ ] Connect repo to Netlify
- [ ] Set env vars in Netlify dashboard
- [ ] Configure Netlify redirects for SPA routing (`/* → /index.html`)
- [ ] Set Supabase Edge Function secrets (service role key, PSA API key if needed)
