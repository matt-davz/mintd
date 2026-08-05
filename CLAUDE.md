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
- **Yankees Museum (`/museum`)** - public chronological timeline of all Yankees-tagged items. Horizontal scroll on desktop (alternating above/below axis, decade background images cross-fade on scroll, draggable scrubber). Vertical scroll list on mobile. Items with `is_legendary = true` are centered on the axis, fill most of the track height, and display with a pulsing blue glow + dual ember particle layers (`EmberEffect`). Neighboring stops drift outward when a legendary item is centered. Sorted by `game_date` (exact date when available) falling back to `season_year`; `series_game_number` breaks ties within the same date.
- Inquiry via simple contact form sent to an email.
- Admin dashboard accessible via Clerk auth for the website owner.
    - **Overview (`/admin/dashboard`)** - stats cards (total items, total cost) + item grid with advanced filter.
    - **Table View (`/admin/items`)** - no images, raw data table. Sortable columns, advanced filter bar, CSV exports.
    - **Item Modal** - unified `<ItemViewerModal>` for viewing, editing, and creating items. Opened from dashboard, table view (existing items), or "Add New Asset" button (create mode). Supports type-specific detail fields, game context, and LOA management (upload images/PDFs per item via `LoaUploader`).

`mintd` is a high-end memorabilia collector app. Design system: see `docs/DESIGN.md`.

## Stack - do not deviate from this

| Concern | Technology |
|---|---|
| Frontend | Vite + React (JavaScript) |
| Routing | React Router v6 |
| Database | Supabase (PostgreSQL) |
| Auth | Clerk (admin only - public site has zero auth) |
| Images | Cloudinary |
| Contact form | Simple form - decide mailto or Formspree later |
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
// Public routes - no auth
/                    → Gallery
/item/:id            → ItemDetail
/museum              → Timeline (Yankees Museum - chronological horizontal timeline)
/contact             → Contact

// Admin routes - Clerk auth required on ALL /admin/* routes
/admin               → redirect to /admin/dashboard
/admin/dashboard     → Dashboard
/admin/items         → ItemList
/admin/psa-sync      → PsaSync
```

Item viewing/editing/creating is handled by `<ItemViewerModal>` (modal), not page routes. "Add New Asset" opens the modal in create mode from AdminLayout. Clicking an item in Dashboard or ItemList opens the modal in view mode.

## Auth rules

- Clerk protects ALL routes under `/admin/*`
- A single `<AdminGuard>` component wraps the admin router - if not signed in, redirect to Clerk hosted login
- The public site has absolutely zero authentication - no login, no tokens, nothing
- Never use the Supabase service role key on the public site - anon key only
- The admin site may use the service role key server-side via Edge Functions only - never expose it in the browser

## Database

For all things database and image retrieval check `docs/DATABASE.md`. Full schema reference: `docs/DATABASE_SCHEMA.md`.

## Item Type System

Items have an `item_type` enum column (ticket, ticket_sheet, card, baseball, bat, jersey, photo, magazine, program, book, base, glove, miscellaneous, stadium_giveaway). Each type has a corresponding detail table (`item_tickets`, `item_cards`, etc.) with type-specific fields.

**Ticket sheets** (`ticket_sheet`) are a special item type for uncut strips of multiple game tickets. Unlike other types that link to a single `game_context` via a FK on the detail table, ticket sheets link to **multiple** game contexts via the `ticket_sheet_games` junction table (`item_ticket_sheets` → `ticket_sheet_games` → `game_context`). The public detail page renders an accordion with one expandable panel per game (box scores, player stats, notes). Phantom games (pre-printed but never played) are supported. Config: `src/lib/itemTypeConfig.js` has `GAME_CONTEXT_VIA_DETAIL_FK` set to exclude `ticket_sheet` from single-game-context paths.

Types with game context (linked via `game_context_id` on the detail table): ticket, baseball, bat, jersey, photo, program, base, glove, stadium_giveaway. `ticket_sheet` also has game context but via the `ticket_sheet_games` junction table (multiple games per item). `miscellaneous` has no game context.

Configuration lives in `src/lib/itemTypeConfig.js`. Type-specific form components are in `src/components/admin/itemTypes/`.

## Duplicates

Items can be linked as duplicates of one another via the `item_duplicates` join table. Managed in admin by `DuplicatesSection` (carousel multi-select, in `ItemViewerModal`); shown on the public item detail page as an accordion via `DuplicateCopiesSection`. Linking/unlinking auto-syncs `items.is_duplicate` on both linked items. Data hook: `src/hooks/useItemDuplicates.js`.

## Design - important

Full design spec: `docs/DESIGN.md`
Page mockups (HTML reference): `docs/PageExaples/`
- `vault_gallery_layout_refinement/` - public gallery (`/`)
- `item_viewer/` - item detail page (`/item/:id`)
- `admin_dashboard_updated_icon/` - admin dashboard (`/admin/dashboard`)

Styling: **styled-components only** - no Tailwind, no CSS modules. Design tokens (CSS custom properties) and global styles are defined in `src/styles/GlobalStyles.js` via `createGlobalStyle`. All components reference tokens via `var(--color-*)`, `var(--font-*)`, `var(--space-*)` etc.

Design direction:
- Dark luxury aesthetic - deep blacks, electric blue (`#adc6ff`) accent
- Typography: Space Grotesk (headlines) · Inter (body) · Berkeley Mono (cert IDs, grades, data)
- Cards: dark surface, large image, muted gold grade badge (`secondary-container`), cert ID in mono
- No 1px solid borders for layout - use background shifts. Ghost border (`outline-variant` at 15% opacity) only as fallback in dense data views.

## Gallery filter (public + admin)

Both the public gallery and admin overview/table view share the same filter+sort pattern. Two separate components with identical prop interfaces - `FilterBar.jsx` (public) and `AdminFilterBar.jsx` (admin) - styled differently but functionally the same.

### Architecture

All filtering and sorting is **client-side**. Items are fetched once (all of them), then filtered/sorted in memory via `useMemo`. No query reruns on filter change.

**URL persistence (public gallery only):** `Gallery.jsx` uses React Router `useSearchParams` as the single source of truth for all filter/sort/page/size state - there are no `useState` calls for these. URL param mapping: `q` (keyword search), `types` (comma-separated), `teams` (comma-separated), `certServices` (comma-separated), `grades` (comma-separated - numeric grade tokens or the literal `authentic`), `dupes` (`1` when the Dupes toggle is active, omitted otherwise), `sort`, `page`, `size`. Only non-default values appear in the URL (clean URLs when everything is default). Filter/sort/size changes use `replace: true` (no back-stack pollution); page changes push to history so back/forward works. Navigating to an item detail page and pressing Back restores the exact gallery state.

The admin filter pages (`Dashboard.jsx`, `ItemList.jsx`) still use plain `useState` - URL persistence is public-gallery-only.

Each page that uses a filter bar manages its own state and derives available options from the loaded items:

```
useItems() / raw query
  → items[]
    → availableTypes         (useMemo - distinct item_type values)
    → availableTeams         (useMemo - flattened team_slugs, Yankees pinned first)
    → availableCertServices  (useMemo - distinct cert_service values, sorted)
    → availableGrades        (useMemo - distinct gradeBucket(cert_grade) values, numeric ascending, 'authentic' last)
    → filtered               (items.filter - type AND team AND certService AND grade AND dupes AND keyword)
    → displayed              (filtered sorted by sortBy, or unsorted if sortBy is '')
    → paginated              (displayed.slice for current page)
```

### Current filter conditions

All conditions are AND - an item must pass every active condition to appear.

| Condition | State | Logic |
|---|---|---|
| Keyword search | `search: string` | `item.title.toLowerCase().includes(search)` |
| Item type | `activeTypes: string[]` | `activeTypes.length === 0 \|\| activeTypes.includes(item.item_type)` - multi-select OR |
| Team | `activeTeams: string[]` | `activeTeams.length === 0 \|\| item.team_slugs.some(s => activeTeams.includes(s))` - multi-select OR |
| Grade Type | `activeCertServices: string[]` | `activeCertServices.length === 0 \|\| (item.cert_service && activeCertServices.includes(item.cert_service))` - multi-select OR; items with no `cert_service` are excluded from options and never match |
| Grade | `activeGrades: string[]` | `activeGrades.length === 0 \|\| activeGrades.includes(gradeBucket(item.cert_grade))` - multi-select OR; `gradeBucket` (in `src/utils/gradeColors.js`) collapses numeric grades cross-service (PSA 8 and SGC 8 both bucket to `"8"`) and returns `null` for a missing `cert_grade`, so items with no cert never match the `authentic` bucket |
| Dupes | `showDupesOnly: boolean` | `!showDupesOnly \|\| item.is_duplicate === true` - single boolean toggle pill (not multi-select), backed by `item_gallery.is_duplicate` |

### Current sort options (`sortBy` state)

Sort is single-select (dropdown). One sort active at a time. Empty string = default order.

| Value | Behaviour |
|---|---|
| `''` | Default - order returned by DB |
| `'year_desc'` | `item.season_year` descending (newest first) |
| `'year_asc'` | `item.season_year` ascending (oldest first) |
| `'grade_desc'` | `gradeToNumber(cert_grade)` descending (highest grade first) |
| `'grade_asc'` | `gradeToNumber(cert_grade)` ascending (lowest grade first) |

`gradeToNumber` extracts the trailing number from PSA-style grade strings (`"NM-MT 8"` → 8, `"GEM MT 10"` → 10, `"Authentic"` → -1 sorts to the bottom).

**Grade display utilities** (`src/utils/gradeColors.js`):
- `gradeToNumber(grade)` - extract numeric value for sorting/coloring
- `gradeBucket(grade)` - collapse to filter bucket (`'8'`, `'authentic'`, or `null`)
- `gradeColors(grade)` - return `{ $bg, $fg }` green-tier colors
- `displayGrade(grade)` - human-readable label. Always use this when rendering raw grade strings from the DB. PSA grade codes are kept as-is (`AA` stays `AA` - it means Authentic Altered). Only standalone `Authentic`/`Auth`/`AUTH` is shortened to `Auth`. Everything else passes through unchanged.

**Combined grade display (autographed items):** When an item has both `cert_grade` (item/authenticity grade) and `auto_grade` (signature grade), display as `[displayGrade(cert_grade)] / Auto [displayGrade(auto_grade)]` - e.g. `Auth Alt / Auto NM-MT 8`. For color-coding, prefer `auto_grade` when both exist (it's the numeric one).

### Active filter pills

Active conditions render as removable pills **inside the search bar**. Each pill has a label and an `onRemove` callback. The `activePills` array in each filter component aggregates them:

```js
const activePills = [
  ...activeTypes.map(t => ({ key: `type:${t}`, label, onRemove })),
  ...activeTeams.map(t => ({ key: `team:${t}`, label, onRemove })),
  ...activeCertServices.map(cs => ({ key: `certService:${cs}`, label: cs, onRemove })),
  ...activeGrades.map(g => ({ key: `grade:${g}`, label: formatGradeLabel(g), onRemove })),
  ...(showDupesOnly ? [{ key: 'dupes', label: 'Dupes', onRemove: onDupesToggle }] : []),
  ...(sortBy ? [{ key: 'sort', label: SORT_LABELS[sortBy], onRemove }] : []),
]
```

Grade Type pills use the raw `cert_service` string as their label (no `formatSlug` - it would mangle `PSA/DNA`). Grade pills use `formatGradeLabel` - the bucket value itself (e.g. `"8"`) or `"Authentic"` for the `authentic` bucket. The Dupes pill has a fixed label (`'Dupes'`) since it's a single boolean toggle, not a per-value list.

### Accordion sections

The "Advanced Search" accordion contains sections in order: **Item Type** → **Special Filters** (Dupes toggle) → **Teams** → **Grade Type** → **Grade** → **Sort**. Teams, Grade Type, and Grade sections only render when their `availableX.length > 0`; Special Filters and Sort always render.

### Collapsible pill sections

Every multi-value pill-based section (Item Type, Teams, Grade Type, Grade) is independently collapsible. Local `expandedSections` state (`useState({})`, keyed by section name - `type`, `team`, `certService`, `grade`) tracks which sections are expanded; `toggleSection(key)` flips one entry. The Special Filters section (Dupes) is a single always-visible toggle pill, so it isn't part of the collapse/expand system.

- **Collapsed** (default): pills render in a single non-wrapping row (`flex-wrap: nowrap`, fixed 2rem height, `overflow: hidden`) - pills are non-shrinking so long labels clip via the row's overflow instead of squeezing every pill onto two lines.
- **Expanded**: the row wraps (`flex-wrap: wrap`, `height: auto`) and grows downward, pushing the rest of the accordion body down rather than overlapping it.
- An `ExpandCaret` button (rotates 180° when expanded) sits at the end of each row and toggles that section only - sections expand/collapse independently of each other.

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

availableCertServices  string[]     distinct cert_service values from loaded items, sorted
activeCertServices     string[]     currently selected cert services
onCertServiceToggle    (certService) => void
onCertServiceClear     () => void

availableGrades  string[]     distinct gradeBucket(cert_grade) values, numeric ascending then 'authentic'
activeGrades     string[]     currently selected grade buckets
onGradeToggle    (grade) => void
onGradeClear     () => void

showDupesOnly   boolean      whether the Dupes toggle is active
onDupesToggle   () => void

sortBy          string       '' | 'year_desc' | 'year_asc' | 'grade_desc' | 'grade_asc'
onSortChange    (val) => void

search          string
onSearchChange  (val) => void
```

### How to add a new filter condition

1. **Verify the field is in `item_gallery`** - if not, write a migration to add it to the view (see migrations 0017-0020 as examples).
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
6. **Add a section** to the accordion body in both filter components, following the existing `FilterSection` → `PillsRow`/`Pills`/`ExpandCaret` pattern (see "Collapsible pill sections" above) with a new key in `expandedSections`.
7. **Pass the new props** to both filter components from all three pages.
8. **For sorts**: add a new `<option>` to the Sort dropdown and a new branch in the `displayed` sort useMemo in each page.

## Teams system

MLB teams are stored in the `teams` table (`id`, `name`, `slug`, `abbreviation`). Items are linked via the `item_teams` junction table (many-to-many - one item can be associated with multiple teams).

**Auto-population:** when an item with game context is saved in `ItemViewerModal`, `syncItemTeams` runs automatically - it matches `game_context.home_team` and `game_context.away_team` abbreviations against `teams.abbreviation`, deletes existing `item_teams` for that item, and inserts new rows for any matches. This means saving a Yankees vs. Red Sox ticket auto-tags that item with both teams.

The `item_gallery` view aggregates team slugs as `team_slugs text[]`, analogous to `tag_slugs`.

## Tags - pre-seeded categories

Attribute tags: `autographed`, `game-used`, `world-series`, `clinch-game`, `rookie-card`, `team-signed`, `proof-card`

Era tags: `pre-1920`, `1920s`, `1930s`, `1940s`, `1950s`, `1960s`, `modern`

Item type tags (legacy - `item_type` column is now the primary way to categorize): `ticket-stub`, `full-ticket`, `card`, `baseball`, `bat`, `jersey`, `photo`, `magazine`, `program`, `book`, `base`, `glove`

## Public site display rules

- **No prices on public site** - acquisition cost / price is hidden from the gallery cards and item detail page. Price data remains in the DB and is visible in admin only.
- **Cert ID hyperlinks** - on the item detail page, cert IDs link to the verification URL (`cert_link`) when available. Supported services: PSA, PSA/DNA, JSA (auto-generated via `CERT_LINK_BUILDERS` in `CertForm.jsx`).
- **Single-image items** - item detail shows a plain image (no carousel) when only one image exists. Carousel only renders for 2+ images.
- **Page size selector** - gallery has a dropdown to show 16, 32, or 64 items per page.
- **Scroll-to-top** - gallery scrolls to top on page change; item detail scrolls to top on load.
- **Box score** - if a game context has `box_score` data, a linescore table (inning-by-inning + R/H/E) renders on both the public item detail page and admin modal. Shared component: `src/components/BoxScoreDisplay.jsx`.
- **Series tickets accordion** — if a ticket or ticket_sheet item has a non-null `series_game_number` and a `season_year`, a collapsible carousel section renders below the PSA population block (public) and as a section in the admin modal, showing all other tickets/sheets from the same World Series year sorted by `series_game_number` ascending. Header label: `"{year} World Series Tickets"`. Component: `src/components/SeriesTicketsAccordion.jsx`, hook: `src/hooks/useSeriesTickets.js`. Supports `onItemClick` prop for in-modal navigation (admin). Condition: `['ticket', 'ticket_sheet'].includes(item.item_type) && item.season_year && item.series_game_number != null`. Note: `series_game_number` lives on `item` (from `item_gallery`), NOT on `detail`.
- **Ticket sheet game accordion** — `ticket_sheet` items render a `TicketSheetDisplay` component (`src/components/itemDetail/TicketSheetDisplay.jsx`) that shows an accordion with one panel per game on the sheet. Each panel header shows game label, date, and score summary. Expanding a panel reveals box score tables, player box scores (batting + pitching), and game notes. Phantom games show only the notes. Data fetched via `useTicketSheetGames` hook (`src/hooks/useTicketSheetGames.js`). Admin side uses `TicketSheetGamesSection` (`src/components/admin/TicketSheetGamesSection.jsx`) for CRUD on linked game contexts.
- **Set members accordion** - if an item has a `set_id`, an accordion renders at the bottom of the detail column (public) and as a "Set Members" section in the admin modal. Opening it fetches and displays a horizontal-scroll carousel of all other items in the same set. Shared component: `src/components/SetMembersAccordion.jsx`, data hook: `src/hooks/useSetMembers.js`. Condition is `item.set_id` only - `is_part_of_set` is not checked, so master set items (which have `set_id` but `is_part_of_set = false`) also show the carousel. In admin, clicking a carousel card switches the modal to that item via `onOpenItem` prop.
- **Legendary items** - items with `is_legendary = true` receive special display on the Yankees Museum Timeline. The card is centered on the axis (not above/below), fills ~90% of the track height, shows `legendary_context.event_title` above the image (when set), and renders with a pulsing blue glow border + two `EmberEffect` layers (one behind the card with wide spread, one in front with tighter spread). Neighboring timeline stops drift 30px outward when the legendary item is centered, then return smoothly. Legendary context (event title, event description, contextual images) is stored in `legendary_context` and `legendary_images` tables. `item_gallery` exposes `legendary_event_title` directly so no extra fetch is needed on the timeline. In the admin modal, toggling `is_legendary` reveals a "Legendary Context" section for editing. Full context data (including images) is fetched via `useItem`.

## Multi-signer display rule

On gallery cards: show the `is_featured = true` signatory name prominently. If there are additional signers, show "+ N others" that expands inline. Never show a raw comma-separated string.

## PSA population display

Always read from the `latest_population` view, not `population_snapshots` directly. Display Higher / Same / Lower as a minimal data table with monospace numbers. Only show population data if a PSA or PSA/DNA cert exists for the item.

## Images (Cloudinary)

All item images are stored as full Cloudinary secure URLs in `images.cloudinary_url`. The `item_gallery` view surfaces the primary image as `primary_image_url`.

**EXIF orientation**: Phone photos often have landscape raw pixels with an EXIF orientation tag (e.g. `Rotate 90 CW`) that tells browsers to display them as portrait. Cloudinary may strip this tag when converting formats on CDN delivery, causing images to render sideways. Fix: always pass Cloudinary `src` values through `withAutoOrient()` from `src/lib/cloudinary.js`. This inserts `a_exif/` into the URL so Cloudinary bakes the rotation into the served image (no-op if no EXIF rotation is present).

```js
import { withAutoOrient } from '../lib/cloudinary'
<img src={withAutoOrient(item.primary_image_url)} />
```

Apply `withAutoOrient` everywhere a raw `cloudinary_url` or `primary_image_url` is used as an `<img src>`.

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

- No e-commerce / Stripe - inquiries only
- No user accounts for visitors - public site is fully open
- No server-side rendering - pure Vite SPA
- No Next.js - Vite only
- No Prisma or other ORM - Supabase JS client only
- No Redux - React Query or plain hooks for data fetching
- No separate backend server - Supabase Edge Functions only
- Inquiries ARE stored in the `inquiries` table AND emailed via Edge Function

## Code style preferences

- Functional components only, no class components
- Named exports preferred over default exports (except pages)
- Keep components focused - if a component exceeds ~150 lines, split it
