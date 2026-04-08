```
src/
├── pages/
│   ├── public/
│   │   ├── Gallery.jsx         # Main collection grid
│   │   ├── ItemDetail.jsx      # Single item page
│   │   └── Contact.jsx         # Contact form
│   └── admin/
│       ├── Dashboard.jsx
│       ├── ItemList.jsx
│       └── PsaSync.jsx         # Manual PSA refresh trigger
├── components/
│   ├── public/
│   │   ├── ItemCard.jsx
│   │   ├── FilterBar.jsx       # Item type pill filters + search
│   │   └── SignatoryList.jsx
│   └── admin/
│       ├── AdminGuard.jsx      # Clerk auth wrapper for /admin/* routes
│       ├── AdminLayout.jsx     # Sidebar nav + top bar + create modal
│       ├── ItemViewerModal.jsx # Modal: view/edit existing items + create new items
│       ├── ImageUploader.jsx   # Cloudinary upload widget
│       ├── CertForm.jsx
│       ├── SignatoryForm.jsx
│       ├── FormFields.jsx      # Shared styled form components
│       ├── GameContextFields.jsx # Game context sub-form (shared by 8 item types)
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
│           └── GloveFields.jsx
├── lib/
│   ├── supabase.js             # Supabase client (anon key)
│   ├── cloudinary.js           # Cloudinary helpers
│   └── itemTypeConfig.js       # Item type metadata, empty forms, serialization
├── hooks/
│   ├── useItems.js             # Queries item_gallery view
│   ├── useItem.js              # Single item with certs, sigs, images
│   └── useTags.js
├── styles/
│   └── GlobalStyles.js         # Design tokens + global CSS
└── main.jsx                    # React Router + Clerk provider setup
```
