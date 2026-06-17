# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint check
```

No test runner is configured.

## Stack

Entry point: `index.html` → `src/main.jsx`

## What this project is

A private baseball memorabilia collection showcase website for a single client. The public site lets visitors browse the collection and submit inquiries via a contact form. An admin panel at `/admin` lets the client manage his collection, edit items, upload images, and trigger PSA population data syncs.

## Core features

- Gallery viewing for outside users with keyword search and advanced filtering (item type + team).
- Inquiry via simple contact form sent to an email.
- Admin dashboard accessible via Clerk auth for the website owner.
    - **Overview (`/admin/dashboard`)** — stats cards (total items, total cost) + item grid with advanced filter.
    - **Table View (`/admin/items`)** — no images, raw data table. Sortable columns, advanced filter bar, CSV exports.
    - **Item Modal** — unified `<ItemViewerModal>` for viewing, editing, and creating items. Opened from dashboard, table view (existing items), or "Add New Asset" button (create mode). Supports type-specific detail fields and game context.

`mintd` is a high-end memorabilia collector app. Design system: see `docs/DESIGN.md`.

## Stack — do not deviate from this

| Concern | Technology |
|---|---|
| Frontend | Vite + React (JavaScript) |
| Routing | React Router v6 |
| Database | Supabase (PostgreSQL) |
| Auth | Clerk (admin only — public site has zero auth) |
| Images | Cloudinary |
| Contact form | Simple form — decide mailto or Formspree later |
| Scheduled jobs | Supabase pg_cron + Edge Functions |
| Hosting | Netlify |
| Repo | GitHub |

Single Vite + React app. Public and admin share one codebase, split by route.

## Rules

See `docs/RULES.md` for mandatory checklists (e.g. schema changes require updating migrations, docs, editor, and public detail page).

## Build Todo

See `docs/TODO.md` for the full ordered task list.

## File System

See `docs/FILESYSTEM.md`.

## Routing

```jsx
// Public routes — no auth
/                    → Gallery
/item/:id            → ItemDetail
/contact             → Contact

// Admin routes — Clerk auth required on ALL /admin/* routes
/admin               → redirect to /admin/dashboard
/admin/dashboard     → Dashboard
/admin/items         → ItemList
/admin/psa-sync      → PsaSync
```

Item viewing/editing/creating is handled by `<ItemViewerModal>` (modal), not page routes. "Add New Asset" opens the modal in create mode from AdminLayout. Clicking an item in Dashboard or ItemList opens the modal in view mode.

## Auth rules

- Clerk protects ALL routes under `/admin/*`
- A single `<AdminGuard>` component wraps the admin router — if not signed in, redirect to Clerk hosted login
- The public site has absolutely zero authentication — no login, no tokens, nothing
- Never use the Supabase service role key on the public site — anon key only
- The admin site may use the service role key server-side via Edge Functions only — never expose it in the browser

## Database

For all things database and image retrieval check `docs/DATABASE.md`. Full schema reference: `docs/DATABASE_SCHEMA.md`.

## Item Type System

Items have an `item_type` enum column (ticket, card, baseball, bat, jersey, photo, magazine, program, book, base, glove). Each type has a corresponding detail table (`item_tickets`, `item_cards`, etc.) with type-specific fields.

Types with game context (linked via `game_context_id` on the detail table): ticket, baseball, bat, jersey, photo, program, base, glove.

Configuration lives in `src/lib/itemTypeConfig.js`. Type-specific form components are in `src/components/admin/itemTypes/`.

## Design — important

Full design spec: `docs/DESIGN.md`
Page mockups (HTML reference): `docs/PageExaples/`
- `vault_gallery_layout_refinement/` — public gallery (`/`)
- `item_viewer/` — item detail page (`/item/:id`)
- `admin_dashboard_updated_icon/` — admin dashboard (`/admin/dashboard`)

Styling: **styled-components only** — no Tailwind, no CSS modules. Design tokens (CSS custom properties) and global styles are defined in `src/styles/GlobalStyles.js` via `createGlobalStyle`. All components reference tokens via `var(--color-*)`, `var(--font-*)`, `var(--space-*)` etc.

Design direction:
- Dark luxury aesthetic — deep blacks, electric blue (`#adc6ff`) accent
- Typography: Space Grotesk (headlines) · Inter (body) · Berkeley Mono (cert IDs, grades, data)
- Cards: dark surface, large image, muted gold grade badge (`secondary-container`), cert ID in mono
- No 1px solid borders for layout — use background shifts. Ghost border (`outline-variant` at 15% opacity) only as fallback in dense data views.

## Gallery filter (public + admin)

Both the public gallery and admin overview/table view share the same filter+sort pattern. Two separate components with identical prop interfaces — `FilterBar.jsx` (public) and `AdminFilterBar.jsx` (admin) — styled differently but functionally the same.

### Architecture

All filtering and sorting is **client-side**. Items are fetched once (all of them), then filtered/sorted in memory via `useMemo`. No query reruns on filter change.

Each page that uses a filter bar manages its own state and derives available options from the loaded items:

```
useItems() / raw query
  → items[]
    → availableTypes  (useMemo — distinct item_type values)
    → availableTeams  (useMemo — flattened team_slugs, Yankees pinned first)
    → filtered        (items.filter — type AND team AND keyword)
    → displayed       (filtered sorted by sortBy, or unsorted if sortBy is '')
    → paginated       (displayed.slice for current page)
```

### Current filter conditions

All conditions are AND — an item must pass every active condition to appear.

| Condition | State | Logic |
|---|---|---|
| Keyword search | `search: string` | `item.title.toLowerCase().includes(search)` |
| Item type | `activeTypes: string[]` | `activeTypes.length === 0 \|\| activeTypes.includes(item.item_type)` — multi-select OR |
| Team | `activeTeams: string[]` | `activeTeams.length === 0 \|\| item.team_slugs.some(s => activeTeams.includes(s))` — multi-select OR |

### Current sort options (`sortBy` state)

Sort is single-select (dropdown). One sort active at a time. Empty string = default order.

| Value | Behaviour |
|---|---|
| `''` | Default — order returned by DB |
| `'year_desc'` | `item.season_year` descending (newest first) |
| `'year_asc'` | `item.season_year` ascending (oldest first) |
| `'grade_desc'` | `gradeToNumber(cert_grade)` descending (highest grade first) |
| `'grade_asc'` | `gradeToNumber(cert_grade)` ascending (lowest grade first) |

`gradeToNumber` extracts the trailing number from PSA-style grade strings (`"NM-MT 8"` → 8, `"GEM MT 10"` → 10, `"Authentic"` → -1 sorts to the bottom).

### Active filter pills

Active conditions render as removable pills **inside the search bar**. Each pill has a label and an `onRemove` callback. The `activePills` array in each filter component aggregates them:

```js
const activePills = [
  ...activeTypes.map(t => ({ key: `type:${t}`, label, onRemove })),
  ...activeTeams.map(t => ({ key: `team:${t}`, label, onRemove })),
  ...(sortBy ? [{ key: 'sort', label: SORT_LABELS[sortBy], onRemove }] : []),
]
```

### Accordion sections

The "Advanced Search" accordion contains sections in order: **Item Type** → **Teams** → **Sort**. Teams section only renders when `availableTeams.length > 0`. Sort section always renders.

### Props interface (both FilterBar and AdminFilterBar)

```
availableTypes  string[]     distinct item_type values from loaded items
activeTypes     string[]     currently selected types
onTypeToggle    (type) => void
onTypeClear     () => void

availableTeams  string[]     distinct team slugs from item.team_slugs, Yankees first
activeTeams     string[]     currently selected teams
onTeamToggle    (team) => void
onTeamClear     () => void

sortBy          string       '' | 'year_desc' | 'year_asc' | 'grade_desc' | 'grade_asc'
onSortChange    (val) => void

search          string
onSearchChange  (val) => void
```

### How to add a new filter condition

1. **Verify the field is in `item_gallery`** — if not, write a migration to add it to the view (see migrations 0017–0020 as examples).
2. **Add state** in `Gallery.jsx`, `Dashboard.jsx`, and `ItemList.jsx`:
   ```js
   const [activeX, setActiveX] = useState(/* null / [] / '' depending on type */)
   ```
3. **Derive available options** via `useMemo` from the loaded items array if it's a multi-select (type/team pattern), or skip if it's a static set.
4. **Add to the filter predicate** in the `filtered` useMemo/filter call:
   ```js
   const matchesX = !activeX || item.someField === activeX
   return ... && matchesX
   ```
5. **Add to `activePills`** in both `FilterBar.jsx` and `AdminFilterBar.jsx` so the active state shows as a removable pill in the search bar.
6. **Add a section** to the accordion body in both filter components.
7. **Pass the new props** to both filter components from all three pages.
8. **For sorts**: add a new `<option>` to the Sort dropdown and a new branch in the `displayed` sort useMemo in each page.

## Teams system

MLB teams are stored in the `teams` table (`id`, `name`, `slug`, `abbreviation`). Items are linked via the `item_teams` junction table (many-to-many — one item can be associated with multiple teams).

**Auto-population:** when an item with game context is saved in `ItemViewerModal`, `syncItemTeams` runs automatically — it matches `game_context.home_team` and `game_context.away_team` abbreviations against `teams.abbreviation`, deletes existing `item_teams` for that item, and inserts new rows for any matches. This means saving a Yankees vs. Red Sox ticket auto-tags that item with both teams.

The `item_gallery` view aggregates team slugs as `team_slugs text[]`, analogous to `tag_slugs`.

## Tags — pre-seeded categories

Attribute tags: `autographed`, `game-used`, `world-series`, `clinch-game`, `rookie-card`, `team-signed`, `proof-card`

Era tags: `pre-1920`, `1920s`, `1930s`, `1940s`, `1950s`, `1960s`, `modern`

Item type tags (legacy — `item_type` column is now the primary way to categorize): `ticket-stub`, `full-ticket`, `card`, `baseball`, `bat`, `jersey`, `photo`, `magazine`, `program`, `book`, `base`, `glove`

## Public site display rules

- **No prices on public site** — acquisition cost / price is hidden from the gallery cards and item detail page. Price data remains in the DB and is visible in admin only.
- **Cert ID hyperlinks** — on the item detail page, cert IDs link to the verification URL (`cert_link`) when available. Supported services: PSA, PSA/DNA, JSA (auto-generated via `CERT_LINK_BUILDERS` in `CertForm.jsx`).
- **Single-image items** — item detail shows a plain image (no carousel) when only one image exists. Carousel only renders for 2+ images.
- **Page size selector** — gallery has a dropdown to show 16, 32, or 64 items per page.
- **Scroll-to-top** — gallery scrolls to top on page change; item detail scrolls to top on load.
- **Box score** — if a game context has `box_score` data, a linescore table (inning-by-inning + R/H/E) renders on both the public item detail page and admin modal. Shared component: `src/components/BoxScoreDisplay.jsx`.
- **Set members accordion** — if an item has a `set_id`, an accordion renders at the bottom of the detail column (public) and as a "Set Members" section in the admin modal. Opening it fetches and displays a horizontal-scroll carousel of all other items in the same set. Shared component: `src/components/SetMembersAccordion.jsx`, data hook: `src/hooks/useSetMembers.js`. Condition is `item.set_id` only — `is_part_of_set` is not checked, so master set items (which have `set_id` but `is_part_of_set = false`) also show the carousel. In admin, clicking a carousel card switches the modal to that item via `onOpenItem` prop.

## Multi-signer display rule

On gallery cards: show the `is_featured = true` signatory name prominently. If there are additional signers, show "+ N others" that expands inline. Never show a raw comma-separated string.

## PSA population display

Always read from the `latest_population` view, not `population_snapshots` directly. Display Higher / Same / Lower as a minimal data table with monospace numbers. Only show population data if a PSA or PSA/DNA cert exists for the item.

## Environment variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
VITE_CLERK_PUBLISHABLE_KEY=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=mintd
```

Never commit `.env.local`. Never expose service role key or Clerk secret key in the frontend.

## Things that are deliberately excluded

- No e-commerce / Stripe — inquiries only
- No user accounts for visitors — public site is fully open
- No server-side rendering — pure Vite SPA
- No Next.js — Vite only
- No Prisma or other ORM — Supabase JS client only
- No Redux — React Query or plain hooks for data fetching
- No separate backend server — Supabase Edge Functions only
- Inquiries ARE stored in the `inquiries` table AND emailed via Edge Function

## Code style preferences

- Functional components only, no class components
- Named exports preferred over default exports (except pages)
- Keep components focused — if a component exceeds ~150 lines, split it
