# Auction Watchlist (`/admin/auction-watchlist`)

A private, signed-in watchlist of lots across upcoming auctions. It shows current bid, time left, and close time in one place, so Zane doesn't have to switch between auction sites.

**This is private bidding intent.** The data lives only in `public.auction_watchlist_lots`. That table can't be read by `anon` (no RLS policy, table privileges revoked) and isn't joined into any public view. The page sits under `AdminGuard`, so any Clerk signed-in user can see it.

## Pieces

| Piece | Path |
|---|---|
| Migration (table, RLS, seed of Zane's 24 lots) | `supabase/migrations/0039_auction_watchlist.sql` |
| Edge Function (server-side price refresh) | `supabase/functions/auction-watchlist-refresh/index.ts` |
| Page | `src/pages/admin/AuctionWatchlist.jsx` |
| Components | `src/components/admin/watchlist/` (`AuctionGroup`, `WatchlistLotCard`, `LotPrice`, `LotClosing`, `ManualPriceForm`, `AddLotForm`, `WatchlistToolbar`, `styles.js`) |
| Data hook | `src/hooks/useAuctionWatchlist.js` (uses `useSupabaseClient`, the Clerk JWT client) |
| Helpers (house registry, URL validation, time/price formatting) | `src/lib/auctionWatchlist.js` |

## Supported auction houses

| House | `house` key | Live refresh | Notes |
|---|---|---|---|
| Robert Edward Auctions | `rea` | ✅ | `bid.collectrea.com/lots/{id}` |
| Huggins & Scott | `huggins_scott` | ✅ | `bid.hugginsandscott.com/lots/{id}` |
| Grey Flannel | `grey_flannel` | ❌ manual | Server fetches get a Cloudflare challenge (HTTP 403) |
| Heritage | `heritage` | ❌ manual | Server fetches get a DataDome captcha (HTTP 403). `lot_id` = `<saleNo>-<lotNo>` |

REA and H&S run the same Livewire platform. The function parses each lot page for:
- `currentBid` from the `lots.lot-bidding` `wire:snapshot`, falling back to the `x-data` `currentBid:` value
- `endTime`, `status`, and `auctionPeriod` from the lot's `miniCountdown({...})`
- the first `{lotId}-1.jpg` image on the house's own Cloudinary account
- title and lot number from `<h1>Lot # N: …</h1>`, filled in only when missing

We don't try to get past the Grey Flannel and Heritage bot walls. Their lots show the last manual price (labeled **Manual**) or **Unavailable**, plus a direct link to the lot page.

## Honesty rules

- `current_bid` is written only after a fresh 200 response that parsed cleanly (`bid_source = 'live'`), or after an explicit manual entry (`bid_source = 'manual'`). A DB constraint requires `bid_checked_at` and `bid_source` whenever `current_bid` is set.
- A failed refresh keeps the last verified price and records `refresh_status` (`blocked` / `error`) and `last_error`.
- The seed sets no prices. Every lot shows **Unavailable** until the first refresh.
- Stale readings are flagged: older than 60 min, or older than 15 min once the lot is within 24 h of its scheduled close.
- Countdowns are to the **scheduled** close. REA and H&S are labeled "Until extended bidding". Other houses are labeled "Extended bidding may apply". After the scheduled time the UI says "May still be in extended bidding". It says closed only if the last refresh reported `lot_status = 'closed'`.

## Security

- **SSRF:** the function never fetches a URL from the table or the request. It builds the URL from `(house, lot_id)` with a fixed https host, and `lot_id` must be all digits. Redirects are not followed (`redirect: 'manual'`). Bodies are capped at 2 MB, and each request times out after 12 s. Client-side `parseLotUrl()` and the table's CHECK constraints pin the same hosts and URL shapes.
- **Auth:** the function rejects requests without a non-expired `role: authenticated` bearer token. It then runs all reads and writes through PostgREST **as the caller**, using the anon key plus the caller's Clerk JWT, so RLS applies. PostgREST verifies the token signature through the Clerk third-party auth integration. **The service role key is not used.**
- **Rate limiting:** a lot is fetched at most once every 10 minutes, tracked in `refresh_attempted_at`. Concurrency is 3 and each call handles at most 60 lots. The page auto-refreshes once per visit, and only when some live lot is due.

## Setup / deployment

Nothing here has been applied or deployed yet.

1. **Clerk ↔ Supabase third-party auth must be working.** `useSupabaseClient` sends `getToken({ template: 'supabase' })`. Supabase must trust Clerk (Dashboard → Authentication → Third-party auth → Clerk), and the token must carry `"role": "authenticated"`. If the `supabase` JWT template doesn't exist in Clerk, create it, or switch the hook to Clerk's native Supabase integration. Until this works, the page shows "Couldn't load the watchlist".
2. **Apply the migration:**
   ```bash
   supabase db push            # or run 0039_auction_watchlist.sql in the SQL editor
   ```
   It is idempotent. Re-running it re-inserts any seeded lot that was removed in the UI.
3. **Deploy the Edge Function with gateway JWT verification off.** The function verifies the token itself through PostgREST, and the gateway's legacy check rejects Clerk tokens:
   ```bash
   supabase functions deploy auction-watchlist-refresh --no-verify-jwt
   ```
   `SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected automatically. No other secrets are needed.
4. *(Optional)* Restrict CORS:
   ```bash
   supabase secrets set WATCHLIST_ALLOWED_ORIGINS=https://<your-netlify-domain>,http://localhost:5173
   ```
   The default is `*`. Auth is bearer-token based, so CORS is not the security boundary.
5. Open `/admin/auction-watchlist` and click **Refresh prices**. REA and H&S lots should show live bids. Grey Flannel and Heritage show "Live refresh unavailable" and take manual prices.

## Adding lots

Use **Add lot**, then paste a lot URL from one of the four supported hosts. For REA and H&S, only the URL and auction name are needed. Title, lot number, close time, and image come from the first refresh. For Grey Flannel and Heritage, also enter a title and close time (with time zone). The lot is saved to Supabase, so it syncs across devices.
