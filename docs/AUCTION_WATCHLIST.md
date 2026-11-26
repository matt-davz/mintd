# Auction Watchlist (`/admin/auction-watchlist`)

A private, signed-in watchlist of lots across upcoming auctions. It shows current bid, time left, and close time in one place, so Zane doesn't have to switch between auction sites.

**This is private bidding intent.** The data lives only in `public.auction_watchlist_lots`. That table can't be read by `anon` (no RLS policy, table privileges revoked) and isn't joined into any public view. The page sits under `AdminGuard`, so any Clerk signed-in user can see it.

## Pieces

| Piece | Path |
|---|---|
| Migration (table, RLS, seed of Zane's 31 lots) | `supabase/migrations/0039_auction_watchlist.sql` |
| Edge Function (server-side price refresh) | `supabase/functions/auction-watchlist-refresh/index.ts` |
| Firecrawl markdown parsers + Heritage URL validation (pure) | `supabase/functions/auction-watchlist-refresh/parsers.ts` |
| Parser checks (Node, no framework) | `scripts/check-watchlist-parsers.mjs` |
| Page | `src/pages/admin/AuctionWatchlist.jsx` |
| Components | `src/components/admin/watchlist/` (`AuctionGroup`, `WatchlistLotCard`, `LotPrice`, `LotClosing`, `ManualPriceForm`, `AddLotForm`, `WatchlistToolbar`, `styles.js`) |
| Data hook | `src/hooks/useAuctionWatchlist.js` (uses `useSupabaseClient`, the Clerk JWT client) |
| Helpers (house registry, URL validation, time/price formatting) | `src/lib/auctionWatchlist.js` |

## Supported auction houses

| House | `house` key | Live refresh | Max frequency per lot | Notes |
|---|---|---|---|---|
| Robert Edward Auctions | `rea` | ✅ direct fetch | 10 min | `bid.collectrea.com/lots/{id}` |
| Huggins & Scott | `huggins_scott` | ✅ direct fetch | 10 min | `bid.hugginsandscott.com/lots/{id}` |
| Grey Flannel | `grey_flannel` | ✅ via Firecrawl, if `FIRECRAWL_API_KEY` is set; manual otherwise | 60 min | Direct server fetches get a Cloudflare challenge. URL rebuilt from the numeric item id |
| Love of the Game Auctions | `love_of_the_game` | ✅ via Firecrawl, if `FIRECRAWL_API_KEY` is set; manual otherwise | 60 min | Same CreateAuction platform as Grey Flannel. Direct server fetches get HTTP 403. `bid.loveofthegameauctions.com/bids/bidplace?itemid={id}`, rebuilt from the numeric item id |
| Leland's | `lelands` | ✅ via Firecrawl, if `FIRECRAWL_API_KEY` is set; manual otherwise | 60 min | Same CreateAuction platform as Grey Flannel. `auction.lelands.com/bids/bidplace?itemid={id}`, rebuilt from the numeric item id. Pasted `bidplace.aspx?itemid=` links are accepted and stored in the no-extension form |
| Heritage | `heritage` | ✅ via Firecrawl, if `FIRECRAWL_API_KEY` is set; manual otherwise | 60 min | Direct server fetches get a DataDome captcha. `lot_id` = `<saleNo>-<lotNo>`; stored `canonical_url` is validated before use |

REA and H&S run the same Livewire platform. The function parses each lot page for:
- `currentBid` from the `lots.lot-bidding` `wire:snapshot`, falling back to the `x-data` `currentBid:` value
- `endTime`, `status`, and `auctionPeriod` from the lot's `miniCountdown({...})`
- the first `{lotId}-1.jpg` image on the house's own Cloudinary account
- title and lot number from `<h1>Lot # N: …</h1>`, filled in only when missing

Six houses are supported. The seed holds Zane's 31 tracked lots (H&S 3, REA 18, Grey Flannel 2, Love of the Game 2, Leland's 5, Heritage 1).

### Grey Flannel, Love of the Game, Leland's, and Heritage (Firecrawl)

These houses are scraped through Firecrawl (Grey Flannel, Love of the Game, and Heritage block direct server requests; Leland's runs the same CreateAuction page and uses the same path). Grey Flannel, Love of the Game, and Leland's all run CreateAuction's `bidplace` page and share one parser (`parseCreateAuction` in `parsers.ts`), pinned to each site's own exact host. The function calls Firecrawl's scrape API (`POST https://api.firecrawl.dev/v2/scrape` with `{ url, formats: ['markdown'], maxAge: 0 }`) and parses the returned markdown in `parsers.ts`. Each scrape costs one Firecrawl credit.

- **Fetch URL.** Grey Flannel: `https://bid.greyflannelauctions.com/bids/bidplace?itemid=<lot_id>`. Love of the Game: `https://bid.loveofthegameauctions.com/bids/bidplace?itemid=<lot_id>`. Leland's: `https://auction.lelands.com/bids/bidplace?itemid=<lot_id>`. All three are rebuilt from the all-digit id on a fixed host. Heritage: the stored `canonical_url`, accepted only if `new URL()` gives https, host exactly `sports.ha.com` or `www.ha.com`, no username/password/port/query/fragment, a path `/itm/…/a/<sale>-<lot>.s` that equals the stored `lot_id`, and a serialised form identical to the stored string. `source_url` is never used.
- **Lot identity.** Nothing is written unless the scraped page is the expected lot:
  - Grey Flannel / Love of the Game / Leland's: Firecrawl's final URL must be on that house's exact host and carry the same `itemid` (`bidplace` or `bidplace.aspx`) (or, with no URL in the metadata, the page must reference `images_items/item_<lot_id>_`). The page must have exactly one `Lot # N:` heading, and `N` must match the stored `lot_number` (if set). A page from one house never satisfies another house's adapter (Leland's Prev/Next links to other item ids don't count).
  - Heritage: the final URL and `og:url` must end in `/a/<sale>-<lot>.s` on an allowed host. Every `LOT #N` marker must be the stored lot, and the sale number must appear on the page.
- **Current bid.** Read only from a line labeled **Current Bid** (Grey / Love of the Game / Leland's: `### CURRENT BID: $1,464.00`, Heritage: `Current Bid: $3,000`). `Starting Bid`, `Bid Next Minimum`, and `Minimum Next Bid` are never read as the current bid. If the page shows conflicting amounts, the check fails. On the CreateAuction sites, a current bid below the `Starting Bid` also fails the check. A `$0.00` current bid is never a live price.
- **No bids.** Heritage `Status: Starting Bid Not Met` (or 0 bidders) with a `Starting Bid`, or Grey Flannel / Love of the Game / Leland's `Bids: 0`, counts as a successful check. Love of the Game no-bid lots print `CURRENT BID: $0.00`; with `Bids: 0` that is ignored, and without a bid count a `$0.00` reading fails the check instead of being saved. It saves `current_bid = NULL`, sets `opening_bid` to the starting bid, sets `bid_source = 'live'`, and stamps `bid_checked_at`. The UI shows **No bids yet** plus "Opening bid $X". If the page shows no Current Bid and is not clearly a no-bid lot, the check fails.
- **Close time.** Heritage: the lot's session line, e.g. `(Lots 81422-82181) - 10:00 PM Central Time, Saturday, December 19, 2026.`. It is used only when the lot number falls inside the range. Grey Flannel / Love of the Game / Leland's: the auction `End:` line (`12/13/2026 8:00 PM EST`; Leland's `12/5/2026 10:00 PM EST` → `2026-12-06T03:00Z`). The zone label is ignored and the wall time is read in `America/New_York`, because Love of the Game prints `12/12/2026 9:00 PM EDT` even though December is EST (→ `2026-12-13T02:00Z`). All are converted to UTC through their IANA zone.
- **Images.** Grey Flannel: `bid.greyflannelauctions.com/images_items/item_<lot_id>_N_M.jpg`. Love of the Game: `bid.loveofthegameauctions.com/images_items/item_<lot_id>_N_M.jpg`. Leland's: `auction.lelands.com/images_items/item_<lot_id>_N_M.jpg` (verified on the lot 4 page, 2026-11-26). Images on any other host or for another item id are ignored (`image_url` stays NULL). Heritage: `og:image` normalized to `https://dyn1.heritagestatic.com/ha?p=<digits/dashes>&it=product`. The DB CHECK allows only these shapes, per house.
- **Status.** A `Time Left` countdown marks the lot `live`. Grey Flannel / Love of the Game / Leland's `Time Left: Closed/Ended` marks it `closed`. Closed Heritage lots aren't detected. After the scheduled time, the UI still says "May still be in extended bidding".

**Without `FIRECRAWL_API_KEY`**, Grey Flannel, Love of the Game, Leland's, and Heritage lots are marked `unsupported`. They show the last manual price (labeled **Manual**) or **Unavailable**, plus a direct link to the lot page. The group header shows "Manual prices". The page doesn't auto-trigger refreshes for them.

**Testing the parsers:**
```bash
node scripts/check-watchlist-parsers.mjs [grey.json] [heritage-no-bid.json] [heritage-active.json] [lotg-49085.json] [lotg-49605.json] [lelands-138859.json]
```
This needs Node ≥ 22.18 (built-in TypeScript stripping). All 25 fixture checks run against small inline fixtures in the script (minimal synthetic markdown matching the observed Grey Flannel, Love of the Game, Leland's, and Heritage page structure), so a clean checkout always runs and must pass them. The Love of the Game fixtures cover both watchlist lots (17 / item 49085, 41 / item 49605): 0 bids → no current bid, opening bid, close time, image, and rejection of the other lot / item id / house. The Leland's fixture (lot 4 / item 138859, 17 bids) covers the labelled current bid ($32,744, never the $15,000 start), close time, image, `.aspx` final URLs, rejection of the Prev/Next item ids and other hosts, and refusal of below-start / conflicting / `$0` / missing bids. Client `parseLotUrl()` is checked too: `.aspx` and no-extension Leland's links canonicalise to the same URL, and look-alike hosts, ports, credentials, and other paths are rejected. Optionally, saved full Firecrawl responses (CLI JSON or a REST v2 envelope, never committed) are run through the same lot checks too. They default to `/tmp/mintd-*-firecrawl.json`, `/tmp/lotg-<itemid>.json`, and `/tmp/lelands-<itemid>.json` and are left out if absent; a path passed explicitly must exist. The active-bid Heritage fixture (lot 50089-81457) is a parser fixture only. It is not a watchlist lot and must never be seeded.

## Honesty rules

- `current_bid` is written only after a fresh 200 response that parsed cleanly and matched the expected lot (`bid_source = 'live'`), or after an explicit manual entry (`bid_source = 'manual'`). A DB constraint requires `bid_checked_at` and `bid_source` whenever `current_bid` is set.
- The opening bid is never shown as the current bid. It goes in `opening_bid`, labeled "Opening bid", next to **No bids yet**.
- A failed refresh keeps the last verified price (and `bid_checked_at`, so it goes stale). It records `refresh_status` (`blocked` / `error`) and `last_error`. The card shows the error and when the last attempt was made.
- The seed sets no prices. Every lot shows **Unavailable** until the first refresh.
- Stale readings are flagged: older than 60 min, or older than 15 min once the lot is within 24 h of its scheduled close. Firecrawl-scraped houses can only refresh hourly, so their threshold is never below 90 min. Every reading shows "Checked Xm ago".
- Countdowns are to the **scheduled** close. REA and H&S are labeled "Until extended bidding". Other houses (Grey Flannel, Love of the Game, Leland's, Heritage) are labeled "Extended bidding may apply"; Love of the Game requires a bid before 9 PM ET to enter its 15-minute auction-wide extended bidding. After the scheduled time the UI says "May still be in extended bidding". It says closed only if the last refresh reported `lot_status = 'closed'`.

## Security

- **SSRF:** the function never fetches a URL from the request, and never uses `source_url`. For REA, H&S, Grey Flannel, Love of the Game, and Leland's it builds the URL from `(house, lot_id)` with a fixed https host, and `lot_id` must be all digits. For Heritage it re-validates the stored `canonical_url` with the URL parser (see above), on top of the table's CHECK constraint. Direct fetches don't follow redirects (`redirect: 'manual'`), are capped at 2 MB, and time out after 12 s. Firecrawl calls go only to the fixed `api.firecrawl.dev` endpoint. They time out after 45 s, responses are capped at 4 MB, and the scraped page must identify the expected lot. Client-side `parseLotUrl()` and the table's CHECK constraints pin the same hosts and URL shapes.
- **Firecrawl key:** read only from the Edge secret `FIRECRAWL_API_KEY` (`Deno.env`). It is never stored in the repo, the DB, or the client, and never echoed in responses or `last_error`. The response only says `firecrawl_configured: true/false`.
- **Auth:** the function rejects requests without a non-expired `role: authenticated` bearer token. It then runs all reads and writes through PostgREST **as the caller**, using the anon key plus the caller's Clerk JWT, so RLS applies. PostgREST verifies the token signature through the Clerk third-party auth integration. **The service role key is not used.**
- **Rate limiting / credits:** REA and H&S lots are fetched at most once every 10 minutes. Grey Flannel, Love of the Game, Leland's, and Heritage lots are fetched at most once every **60 minutes**. Both are tracked in `refresh_attempted_at`. The slot is claimed *before* fetching, so a failed scrape also waits the full interval instead of retrying and burning credits. Concurrency is 3 (direct) and 2 (Firecrawl). Each call handles at most 60 lots and at most 6 Firecrawl scrapes; extra lots are reported as `deferred`, nearest close first. The page auto-refreshes once per visit, and only when some lot is due. Adding a lot from one of these houses triggers one scrape.

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
   `SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected automatically. `parsers.ts` is bundled with the function.
4. *(Optional, after Matt's review)* Turn on Grey Flannel, Love of the Game, Leland's, and Heritage live refresh by setting `FIRECRAWL_API_KEY` as a Supabase Edge Function secret. Matt: at deployment time, open `~/.openclaw/secrets.json` on the server, read the existing Firecrawl key there, and enter it as the value of the `FIRECRAWL_API_KEY` secret (Supabase dashboard → Edge Functions → Secrets, or `supabase secrets set`). The key itself is never written down here or anywhere else in the repo. Don't copy it into source, docs, `.env.local`, any `VITE_*` variable, a committed script, or shell history you share. Confirm it's set (names only, no values) with:
   ```bash
   supabase secrets list
   ```
   No redeploy is needed for secrets. If you skip this step, those four houses stay in manual-entry mode. Expect at most about 24 credits per lot per day, and only while the page is open: refreshes run on page visit or **Refresh prices**, not on a schedule. Remove the key with `supabase secrets unset FIRECRAWL_API_KEY` to go back to manual mode.
5. *(Optional)* Restrict CORS:
   ```bash
   supabase secrets set WATCHLIST_ALLOWED_ORIGINS=https://<your-netlify-domain>,http://localhost:5173
   ```
   The default is `*`. Auth is bearer-token based, so CORS is not the security boundary.
6. Open `/admin/auction-watchlist` and click **Refresh prices**. REA and H&S lots should show live bids. With the Firecrawl key set, Grey Flannel lot 150 shows its current bid and Heritage lot 81460 shows "No bids yet · Opening bid $2,000", Love of the Game lots 17 and 41 show "No bids yet" with opening bids $2,500 and $1,000, and Leland's lot 4 shows its current bid ($32,744 with 17 bids on 2026-11-26; the live value will differ) (as of the samples). Leland's lots 636, 663, 1017, and 1061 show whatever their pages report on that refresh (current bid, or "No bids yet" plus opening bid). With 10 Firecrawl-scraped lots and a cap of 6 scrapes per call, the first refresh reports 4 as `deferred` (nearest close first); click **Refresh prices** again to pick them up. Without the key, they show the manual-mode notice and take manual prices.

## Adding lots

Use **Add lot**, then paste a lot URL from one of the six supported hosts. For REA and H&S, only the URL and auction name are needed. Title, lot number, close time, and image come from the first refresh. For Grey Flannel, Love of the Game, Leland's, and Heritage, the first refresh fills these in too, but only when `FIRECRAWL_API_KEY` is set. Without it, enter a title and close time (with time zone) yourself. For Grey Flannel, Love of the Game, and Leland's, entering the lot number also lets the refresh check it against the page. The lot is saved to Supabase, so it syncs across devices.
