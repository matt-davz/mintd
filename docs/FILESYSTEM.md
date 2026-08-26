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
│       └── GalleryOrder.jsx    # Drag-and-drop gallery curation — pin + reorder items
├── components/
│   ├── ImageLightbox.jsx        # Shared fullscreen lightbox with rotate controls
│   ├── BoxScoreDisplay.jsx      # Shared baseball linescore table (public + admin)
│   ├── SetMembersAccordion.jsx  # Accordion + horizontal carousel for items in same set (public + admin)
│   ├── layout/
│   │   ├── Header.jsx           # Fixed nav — public links (Gallery/Museum/Contact) + admin links (Overview/Table View/Gallery Order/PSA Sync) + Add Asset button + Sign Out when Clerk session is active. Mobile burger drawer mirrors same items.
│   │   ├── Footer.jsx
│   │   └── Layout.jsx           # Shared layout shell (public + admin): Header + Outlet + Footer
│   ├── public/
│   │   ├── ItemCard.jsx
│   │   ├── ItemViewerModal.jsx  # Read-only item modal for Museum/Timeline page — glass card overlay, image + details side-by-side (desktop) or stacked (mobile), grade/pop/cert stats grid, signatories, type details, lightbox, "View Full Details" link to /item/:id
│   │   ├── SeriesTicketsAccordion.jsx # Accordion + carousel of other tickets from the same World Series year — shown on ticket detail pages (public + admin modal) that have a series_game_number. Supports optional onItemClick prop for in-modal navigation (admin). Uses useSeriesTickets hook.
│   │   ├── FilterBar.jsx       # Advanced search: keyword + multi-select type/team/certService/grade pills in a collapsible accordion (each pill section expands/collapses independently)
│   │   ├── SignatoryList.jsx
│   │   ├── DuplicateCopiesSection.jsx # Accordion listing an item's linked duplicates (public item detail)
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
│       ├── AdminFilterBar.jsx  # Admin advanced search: keyword + multi-select type/team/certService/grade pills in a collapsible accordion (each pill section expands/collapses independently)
│       ├── ItemViewerModal.jsx # Modal: view/edit existing items + create new items
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
│   └── mlbApi.js               # MLB Stats API client — team data, fetch, game parsing
├── hooks/
│   ├── useItems.js             # Queries item_gallery view + item_order; merges into pinned-first sort
│   ├── useItem.js              # Single item with certs, sigs, images, type detail, game context, legendary context + images
│   ├── useSetMembers.js        # Fetches sibling items by set_id from item_gallery + set name from sets table
│   ├── useSeriesTickets.js     # Fetches other tickets from the same World Series year (item_type=ticket, same season_year, non-null series_game_number)
│   ├── useItemDuplicates.js    # Fetches item_duplicates links (both directions) + add/remove/notes mutations
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
