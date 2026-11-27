```
src/
├── pages/
│   ├── public/
│   │   ├── Gallery.jsx         # Main collection grid
│   │   ├── ItemDetail.jsx      # Single item page
│   │   ├── Timeline.jsx        # Yankees Museum (/museum) — horizontal decade timeline (vertical on mobile); legendary items render centered full-height with ember effects + push-away neighbors
│   │   └── Contact.jsx         # Contact form
│   └── admin/
│       ├── Dashboard.jsx
│       ├── ItemList.jsx
│       ├── PsaSync.jsx         # Manual PSA refresh trigger
│       ├── GalleryOrder.jsx    # Drag-and-drop gallery curation — pin + reorder items
│       ├── WantList.jsx        # Want List (/admin/want-list) — static purchase want list (src/data/wantlist.json) + separate private Price Comps section
│       └── AuctionWatchlist.jsx # Private auction watchlist (/admin/auction-watchlist) — lots grouped by auction, live/manual bids, countdowns, add/remove (see docs/AUCTION_WATCHLIST.md)
├── components/
│   ├── ImageLightbox.jsx        # Shared fullscreen lightbox with rotate controls
│   ├── BoxScoreDisplay.jsx      # Shared baseball linescore table (public + admin)
│   ├── SetMembersAccordion.jsx  # Accordion + horizontal carousel for items in same set (public + admin)
│   ├── layout/
│   │   ├── Header.jsx           # Fixed public nav — desktop links + mobile burger drawer (right-aligned)
│   │   ├── Footer.jsx
│   │   └── Layout.jsx           # Public layout shell: Header + Outlet + Footer
│   ├── public/
│   │   ├── ItemCard.jsx
│   │   ├── ItemViewerModal.jsx  # Read-only item modal for Museum/Timeline page — glass card overlay, image + details side-by-side (desktop) or stacked (mobile), grade/pop/cert stats grid, signatories, type details, lightbox, "View Full Details" link to /item/:id
│   │   ├── SeriesTicketsAccordion.jsx # Accordion + carousel of other tickets from the same World Series year — shown on ticket detail pages (public + admin modal) that have a series_game_number. Supports optional onItemClick prop for in-modal navigation (admin). Uses useSeriesTickets hook.
│   │   ├── FilterBar.jsx       # Advanced search: keyword + multi-select type/team/certService/grade pills in a collapsible accordion (each pill section expands/collapses independently)
│   │   ├── SignatoryList.jsx
│   │   ├── DuplicateCopiesSection.jsx # Accordion listing an item's linked duplicates (public item detail)
│   │   ├── WorldSeriesStop.jsx  # Museum timeline stop (desktop) + mobile card for a COMPLETE Yankees World Series — gold card with ticket fan
│   │   ├── WorldSeriesFan.jsx   # Fanned collage of real ticket images (one tile per game; a multi-game sheet appears once)
│   │   ├── WorldSeriesModal.jsx # Accessible dialog: each game of a complete series with its ticket/sheet items → opens ItemViewerModal
│   │   └── EmberEffect.jsx     # Particle ember effect for legendary timeline cards — props: height, intensity, zIndex, spread
│   ├── itemDetail/             # Public item detail display components
│   │   ├── styles.js           # Shared styled components + formatters
│   │   ├── ItemTypeDetails.jsx # Dispatcher — picks correct type display
│   │   ├── GameContextDisplay.jsx
│   │   ├── TicketDisplay.jsx
│   │   ├── CardDisplay.jsx
│   │   ├── BaseballDisplay.jsx
│   │   ├── BatDisplay.jsx
│   │   ├── JerseyDisplay.jsx
│   │   ├── PhotoDisplay.jsx
│   │   ├── MagazineDisplay.jsx
│   │   ├── ProgramDisplay.jsx
│   │   ├── BookDisplay.jsx
│   │   ├── BaseDisplay.jsx
│   │   ├── GloveDisplay.jsx
│   │   ├── MiscellaneousDisplay.jsx
│   │   └── StadiumGiveawayDisplay.jsx
│   └── admin/
│       ├── AdminGuard.jsx      # Clerk auth wrapper for /admin/* routes
│       ├── AdminLayout.jsx     # Sidebar nav + top bar + create modal
│       ├── AdminFilterBar.jsx  # Admin advanced search: keyword + multi-select type/team/certService/grade pills in a collapsible accordion (each pill section expands/collapses independently)
│       ├── ItemViewerModal.jsx # Modal: view/edit existing items + create new items
│       ├── WsGameSlotsByYear.jsx # Dashboard WS Ticket Quest "By Game" tier — wrapping year groups; hover/focus/tap opens WsYearDetailPanel (hover bridge, click pin, Esc/outside/close button)
│       ├── WsYearDetailPanel.jsx # Portalled, viewport-clamped, scrollable year panel — owned games with ticket/sheet images + Missing games
│       ├── WsQuestItemCard.jsx   # Item card in the year panel (primary image via withAutoOrient, no-image/lookup-failure fallbacks, opens ItemViewerModal)
│       ├── PrivateNotesSection.jsx # Admin-only Private notes (item_private_notes) — own load/save via Clerk-authenticated client
│       ├── DuplicatesSection.jsx # Collapsible section — link/unlink duplicate items, edit notes, auto-syncs is_duplicate
│       ├── ImageUploader.jsx   # Cloudinary image upload widget (product shots)
│       ├── LoaUploader.jsx     # LOA upload widget — images + PDFs, multiple per item
│       ├── CertForm.jsx
│       ├── SignatoryForm.jsx
│       ├── FormFields.jsx      # Shared styled form components
│       ├── GameContextFields.jsx # Game context sub-form (shared by 8 item types)
│       ├── GameLookupToolbar.jsx # MLB game lookup — inline search toolbar
│       ├── GameLookupResults.jsx # MLB lookup results list with clickable game cards
│       ├── TeamSelect.jsx       # Searchable MLB team dropdown (current + historical)
│       ├── priceComps/         # Want List Price Comps (private, auction_price_comps): PriceCompsSection, PriceCompCard, CompFinalPrice, RecordResultForm, AddCompForm
│       ├── watchlist/          # Auction watchlist UI: AuctionGroup, WatchlistLotCard, LotPrice, LotClosing, ManualPriceForm, AddLotForm, WatchlistToolbar, WsOpportunitiesPanel + WsOpportunityGame (missing WS ticket matches), styles.js
│       └── itemTypes/          # Type-specific field components
│           ├── index.js        # Registry mapping type → component
│           ├── TicketFields.jsx
│           ├── CardFields.jsx
│           ├── BaseballFields.jsx
│           ├── BatFields.jsx
│           ├── JerseyFields.jsx
│           ├── PhotoFields.jsx
│           ├── MagazineFields.jsx
│           ├── ProgramFields.jsx
│           ├── BookFields.jsx
│           ├── BaseFields.jsx
│           ├── GloveFields.jsx
│           ├── MiscellaneousFields.jsx
│           └── StadiumGiveawayFields.jsx
├── lib/
│   ├── supabase.js             # Supabase client (anon key)
│   ├── cloudinary.js           # Cloudinary helpers
│   ├── itemTypeConfig.js       # Item type metadata, empty forms, serialization
│   ├── auctionWatchlist.js     # Watchlist house registry, strict lot-URL allow-list validation, time-zone/countdown/price formatting
│   ├── priceComps.js           # Price comp helpers: price-basis labels, verified/pending, https URL + dollar validation, sort
│   ├── wsTicketOpportunities.js # Pure lot-title → World Series year/game matcher + cross-reference with sheet "Don't Have" games
│   ├── worldSeries.js          # Yankees WS completion: YANKEES_WS_GAMES, fetch ticket/sheet links, buildYankeesWsSeries (shared by Museum + admin Dashboard)
│   └── mlbApi.js               # MLB Stats API client — team data, fetch, game parsing
├── hooks/
│   ├── useItems.js             # Queries item_gallery view + item_order; merges into pinned-first sort
│   ├── useItem.js              # Single item with certs, sigs, images, type detail, game context, legendary context + images
│   ├── useSetMembers.js        # Fetches sibling items by set_id from item_gallery + set name from sets table
│   ├── useSeriesTickets.js     # Fetches other tickets from the same World Series year (item_type=ticket, same season_year, non-null series_game_number)
│   ├── useWorldSeriesTicketLinks.js # Loads WS ticket + non-phantom sheet game links (feed into buildYankeesWsSeries)
│   ├── useItemDuplicates.js    # Fetches item_duplicates links (both directions) + add/remove/notes mutations
│   ├── useSupabaseClient.js    # Supabase client that sends the Clerk session JWT (RLS role = authenticated)
│   ├── useItemPrivateNotes.js  # Load/save item_private_notes (Clerk-authenticated client, updated_at conflict guard)
│   ├── useAuctionWatchlist.js  # Watchlist CRUD + manual price + Edge Function refresh (Clerk-authenticated client)
│   ├── useAuctionPriceComps.js # Price comps load/add/update (updated_at guard)/remove + owned-item picker options (Clerk-authenticated client)
│   ├── useWsQuestItems.js      # WS Ticket Quest item titles/images: reuses gallery items, fetches only non-gallery (hidden) linked IDs via the Clerk-auth client
│   ├── useWsTicketTracker.js   # Reads WS Ticket Tracker "Don't Have" games via the ws-ticket-tracker Edge Function
│   ├── useTags.js
│   └── useTeams.js             # Fetches all teams from the teams table
├── utils/
│   └── gradeColors.js          # Grade display utilities:
│                               #   gradeToNumber(grade) → float | -1
│                               #   gradeBucket(grade) → 'authentic' | '8' | null  (for filter bucketing)
│                               #   gradeColors(grade) → { $bg, $fg }  (green tier colors by numeric grade)
│                               #   displayGrade(grade) → human label  ('AA'→'Auth Alt', 'Authentic'→'Auth', else passthrough)
├── styles/
│   └── GlobalStyles.js         # Design tokens + global CSS
└── main.jsx                    # React Router + Clerk provider setup
```

Outside `src/` (watchlist-related):

```
supabase/functions/auction-watchlist-refresh/
├── index.ts     # Edge Function: auth, per-house adapters (direct REA/H&S, Firecrawl Grey Flannel/Love of the Game/Leland's/Heritage), rate limits, DB writes
└── parsers.ts   # Pure Firecrawl-markdown parsers (shared CreateAuction parser for Grey Flannel/Love of the Game/Leland's) + Heritage URL validation (no Deno APIs; also run under Node)
supabase/functions/ws-ticket-tracker/
├── index.ts     # Edge Function: caller-JWT check via PostgREST, Google service-account token, bounded Sheet1!A1:C1000 read, returns only Don't Have {year, game, row}
└── sheet.ts     # Pure sheet-values parser (no Deno APIs; also run under Node)
scripts/
└── check-watchlist-parsers.mjs  # node scripts/check-watchlist-parsers.mjs — parser checks: inline fixtures (Grey Flannel, Love of the Game, Leland's, Heritage) + client URL parsing + optional saved Firecrawl JSON samples (not committed)
└── check-ws-ticket-matcher.mjs  # node scripts/check-ws-ticket-matcher.mjs — sheet parser + lot-title matcher + cross-reference checks (inline fixtures)
```
