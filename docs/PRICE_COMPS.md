# Price Comps (Want List page)

Admin-only section at the bottom of `/admin/want-list`. It tracks auction lots **only to learn their verified closing price** for items similar to ones already in the collection. These lots are not purchase targets. They are kept separate from the Want List table above, and they don't count toward its lot or must-have totals.

## Privacy

The Want List rows come from `src/data/wantlist.json`. That file is bundled into the static JS, so anyone can read it. Comps hold private pricing research, so they live in Supabase instead:

- Table `public.auction_price_comps` (migration `0041_auction_price_comps.sql`).
- RLS policies exist only for `authenticated` (Clerk JWT through third-party auth) and `service_role`. All privileges are revoked from `anon` and `PUBLIC`.
- The table isn't joined into `item_gallery` or any other public view, and it must never be shown on the public site.
- The browser reads and writes it only through `useSupabaseClient()` (in `src/hooks/useAuctionPriceComps.js`).

## Pending vs verified

| State | Condition | Shown as |
|---|---|---|
| Pending | `final_price IS NULL` | Blue "Pending" badge with "Final price: Not yet verified" |
| Verified | `final_price IS NOT NULL` (the DB also requires `verified_at` and `result_url`) | Gold "Verified" badge, the amount, a price-basis badge, a link to the results source, and when it was verified |

Rules (enforced in the UI, and in the DB where possible):

- A current bid, estimate, or opening bid is **never** recorded as `final_price`. The scheduled close time is never treated as the final close either, because extended bidding can run past it.
- "Record result" stays disabled until `scheduled_close_at` has passed. The DB CHECK also requires `verified_at >= scheduled_close_at`.
- Recording a result requires an https result URL, a price basis, and a checkbox confirming it's the final realized price.
- `price_basis` can be `hammer` (excludes buyer's premium), `buyer_premium_inclusive`, or `unknown`. `unknown` gets a warning-tone badge.
- "Correct result" overwrites the price, basis, source, and notes, and stamps a new `verified_at`. Updates are guarded by the loaded `updated_at`, so a stale tab can't overwrite a newer result.

## Adding comps

**Add comp** needs an auction house, a lot URL (https), a title, and the owned item it's a comp for. Auction name, lot number, scheduled close (local time + zone → UTC), and notes are optional. No price is entered when you add a comp. The owned-item picker loads every item, including hidden ones. The owned-item link opens that item's modal through `/admin/dashboard?item=<id>`.

## Seed

Migration 0041 seeds two **pending** Leland's comps (2026 Fall Classic). Both are linked to the owned 1949 Bowman #224 Satchel Paige (`de385e68-0558-561d-b61d-bca5c76498e0`):

| Lot | Leland's item id | Card |
|---|---|---|
| 120 | 138632 | 1949 Bowman #224 Satchel Paige PSA 8 (OC) |
| 119 | 139902 | 1949 Bowman #224 Satchel Paige PSA 4 |

Scheduled initial close: `2026-12-06T03:00:00Z` (Dec 5, 10:00 PM ET). Extended bidding is possible. No final prices are seeded. Re-running the migration never overwrites a recorded result (`ON CONFLICT (source_url) DO NOTHING`). It also inserts nothing if the owned item doesn't exist.

## Files

| Concern | File |
|---|---|
| Migration (table, RLS, seed) | `supabase/migrations/0041_auction_price_comps.sql` |
| Data hook | `src/hooks/useAuctionPriceComps.js` |
| Helpers | `src/lib/priceComps.js` |
| UI | `src/components/admin/priceComps/` (`PriceCompsSection`, `PriceCompCard`, `CompFinalPrice`, `RecordResultForm`, `AddCompForm`) |
| Page | `src/pages/admin/WantList.jsx` (renders `<PriceCompsSection />` below the want-list table) |
