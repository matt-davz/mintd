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
- [ ] `useItem` hook — fetches single item with signatories, certs, images
- [ ] `<ItemDetail>` page — full item view, PSA population table (from `latest_population`), signatory list
- [ ] PSA population display — Higher / Same / Lower table, monospace numbers, only show if PSA/PSA-DNA cert exists

### Contact (`/contact`)
- [x] `<Contact>` page — simple form (name, email, phone, message)
- [ ] Decide and implement submission method (Supabase insert → Edge Function email, or Formspree)
- [ ] Replace placeholder email + phone in Footer and Contact page with real client details
- [ ] Prompt injection protection — sanitise all form fields before submission (strip HTML tags, limit length, reject suspicious patterns)

## 6. Admin Panel

### Dashboard (`/admin/dashboard`)
- [ ] `<Dashboard>` page — total item count, total acquisition cost, market value placeholder

### Item List (`/admin/items`)
- [ ] `<ItemList>` page — full analytical table view of collection (all fields visible, sortable)

### Item Editor (`/admin/items/new` + `/admin/items/:id`)
- [ ] `<CertForm>` — add/edit certifications per item
- [ ] `<SignatoryForm>` — add/edit signatories per item
- [ ] `<ImageUploader>` — Cloudinary unsigned upload widget, sets `is_primary`
- [ ] `<ItemEditor>` page — create and edit mode, all item fields, sub-forms for certs/signatories/images

### PSA Sync (`/admin/psa-sync`)
- [ ] `<PsaSync>` page — trigger manual PSA population refresh, show last sync time and result

## 7. Edge Functions (Supabase)
- [ ] `supabase/functions/psa-sync` — fetch PSA pop data for all PSA/PSA-DNA certs, insert `population_snapshots` rows
- [ ] Configure `pg_cron` to call `psa-sync` weekly (Mondays 9am UTC)

## 8. Deployment
- [ ] Connect repo to Netlify
- [ ] Set env vars in Netlify dashboard
- [ ] Configure Netlify redirects for SPA routing (`/* → /index.html`)
- [ ] Set Supabase Edge Function secrets (service role key, PSA API key if needed)
