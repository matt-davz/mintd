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
│       ├── ItemEditor.jsx      # Create + edit items
│       └── PsaSync.jsx         # Manual PSA refresh trigger
├── components/
│   ├── public/
│   │   ├── ItemCard.jsx
│   │   ├── FilterBar.jsx
│   │   └── SignatoryList.jsx
│   └── admin/
│       ├── AdminGuard.jsx      # Clerk auth wrapper for /admin/* routes
│       ├── ImageUploader.jsx   # Cloudinary upload widget
│       ├── CertForm.jsx
│       └── SignatoryForm.jsx
├── lib/
│   ├── supabase.js             # Supabase client (anon key)
│   └── cloudinary.js           # Cloudinary helpers
├── hooks/
│   ├── useItems.js
│   ├── useItem.js
│   └── useTags.js
└── main.jsx                    # React Router + Clerk provider setup
```
