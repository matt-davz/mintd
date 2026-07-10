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
- [x] Create views: `item_gallery` (renamed from `item_cards`), `latest_population`
- [x] Configure RLS on all tables
- [x] Seed pre-defined tags (item type, attribute, era tags)
- [x] Admin write policies (migration `0003`)
- [x] Item type system — `item_type` enum on `items`, `game_context` table, 11 `item_*` detail tables (migrations `0004`–`0012`)

## 3. Auth (Clerk)
- [x] Add Clerk provider to `main.jsx`
- [x] Build `<AdminGuard>` component — redirects to Clerk login if not signed in
- [x] Wrap all `/admin/*` routes with `<AdminGuard>`
- [ ] Configure `src/lib/supabase-admin.js` (service role client — admin Edge Functions only)

## 4. Supabase Connection Test
- [x] Add real values to `.env.local`
- [x] Verify data returns correctly in the browser
- [x] Remove the test page once confirmed working

## 5. Public Site

### Gallery (`/`)
- [x] `useItems` hook — queries `item_gallery` view
- [x] `<FilterBar>` — item type pill filters (from `ITEM_TYPES` config) + search input
- [x] `<ItemCard>` — image, for-sale badge, grade badge, title, featured signer with multi-signer "+N others" rule, cert ID
- [x] `<Gallery>` page — hero heading, filter bar, responsive 1-2-3-4 col grid, pagination, page size selector (16/32/64), scroll-to-top on page change
- [x] Gallery filter/search/sort/page/size state persisted in URL search params (`q`, `types`, `teams`, `sort`, `page`, `size`) — Back after item detail restores exact gallery state

### Item Detail (`/item/:id`)
- [x] `useItem` hook — fetches single item with signatories, certs, images, type detail, game context
- [x] `<ItemDetail>` page — full item view, PSA population table, signatory list. Scroll-to-top on load. Cert IDs link to verification URL when `cert_link` exists.
- [x] PSA population display — Higher / Same / Lower table, monospace numbers
- [x] Image column — single image shows plain (no carousel); multiple images use carousel with thumbs. Fullscreen lightbox on click.
- [x] Type-specific detail display — `components/itemDetail/` with per-type display components + game context
- [ ] Verify `item_gallery` cert data works correctly with edge cases (0 certs, multiple certs)

### Contact (`/contact`)
- [x] `<Contact>` page — simple form (name, email, phone, message)
- [ ] Decide and implement submission method (Supabase insert + Edge Function email, or Formspree)
- [ ] Replace placeholder email + phone with real client details

## 6. Admin Panel

### Dashboard (`/admin/dashboard`) — Overview
- [x] `<AdminLayout>` — sidebar nav + sticky top bar with "Add New Asset" button (opens create modal)
- [x] Stats cards — total item count, total acquisition cost
- [ ] Rebuild inventory feed into a full item grid — shows ALL items with photo + minimal info
- [ ] Search bar + type filter to narrow the grid

### Item List (`/admin/items`) — Table View
- [x] `<ItemList>` page — raw data table, sortable columns, search bar
- [x] **Raw Export** + **Catalog Export** CSV buttons

### Item Viewer / Editor / Creator — unified modal
- [x] `<ItemViewerModal>` — single modal component for view, edit, and create:
  - **View mode** (`itemId` set): read-only display of all item data, certs, sigs, images, type details, game context. Edit button toggles to edit mode.
  - **Edit mode** (`itemId` set, edit toggled): inline editing of all fields, reconciles certs/sigs/images on save. Saves type detail + game context rows.
  - **Create mode** (`itemId={null}`): blank form, starts in edit state, INSERT on save. Opened from "Add New Asset" button in AdminLayout.
- [x] Item type selector — selecting a type shows type-specific fields + game context (where applicable)
- [x] `<CertForm>` — add/edit/delete certifications
- [x] `<SignatoryForm>` — add/edit/delete signatories
- [x] `<ImageUploader>` — upload, delete, set primary
- [x] `<GameContextFields>` — shared game context sub-form (8 item types)
- [x] 11 type-specific field components in `components/admin/itemTypes/`
- [x] **MLB game autofill** — inline lookup toolbar in game context section (by date, matchup, or World Series game #). Calls MLB Stats API, populates all game context fields on click.
- [ ] **URL auto-fill on new item** — paste reference link to scrape + pre-fill form fields (TBD)

### Tags & Categories
- [ ] **Missing cert IDs** — audit items with no `cert_id`; add flag/filter in Table View
- [ ] **Tag UI** — add tag selection pills/checkboxes in the modal editor
- [ ] **Tag display in Table View** — show tags column in `<ItemList>`

### Gallery Order (`/admin/gallery-order`)
- [x] `<GalleryOrder>` page — drag-and-drop curation of public gallery order
- [x] `item_order` table — stores pinned item positions (`item_id` PK, `display_order` integer), cascades on delete
- [x] `useItems` updated — fetches `item_order` in parallel, merges pinned items to front of gallery in `display_order ASC` sequence
- [x] `<ItemViewerModal>` Meta section shows read-only "Gallery Position" field (`#N` or "Not pinned")

### PSA Sync (`/admin/psa-sync`)
- [x] `<PsaSync>` page — manual refresh trigger, progress bar, rate-limit handling
- [x] `supabase/functions/psa-sync` — deployed Edge Function
- [ ] PSA/DNA autograph cert population — map `DNACert` pop fields correctly
- [ ] Configure `pg_cron` to call `psa-sync` weekly (Mondays 9am UTC)

## 7. Deployment
- [ ] Connect repo to Netlify
- [ ] Set env vars in Netlify dashboard (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY, VITE_CLERK_PUBLISHABLE_KEY, VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET — required after .env was removed from git)
- [ ] Configure Netlify redirects for SPA routing (`/* → /index.html`)
- [ ] Set Supabase Edge Function secrets
