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

Entry point: `index.html` → `src/main.jsx` → `src/App.jsx`

## What this project is

A private baseball memorabilia collection showcase website for a single client. The public site lets visitors browse the collection and submit inquiries via a contact form. An admin panel at `/admin` lets the client manage his collection, edit items, upload images, and trigger PSA population data syncs.

## Core features of the app would be: 

- Gallery viewing for outside users.
- Inquiry via simplt contact form sent to an email
- Admin dashboard only accessable via Clerk's auth for the website owner.
    - **Overview (`/admin/dashboard`)** — stats cards (total items, total cost) + a filterable/searchable table of ALL items showing photo + minimal info (title, grade, for-sale status). Each row links to the item viewer. Market value stat is a future feature (requires scraping).
    - **Table View (`/admin/items`)** — no images, shows every field as raw data (title, acquisition cost, price, for_sale, game_date, grade, cert_id, cert_service, condition, notes, created_at). Think spreadsheet. Sortable columns, search/filter bar.
    - **Item Viewer (`/admin/items/:id`)** — read-only display of all data for a single item (every field, all certs, all signatories, all images with Cloudinary IDs). Has an "Edit" button that switches the page into inline edit mode. This is the default destination when clicking an item from Overview or Table View.
    - **Item Editor (`/admin/items/new`)** — blank create form for adding a new item.

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

## Build Todo

See `docs/TODO.md` for the full ordered task list. When completing each task on the todo check it off. When each todo is complete commit to git. ***DO NOT PUSH TO REMOTE REPO*** I will do that.

## File System

File system go to docs/FILESYSTEM.md

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
/admin/items/new     → ItemEditor (create mode — blank form)
/admin/items/:id    → ItemViewer (read-only by default; "Edit" button switches to inline edit mode)
/admin/psa-sync      → PsaSync
```

## Auth rules

- Clerk protects ALL routes under `/admin/*`
- A single `<AdminGuard>` component wraps the admin router — if not signed in, redirect to Clerk hosted login
- The public site has absolutely zero authentication — no login, no tokens, nothing
- Never use the Supabase service role key on the public site — anon key only
- The admin site may use the service role key server-side via Edge Functions only — never expose it in the browser

## Databse 

For all things database and image retrievel check docs/DATABSE.md

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

## Tags — pre-seeded categories

Item type tags: `ticket-stub`, `full-ticket`, `card`, `baseball`, `bat`, `jersey`, `photo`, `magazine`, `program`, `book`, `base`, `glove`

Attribute tags: `autographed`, `game-used`, `world-series`, `clinch-game`, `rookie-card`, `team-signed`, `proof-card`

Era tags: `pre-1920`, `1920s`, `1930s`, `1940s`, `1950s`, `1960s`, `modern`

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